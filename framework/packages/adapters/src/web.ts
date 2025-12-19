import { Agent } from "@runmesh/agent";

export type WebAdapterOptions = {
  agent: Agent;
};

export async function handleHttpRequest(options: WebAdapterOptions, prompt: string) {
  const result = await options.agent.run(prompt);
  return {
    status: 200,
    body: result.response.choices[0]?.message
  };
}
