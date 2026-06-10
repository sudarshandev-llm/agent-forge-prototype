import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  capabilities: string[];
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  selectAgent: (agent: Agent | null) => void;
  createAgent: (data: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  executeAgent: (id: string, input: unknown) => Promise<unknown>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  selectedAgent: null,
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.agents.list();
      set({ agents: response.data as Agent[], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch agents',
        isLoading: false,
      });
    }
  },

  selectAgent: (agent) => {
    set({ selectedAgent: agent });
  },

  createAgent: async (data) => {
    const response = await apiClient.agents.create(data);
    const agent = response.data as Agent;
    set((state) => ({ agents: [...state.agents, agent] }));
    return agent;
  },

  updateAgent: async (id, data) => {
    const response = await apiClient.agents.update(id, data);
    const updated = response.data as Agent;
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? updated : a)),
      selectedAgent: state.selectedAgent?.id === id ? updated : state.selectedAgent,
    }));
  },

  deleteAgent: async (id) => {
    await apiClient.agents.delete(id);
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
      selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
    }));
  },

  executeAgent: async (id, input) => {
    const response = await apiClient.agents.execute(id, { input });
    return response.data;
  },
}));
