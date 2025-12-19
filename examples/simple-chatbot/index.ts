// Load .env FIRST before any other imports
import { config } from "dotenv";
import * as path from "node:path";
config({ path: path.resolve(process.cwd(), "../../.env") });

import { createAgent } from "@runmesh/agent";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";
import * as readline from "node:readline/promises";

// Setup
const client = createFromProvider(
  createOpenRouterConfig(process.env.OPENROUTER_API_KEY!, "claude-3.5-sonnet")
);

const agent = createAgent({
  name: "chatbot",
  client,
  model: "anthropic/claude-3.5-sonnet",
  systemPrompt: "You are a helpful and friendly chatbot. Be concise but informative."
});

// Interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("🤖 RunMesh Chatbot");
console.log("Type your message and press Enter. Type 'exit' to quit.\n");

async function chat() {
  while (true) {
    const question = await rl.question("You: ");

    if (question.toLowerCase() === "exit") {
      console.log("Goodbye! 👋");
      rl.close();
      process.exit(0);
    }

    try {
      const result = await agent.run(question);
      const response = result.response.choices[0]?.message?.content || "No response";
      console.log(`\nBot: ${response}\n`);
    } catch (error) {
      console.error("\n❌ Error:", error instanceof Error ? error.message : error);
      if (error instanceof Error && error.cause) {
        console.error("Cause:", error.cause);
      }
      console.error("\nDebug info:");
      console.error("- API Key set:", !!process.env.OPENROUTER_API_KEY);
      console.error("- API Key starts with:", process.env.OPENROUTER_API_KEY?.substring(0, 10) + "...");
      console.error();
    }
  }
}

chat().catch(console.error);
