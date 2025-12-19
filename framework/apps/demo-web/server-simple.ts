/**
 * RunMesh Demo Server - Simple Example
 * Shows basic agent interactions without external dependencies
 */

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createAgent } from "@runmesh/agent";
import { tool, ToolRegistry } from "@runmesh/tools";
import { createOpenAI, generateStructuredOutput } from "@runmesh/core";
import { InMemoryAdapter } from "@runmesh/memory";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8787;

// Session storage for multi-turn conversations
const sessions = new Map<
  string,
  { messages: Array<{ role: "user" | "assistant"; content: string }> }
>();

// Create OpenAI client
const client = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: process.env.OPENAI_MODEL || "gpt-4o"
});

// Define example tools
const tools = new ToolRegistry();

tools.register(
  tool({
    name: "get_current_time",
    description: "Get the current time in a specific timezone",
    schema: z.object({
      timezone: z
        .string()
        .default("UTC")
        .describe("Timezone (e.g., 'America/New_York', 'Europe/Paris')")
    }),
    handler: async ({ timezone }) => {
      try {
        const time = new Date().toLocaleString("en-US", { timeZone: timezone });
        return { timezone, time, success: true };
      } catch {
        return { timezone, time: null, success: false, error: "Invalid timezone" };
      }
    }
  })
);

tools.register(
  tool({
    name: "calculate",
    description: "Perform a mathematical calculation",
    schema: z.object({
      expression: z.string().describe("Mathematical expression (e.g., '2 + 2', '10 * 5')")
    }),
    handler: async ({ expression }) => {
      try {
        // Simple eval (in production, use a proper math parser!)
        const result = eval(expression);
        return { expression, result, success: true };
      } catch {
        return { expression, result: null, success: false, error: "Invalid expression" };
      }
    }
  })
);

tools.register(
  tool({
    name: "generate_random_quote",
    description: "Generate an inspiring quote",
    schema: z.object({}),
    handler: async () => {
      const quotes = [
        "The best way to predict the future is to invent it. - Alan Kay",
        "Code is like humor. When you have to explain it, it's bad. - Cory House",
        "First, solve the problem. Then, write the code. - John Johnson",
        "Experience is the name everyone gives to their mistakes. - Oscar Wilde",
        "In order to be irreplaceable, one must always be different. - Coco Chanel"
      ];
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      return { quote, success: true };
    }
  })
);

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve static files
  if (req.method === "GET" && !url.pathname.startsWith("/api")) {
    try {
      const filePath =
        url.pathname === "/"
          ? path.join(PUBLIC_DIR, "index.html")
          : path.join(PUBLIC_DIR, url.pathname);

      const content = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      const contentType =
        {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json"
        }[ext] || "text/plain";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
    return;
  }

  // API Routes
  if (req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        // /api/agent - Simple agent interaction
        if (url.pathname === "/api/agent") {
          const agent = createAgent({
            name: "demo-agent",
            client,
            model: process.env.OPENAI_MODEL || "gpt-4o",
            systemPrompt:
              "You are a helpful AI assistant with access to tools. Be concise and friendly.",
            tools
          });

          const result = await agent.run(data.prompt);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              response: result.response,
              steps: result.steps.length
            })
          );
          return;
        }

        // /api/structured - Structured output example
        if (url.pathname === "/api/structured") {
          const schema = z.object({
            summary: z.string(),
            sentiment: z.enum(["positive", "negative", "neutral"]),
            keywords: z.array(z.string()),
            score: z.number().min(0).max(100)
          });

          const result = await generateStructuredOutput({
            client,
            request: {
              messages: [
                {
                  role: "system",
                  content: "Analyze the given text and return a structured analysis."
                },
                {
                  role: "user",
                  content: `Analyze this: "${data.text}"`
                }
              ]
            },
            schema,
            maxRetries: 2
          });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result.value));
          return;
        }

        // /api/conversation - Multi-turn conversation with memory
        if (url.pathname === "/api/conversation") {
          const sessionId = data.sessionId || "default";

          // Get or create session
          if (!sessions.has(sessionId)) {
            sessions.set(sessionId, { messages: [] });
          }
          const session = sessions.get(sessionId)!;

          // Create agent with memory
          const memory = new InMemoryAdapter();

          // Load previous messages into memory
          for (const msg of session.messages) {
            await memory.add("conversation", {
              role: msg.role,
              content: msg.content
            });
          }

          const agent = createAgent({
            name: "conversation",
            client,
            model: process.env.OPENAI_MODEL || "gpt-4o",
            systemPrompt:
              "You are a conversational AI. Remember what the user tells you and refer back to it.",
            memory
          });

          const result = await agent.run(data.prompt);
          const response = result.response.choices[0]?.message?.content || "No response";

          // Store messages
          session.messages.push({ role: "user", content: data.prompt });
          session.messages.push({ role: "assistant", content: response });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              response,
              sessionId,
              messageCount: session.messages.length
            })
          );
          return;
        }

        // Unknown endpoint
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Endpoint not found" }));
      } catch (error) {
        console.error("Error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Internal server error"
          })
        );
      }
    });
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`\n🚀 RunMesh Demo Server running on http://localhost:${PORT}\n`);
  console.log(`Try these endpoints:`);
  console.log(`  POST /api/agent - Simple agent with tools`);
  console.log(`  POST /api/structured - Structured output extraction`);
  console.log(`  POST /api/conversation - Multi-turn conversation\n`);
});
