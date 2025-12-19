import { ChatMessage } from "@runmesh/core";

export type MemoryMessage = ChatMessage & { timestamp: number };

export interface MemoryAdapter {
  add(agent: string, message: ChatMessage): Promise<void>;
  history(agent: string, limit?: number): Promise<MemoryMessage[]>;
}

export class InMemoryAdapter implements MemoryAdapter {
  private readonly store = new Map<string, MemoryMessage[]>();

  async add(agent: string, message: ChatMessage): Promise<void> {
    const timeline = this.store.get(agent) ?? [];
    timeline.push({ ...message, timestamp: Date.now() });
    this.store.set(agent, timeline);
  }

  async history(agent: string, limit = 20): Promise<MemoryMessage[]> {
    const timeline = this.store.get(agent) ?? [];
    return timeline.slice(-limit);
  }
}
