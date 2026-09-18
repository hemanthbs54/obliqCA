import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DocumentDetail, DocumentRecord, SignedUrlResponse } from '@obliq/shared';
import { env } from '../../config/env.js';
import { ApiError, toApiError, unwrap, type PostgrestLikeError } from '../../lib/errors.js';
import { notFound } from '../../lib/access.js';
import { hydrateDocuments, loadPeople, withUploader } from '../../lib/hydrate.js';
import { checkUpload } from '../../lib/file-validation.js';

async function findDocument(request: FastifyRequest, documentId: string): Promise<DocumentRecord> {
  const doc = unwrap(await request.db.from('documents').select('*').eq('id', documentId).maybeSingle());
  if (!doc) return notFound(request, 'document', documentId);
  return doc;
}

async function rethrow(request: FastifyRequest, documentId: string, error: PostgrestLikeError): Promise<never> {
  if (error.code === 'PT404') return notFound(request, 'document', documentId);
  throw toApiError(error);
}

export async function getDocumentDetail(request: FastifyRequest, documentId: string): Promise<DocumentDetail> {
  const doc = await findDocument(request, documentId);
  const { db } = request;

  const [people, client, versions, decisions] = await Promise.all([
    loadPeople(db),
    db.from('clients').select('id, name').eq('id', doc.client_id).single().then(unwrap),
    db.from('document_versions').select('*').eq('document_id', documentId).order('version_no', { ascending: false }).then(unwrap),
    db.from('review_decisions').select('*').eq('document_id', documentId).order('created_at', { ascending: false }).then(unwrap),
  ]);

  const [hydrated] = await hydrateDocuments(db, [doc], people);
  return {
    ...hydrated!,
    client,
    versions: versions.map((v) => withUploader(v, people)),
    decisions: decisions.map((d) => ({ ...d, reviewer: people.get(d.reviewer_id) ?? null })),
  };
}

export async function uploadVersion(
  fastify: FastifyInstance,
  request: FastifyRequest,
  documentId: string,
  file: { fileName: string; buffer: Buffer; responseNote: string | null },
): Promise<DocumentDetail> {
  // 1. Authorise through RLS before touching storage.
  const doc = await findDocument(request, documentId);

  // 2. Validate the bytes, not the client's claims.
  const check = checkUpload(file.fileName, file.buffer);
  if (!check.ok) throw new ApiError(check.statusCode, check.message);

  // 3. Store under the firm/client/document prefix (the DB re-checks this).
  const storagePath = `${doc.firm_id}/${doc.client_id}/${doc.id}/${Date.now()}-${randomUUID().slice(0, 8)}-${check.safeName}`;
  const bucket = fastify.supabaseAdmin.storage.from(env.STORAGE_BUCKET);
  const { error: uploadError } = await bucket.upload(storagePath, file.buffer, {
    contentType: check.mimeType,
    upsert: false,
  });
  if (uploadError) {
    request.log.error(uploadError, 'storage upload failed');
    throw new ApiError(502, 'Could not store the file. Please try again.');
  }

  // 4. Record the version + status change + audit event in one DB transaction.
  const { error } = await request.db.rpc('record_document_upload', {
    p_document_id: documentId,
    p_storage_path: storagePath,
    p_file_name: check.safeName,
    p_mime_type: check.mimeType,
    p_size_bytes: check.sizeBytes,
    p_sha256: check.sha256,
    p_response_note: file.responseNote ?? undefined,
  });
  if (error) {
    // Don't leave an orphaned object behind if the database refused.
    await bucket.remove([storagePath]);
    return rethrow(request, documentId, error);
  }

  return getDocumentDetail(request, documentId);
}

export async function createSignedUrl(
  fastify: FastifyInstance,
  request: FastifyRequest,
  documentId: string,
  versionId: string,
  download: boolean,
): Promise<SignedUrlResponse> {
  await findDocument(request, documentId);
  const { data: version, error: versionError } = await request.db
    .from('document_versions')
    .select('storage_path, file_name')
    .eq('id', versionId)
    .eq('document_id', documentId)
    .maybeSingle();
  if (versionError) throw toApiError(versionError);
  if (!version) throw new ApiError(404, 'Version not found');

  const { data, error } = await fastify.supabaseAdmin.storage
    .from(env.STORAGE_BUCKET)
    .createSignedUrl(version.storage_path, env.SIGNED_URL_TTL_SECONDS, download ? { download: version.file_name } : undefined);
  if (error || !data) throw new ApiError(502, 'Could not create a download link');

  return { url: data.signedUrl, expiresInSeconds: env.SIGNED_URL_TTL_SECONDS };
}

type ReviewCommand =
  | { kind: 'start_review'; expectedRowVersion: number }
  | { kind: 'approve'; expectedRowVersion: number; comment?: string }
  | { kind: 'request_correction'; expectedRowVersion: number; comment: string };

export async function runReviewCommand(
  request: FastifyRequest,
  documentId: string,
  command: ReviewCommand,
): Promise<DocumentDetail> {
  const { db } = request;
  const result =
    command.kind === 'start_review'
      ? await db.rpc('start_review', { p_document_id: documentId, p_expected_row_version: command.expectedRowVersion })
      : command.kind === 'approve'
        ? await db.rpc('approve_document', {
            p_document_id: documentId,
            p_expected_row_version: command.expectedRowVersion,
            p_comment: command.comment || undefined,
          })
        : await db.rpc('request_correction', {
            p_document_id: documentId,
            p_expected_row_version: command.expectedRowVersion,
            p_comment: command.comment,
          });

  if (result.error) return rethrow(request, documentId, result.error);
  return getDocumentDetail(request, documentId);
}
