'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AgentRun, RunComplianceAgentResponse } from '@obliq/shared';

export function useAgentRuns(clientId: string) {
  return useQuery({
    queryKey: ['agent-runs', clientId],
    queryFn: () => api.get<AgentRun[]>(`/api/clients/${clientId}/agent/runs`),
    enabled: Boolean(clientId),
  });
}

export function useRunComplianceAgent(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<RunComplianceAgentResponse>('/api/agent/run', { clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-runs', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
