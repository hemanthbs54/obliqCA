import type {
  DocumentListItem,
  DocumentRecord,
  DocumentVersion,
  DocumentVersionWithUploader,
  PersonRef,
  TypedSupabaseClient,
} from '@obliq/shared';
import { unwrap } from './errors.js';

export type PeopleById = Map<string, PersonRef>;

/** Everyone the caller can see in their firm (RLS-scoped). Firms are small, so one query. */
export async function loadPeople(db: TypedSupabaseClient): Promise<PeopleById> {
  const rows = unwrap(await db.from('profiles').select('id, full_name'));
  return new Map(rows.map((p) => [p.id, p]));
}

export function withUploader(version: DocumentVersion, people: PeopleById): DocumentVersionWithUploader {
  return { ...version, uploaded_by_profile: people.get(version.uploaded_by) ?? null };
}

/** Attaches current version (+ uploader) and reviewer to plain document rows. */
export async function hydrateDocuments(
  db: TypedSupabaseClient,
  documents: DocumentRecord[],
  people?: PeopleById,
): Promise<DocumentListItem[]> {
  const peopleById = people ?? (await loadPeople(db));
  const versionIds = documents.map((d) => d.current_version_id).filter((id): id is string => Boolean(id));

  const versions = versionIds.length
    ? unwrap(await db.from('document_versions').select('*').in('id', versionIds))
    : [];
  const versionsById = new Map(versions.map((v) => [v.id, v]));

  return documents.map((doc) => {
    const version = doc.current_version_id ? versionsById.get(doc.current_version_id) : undefined;
    return {
      ...doc,
      current_version: version ? withUploader(version, peopleById) : null,
      reviewer: doc.reviewer_id ? (peopleById.get(doc.reviewer_id) ?? null) : null,
    };
  });
}
