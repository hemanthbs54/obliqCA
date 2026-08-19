'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DocumentRecord, DocumentType } from '@obliq/shared';

export function useDocuments(clientId: string) {
  return useQuery({
    queryKey: ['documents', clientId],
    queryFn: () => api.get<DocumentRecord[]>(`/api/clients/${clientId}/documents`),
    enabled: Boolean(clientId),
    refetchInterval: (query) => {
      const docs = query.state.data;
      const stillProcessing = docs?.some((d) => d.status === 'uploaded' || d.status === 'processing');
      return stillProcessing ? 2000 : false;
    },
  });
}

export function useUploadDocument(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, docType }: { file: File; docType: DocumentType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      return api.post<DocumentRecord>(`/api/clients/${clientId}/documents`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
    },
  });
}

export function useDeleteDocument(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => api.delete(`/api/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
    },
  });
}
