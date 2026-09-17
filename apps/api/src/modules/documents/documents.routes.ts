import type { FastifyInstance } from 'fastify';
import { requireCapability } from '../../plugins/auth.js';
import { ApiError } from '../../lib/errors.js';
import {
  approveBody,
  documentIdParams,
  requestCorrectionBody,
  signedUrlQuery,
  startReviewBody,
  versionParams,
} from './documents.schema.js';
import * as documentsService from './documents.service.js';

export default async function documentsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/documents/:id', async (request) => {
    const { id } = documentIdParams.parse(request.params);
    return documentsService.getDocumentDetail(request, id);
  });

  fastify.post(
    '/api/documents/:id/versions',
    { preHandler: requireCapability('document.upload') },
    async (request, reply) => {
      const { id } = documentIdParams.parse(request.params);
      const part = await request.file();
      if (!part) throw new ApiError(400, 'Attach a file in the "file" field');

      const buffer = await part.toBuffer();
      if (part.file.truncated) throw new ApiError(413, 'File is larger than the 15 MB limit');

      const noteField = part.fields.responseNote;
      const responseNote =
        noteField && 'value' in noteField ? String(noteField.value).trim().slice(0, 2000) || null : null;

      const detail = await documentsService.uploadVersion(fastify, request, id, {
        fileName: part.filename,
        buffer,
        responseNote,
      });
      return reply.code(201).send(detail);
    },
  );

  fastify.get('/api/documents/:id/versions/:versionId/url', async (request) => {
    const { id, versionId } = versionParams.parse(request.params);
    const { download } = signedUrlQuery.parse(request.query);
    return documentsService.createSignedUrl(fastify, request, id, versionId, download);
  });

  fastify.post(
    '/api/documents/:id/start-review',
    { preHandler: requireCapability('document.review') },
    async (request) => {
      const { id } = documentIdParams.parse(request.params);
      const body = startReviewBody.parse(request.body);
      return documentsService.runReviewCommand(request, id, { kind: 'start_review', ...body });
    },
  );

  fastify.post(
    '/api/documents/:id/approve',
    { preHandler: requireCapability('document.review') },
    async (request) => {
      const { id } = documentIdParams.parse(request.params);
      const body = approveBody.parse(request.body);
      return documentsService.runReviewCommand(request, id, { kind: 'approve', ...body });
    },
  );

  fastify.post(
    '/api/documents/:id/request-correction',
    { preHandler: requireCapability('document.review') },
    async (request) => {
      const { id } = documentIdParams.parse(request.params);
      const body = requestCorrectionBody.parse(request.body);
      return documentsService.runReviewCommand(request, id, { kind: 'request_correction', ...body });
    },
  );
}
