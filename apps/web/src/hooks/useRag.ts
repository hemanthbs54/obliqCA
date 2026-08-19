'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RagQuery, RagQueryRequest, RagQueryResponse } from '@obliq/shared';

export function useRagHistory(clientId: string) {
  return useQuery({
    queryKey: ['rag-history', clientId],
    queryFn: () => api.get<RagQuery[]>(`/api/clients/${clientId}/rag/history`),
    enabled: Boolean(clientId),
  });
}

export function useRagQuery(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<RagQueryRequest, 'clientId'>) =>
      api.post<RagQueryResponse>('/api/rag/query', { ...input, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-history', clientId] });
    },
  });
}
