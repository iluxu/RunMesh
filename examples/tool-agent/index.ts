import { createAgent } from "@runmesh/agent";
import { tool, ToolRegistry } from "@runmesh/tools";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";
import { z } from "zod";

// Setup client
const client = createFromProvider(
  createOpenRouterConfig(process.env.OPENROUTER_API_KEY!, "claude-3.5-sonnet")
);

// Create tool registry
const tools = new ToolRegistry();

// Calculator tool
tools.register(
  tool({
    name: "calculate",
    description:
      "Perform mathematical calculations. Supports basic operations: +, -, *, /, **, sqrt(), etc.",
    schema: z.object({
      expression: z.string().describe("Math expression to evaluate (e.g., '2 + 2', 'sqrt(16)')")
    }),
    handler: async ({ expression }) => {
      try {
        // In production, use a proper math parser!
        const result = eval(expression);
        return {
          expression,
          result,
          success: true
        };
      } catch (error) {
        return {
          expression,
          error: "Invalid mathematical expression",
          success: false
        };
      }
    }
  })
);

// Weather tool (mock)
tools.register(
  tool({
    name: "get_weather",
    description: "Get current weather information for a city",
    schema: z.object({
      city: z.string().describe("City name"),
      country: z.string().optional().describe("Country code (optional)")
    }),
    handler: async ({ city, country }) => {
      // Mock data - in production, call a real API
      const conditions = ["sunny", "cloudy", "rainy", "snowy"];
      const temp = Math.floor(Math.random() * 30) + 10;
      const condition = conditions[Math.floor(Math.random() * conditions.length)];

      return {
        city,
        country: country || "Unknown",
        temperature: temp,
        condition,
        humidity: Math.floor(Math.random() * 40) + 40,
        success: true
      };
    }
  })
);

// Web search tool (mock)
tools.register(
  tool({
    name: "web_search",
    description: "Search the web for information",
    schema: z.object({
      query: z.string().describe("Search query"),
      limit: z.number().default(5).describe("Number of results")
    }),
    handler: async ({ query, limit }) => {
      // Mock results - in production, call a real search API
      const results = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
        title: `Result ${i + 1} for "${query}"`,
        url: `https://example.com/result${i + 1}`,
        snippet: `This is a mock search result about ${query}...`
      }));

      return {
        query,
        results,
        totalResults: results.length,
        success: true
      };
    }
  })
);

// Time/Date tool
tools.register(
  tool({
    name: "get_current_time",
    description: "Get the current date and time in a specific timezone",
    schema: z.object({
      timezone: z
        .string()
        .default("UTC")
        .describe("Timezone (e.g., 'America/New_York', 'Europe/Paris')")
    }),
    handler: async ({ timezone }) => {
      try {
        const date = new Date();
        const time = date.toLocaleString("en-US", {
          timeZone: timezone,
          dateStyle: "full",
          timeStyle: "long"
        });

        return {
          timezone,
          time,
          timestamp: date.getTime(),
          success: true
        };
      } catch (error) {
        return {
          timezone,
          error: "Invalid timezone",
          success: false
        };
      }
    }
  })
);

// Create agent with tools
const agent = createAgent({
  name: "tool-agent",
  client,
  model: "anthropic/claude-3.5-sonnet",
  systemPrompt: `You are a helpful assistant with access to various tools.
Use tools when needed to answer questions accurately.
Always explain what you're doing and show your calculations.`,
  tools,
  maxToolRounds: 5 // Allow up to 5 tool calls per conversation
});

// Demo queries
const queries = [
  "What's 123 * 456 + 789?",
  "What's the weather like in Paris?",
  "Search the web for 'TypeScript frameworks'",
  "What time is it in Tokyo right now?"
];

console.log("🤖 Tool-Using Agent Demo\n");

for (const query of queries) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📝 Query: ${query}`);
  console.log("=".repeat(60));

  try {
    const result = await agent.run(query);
    const response = result.response.choices[0]?.message?.content || "No response";

    console.log(`\n🤖 Response:\n${response}\n`);

    // Show tool usage
    const toolSteps = result.steps.filter((s) => s.type === "tool");
    if (toolSteps.length > 0) {
      console.log(`\n🔧 Tools Used:`);
      toolSteps.forEach((step) => {
        if (step.type === "tool") {
          console.log(`  - ${step.name}`);
        }
      });
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log("✅ Demo complete!");
