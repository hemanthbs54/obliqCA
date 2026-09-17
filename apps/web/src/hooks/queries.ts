'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AuditAction,
  AuditChainVerification,
  AuditEvent,
  AuditEventPage,
  ClientDetail,
  ClientSummary,
  CreateClientRequest,
  DocumentDetail,
  FirmMember,
  MeResponse,
  QueueResponse,
  SignedUrlResponse,
} from '@obliq/shared';
import { api, toQueryString } from '@/lib/api';

export const queryKeys = {
  me: ['me'] as const,
  members: ['members'] as const,
  queue: ['queue'] as const,
  clients: ['clients'] as const,
  client: (id: string) => ['clients', id] as const,
  document: (id: string) => ['documents', id] as const,
  documentTimeline: (id: string) => ['documents', id, 'timeline'] as const,
  audit: (filters: AuditFilterState) => ['audit', filters] as const,
  auditVerify: ['audit', 'verify'] as const,
};

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => api.get<MeResponse>('/api/me'), staleTime: 5 * 60_000 });
}

export function useMembers(enabled = true) {
  return useQuery({ queryKey: queryKeys.members, queryFn: () => api.get<FirmMember[]>('/api/members'), enabled });
}

export function useQueue() {
  return useQuery({ queryKey: queryKeys.queue, queryFn: () => api.get<QueueResponse>('/api/queue') });
}

export function useClients() {
  return useQuery({ queryKey: queryKeys.clients, queryFn: () => api.get<ClientSummary[]>('/api/clients') });
}

export function useClient(id: string) {
  return useQuery({ queryKey: queryKeys.client(id), queryFn: () => api.get<ClientDetail>(`/api/clients/${id}`), retry: false });
}

export function useDocument(id: string) {
  return useQuery({ queryKey: queryKeys.document(id), queryFn: () => api.get<DocumentDetail>(`/api/documents/${id}`), retry: false });
}

export function useDocumentTimeline(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.documentTimeline(id),
    queryFn: () => api.get<AuditEvent[]>(`/api/documents/${id}/audit-events`),
    enabled,
    retry: false,
  });
}

/** Everything a workflow change can affect. Cheap to refetch at this scale. */
function useInvalidateWorkflow() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.clients }),
      queryClient.invalidateQueries({ queryKey: queryKeys.queue }),
      queryClient.invalidateQueries({ queryKey: ['audit'] }),
    ]);
}

export function useCreateClient() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({
    mutationFn: (body: CreateClientRequest) => api.post<ClientDetail>('/api/clients', body),
    onSuccess: invalidate,
  });
}

export function useAssignStaff(clientId: string) {
  const invalidate = useInvalidateWorkflow();
  return useMutation({
    mutationFn: (userId: string) => api.post<ClientDetail>(`/api/clients/${clientId}/assignments`, { userId }),
    onSuccess: invalidate,
  });
}

export function useAddDocument(clientId: string) {
  const invalidate = useInvalidateWorkflow();
  return useMutation({
    mutationFn: (name: string) => api.post<ClientDetail>(`/api/clients/${clientId}/documents`, { name }),
    onSuccess: invalidate,
  });
}

export function useUploadVersion(documentId: string) {
  const invalidate = useInvalidateWorkflow();
  return useMutation({
    mutationFn: ({ file, responseNote }: { file: File; responseNote?: string }) => {
      const form = new FormData();
      if (responseNote) form.append('responseNote', responseNote);
      form.append('file', file);
      return api.post<DocumentDetail>(`/api/documents/${documentId}/versions`, form);
    },
    onSuccess: invalidate,
  });
}

export type ReviewCommand =
  | { kind: 'start-review'; expectedRowVersion: number }
  | { kind: 'approve'; expectedRowVersion: number; comment?: string }
  | { kind: 'request-correction'; expectedRowVersion: number; comment: string };

export function useReviewCommand(documentId: string) {
  const invalidate = useInvalidateWorkflow();
  return useMutation({
    mutationFn: ({ kind, ...body }: ReviewCommand) => api.post<DocumentDetail>(`/api/documents/${documentId}/${kind}`, body),
    // Refetch on failure too: a 409 means our copy is stale.
    onSettled: invalidate,
  });
}

export function getVersionUrl(documentId: string, versionId: string, download: boolean) {
  return api.get<SignedUrlResponse>(`/api/documents/${documentId}/versions/${versionId}/url${download ? '?download=1' : ''}`);
}

export interface AuditFilterState {
  clientId?: string;
  actorId?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
}

export function auditQueryString(filters: AuditFilterState, extra: Record<string, string | number | undefined> = {}) {
  return toQueryString({ ...filters, ...extra });
}

export function useAuditEvents(filters: AuditFilterState) {
  return useInfiniteQuery({
    queryKey: queryKeys.audit(filters),
    queryFn: ({ pageParam }) =>
      api.get<AuditEventPage>(`/api/audit-events${auditQueryString(filters, { beforeSeq: pageParam, limit: 50 })}`),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextBeforeSeq ?? undefined,
  });
}

export function useVerifyChain() {
  return useQuery({
    queryKey: queryKeys.auditVerify,
    queryFn: () => api.get<AuditChainVerification>('/api/audit-events/verify'),
  });
}
