'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ClientWithStatus, Client } from '@obliq/shared';

export interface CreateClientInput {
  name: string;
  clientType: string;
  pan?: string;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export function useClients(filters: { search?: string; status?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();

  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => api.get<ClientWithStatus[]>(`/api/clients${qs ? `?${qs}` : ''}`),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => api.post<Client>('/api/clients', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
