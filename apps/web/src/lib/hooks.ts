'use client';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from './api-client';

// Agent hooks
export function useAgents(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => apiClient.agents.list(params),
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => apiClient.agents.get(id),
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiClient.agents.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries('agents');
    },
  });
}

export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiClient.agents.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', id]);
      queryClient.invalidateQueries('agents');
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.agents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries('agents');
    },
  });
}

export function useExecuteAgent() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: unknown }) =>
      apiClient.agents.execute(id, input),
  });
}

// Team hooks
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => apiClient.teams.list(),
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => apiClient.teams.get(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiClient.teams.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries('teams');
    },
  });
}

// Marketplace hooks
export function useMarketplaceListings(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['marketplace', params],
    queryFn: () => apiClient.marketplace.list(params),
  });
}

export function useMarketplaceListing(id: string) {
  return useQuery({
    queryKey: ['marketplace', id],
    queryFn: () => apiClient.marketplace.get(id),
    enabled: !!id,
  });
}

export function usePublishListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiClient.marketplace.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries('marketplace');
    },
  });
}

// Tool hooks
export function useTools(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['tools', params],
    queryFn: () => apiClient.tools.list(params),
  });
}

export function useTool(id: string) {
  return useQuery({
    queryKey: ['tool', id],
    queryFn: () => apiClient.tools.get(id),
    enabled: !!id,
  });
}

export function useCreateTool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiClient.tools.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries('tools');
    },
  });
}

// Workflow hooks
export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => apiClient.workflows.list(),
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => apiClient.workflows.get(id),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiClient.workflows.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries('workflows');
    },
  });
}

export function useUpdateWorkflow(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiClient.workflows.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow', id]);
      queryClient.invalidateQueries('workflows');
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.workflows.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries('workflows');
    },
  });
}

export function useRunWorkflow() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: unknown }) =>
      apiClient.workflows.run(id, input),
  });
}

// Analytics hooks
export function useAgentAnalytics(agentId: string) {
  return useQuery({
    queryKey: ['analytics', 'agent', agentId],
    queryFn: () => apiClient.analytics.agents(agentId),
    enabled: !!agentId,
  });
}

export function useSystemAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'system'],
    queryFn: () => apiClient.analytics.system(),
  });
}

export function useUsageAnalytics(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['analytics', 'usage', params],
    queryFn: () => apiClient.analytics.usage(params),
  });
}
