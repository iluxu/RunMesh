import { createAgent } from "@runmesh/agent";
import { tool, ToolRegistry } from "@runmesh/tools";
import { z } from "zod";

const tools = new ToolRegistry();

tools.register(
  tool({
    name: "echo_topic",
    description: "Echo the topic with extra emphasis for debugging.",
    schema: z.object({ topic: z.string() }),
    handler: ({ topic }) => `Topic received: ${topic}`
  })
);

const agent = createAgent({
  name: "demo-cli-agent",
  model: process.env.OPENAI_MODEL ?? "gpt-5.2",
  systemPrompt: "You are a concise French assistant. Use tools when helpful.",
  tools
});

const prompt = process.argv.slice(2).join(" ") || "Explique RunMesh en 3 bullet points";

async function main() {
  console.log(`Prompt: ${prompt}\n---`);
  const stream = await agent.stream(prompt);
  for await (const event of stream) {
    if (event.type === "token") {
      process.stdout.write(event.value);
    } else if (event.type === "tool_call") {
      console.log(
        `\n[tool_call] ${event.toolCall.function.name} ${event.toolCall.function.arguments}`
      );
    } else if (event.type === "final") {
      console.log("\n\n[final]", event.message.content);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
