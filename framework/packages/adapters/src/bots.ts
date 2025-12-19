import { Agent } from "@runmesh/agent";

export type BotAdapterOptions = {
  agent: Agent;
};

export async function handleBotMessage(options: BotAdapterOptions, prompt: string) {
  return options.agent.run(prompt);
}
