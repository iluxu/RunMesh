import { Agent } from "@runmesh/agent";

export type CliAdapterOptions = {
  agent: Agent;
  onOutput?: (text: string) => void;
};

export async function runCli(options: CliAdapterOptions, prompt: string) {
  const result = await options.agent.run(prompt);
  const content = result.response.choices[0]?.message?.content ?? "";
  options.onOutput?.(typeof content === "string" ? content : JSON.stringify(content));
}
