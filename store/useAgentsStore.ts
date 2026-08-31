import { create } from 'zustand';
import { listAgents, Agent } from '@/services/adminApi';

type State = {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  refresh: () => Promise<void>;
};

export const useAgentsStore = create<State>((set) => ({
  agents: [],
  loading: false,
  error: null,
  lastFetchedAt: null,

  refresh: async () => {
    set({ loading: true, error: null });
    const result = await listAgents();
    if (result.ok) {
      set({ agents: result.agents, loading: false, lastFetchedAt: new Date().toISOString() });
    } else {
      set({ loading: false, error: result.reason });
    }
  },
}));
