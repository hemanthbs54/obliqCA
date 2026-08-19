'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ClientFiling, FilingType, Task } from '@obliq/shared';

interface ClientFilingWithType extends ClientFiling {
  filing_type: FilingType;
}

export function useFilingTypes() {
  return useQuery({
    queryKey: ['filing-types'],
    queryFn: () => api.get<FilingType[]>('/api/filing-types'),
    staleTime: Infinity,
  });
}

export function useClientFilings(clientId: string) {
  return useQuery({
    queryKey: ['client-filings', clientId],
    queryFn: () => api.get<ClientFilingWithType[]>(`/api/clients/${clientId}/filings`),
    enabled: Boolean(clientId),
  });
}

export function useAttachFiling(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { filingTypeId: string; frequencyOverride?: string }) =>
      api.post(`/api/clients/${clientId}/filings`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-filings', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-tasks', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useClientTasks(clientId: string) {
  return useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: () => api.get<Task[]>(`/api/clients/${clientId}/tasks`),
    enabled: Boolean(clientId),
  });
}

export function useUpdateTask(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...input }: { taskId: string; status?: string; notes?: string }) =>
      api.patch<Task>(`/api/tasks/${taskId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-tasks', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
