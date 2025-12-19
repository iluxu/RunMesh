# RunMesh

<div align="center">

![RunMesh Logo](https://img.shields.io/badge/⚡-RunMesh-6366f1?style=for-the-badge)

**The Angular of Gen AI Applications**

Build production-ready AI agents with the best developer experience in the industry.

[![npm version](https://img.shields.io/npm/v/@runmesh/agent?style=flat-square)](https://www.npmjs.com/package/@runmesh/agent)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=flat-square)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-BSL%201.1-green?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-27%20passing-brightgreen?style=flat-square)](https://github.com/iluxu/RunMesh/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

[Documentation](https://runmesh.dev) · [Quick Start](#-quick-start) · [Examples](#-examples) · [Discord](https://discord.gg/runmesh)

</div>

---

## 🎯 Why RunMesh?

RunMesh is the **first comprehensive, batteries-included framework** for building Gen AI applications. Like Angular revolutionized web development with structure and best practices, RunMesh does the same for AI engineering.

### The Problem We Solve

Building AI agents today means dealing with:

- ❌ Endless boilerplate code for every project
- ❌ Juggling multiple providers, SDKs, and APIs
- ❌ No type safety, no validation, no standards
- ❌ Poor developer experience and debugging
- ❌ Difficulty testing, deploying, and maintaining

### The RunMesh Solution

A complete framework with everything you need:

- ✅ **Batteries Included**: Tools, memory, streaming, structured outputs, observability
- ✅ **Multi-Provider**: OpenRouter (200+ models), OpenAI, Anthropic, or bring your own
- ✅ **Type-Safe**: End-to-end TypeScript with Zod validation
- ✅ **Framework Agnostic**: Works with Next.js, Express, Hono, Cloudflare Workers, Deno
- ✅ **Frontend Ready**: React hooks, Vue composables (coming soon), Svelte stores (coming soon)
- ✅ **Production Ready**: Testing utilities, logging, error handling, deployment templates
- ✅ **Developer First**: Best-in-class DX with CLI scaffolding and hot reload

---

## 🚀 Quick Start

### Create a New Project

```bash
# Like create-next-app, but for AI agents
npx create-runmesh@latest my-ai-app

cd my-ai-app
npm install
npm run dev
```

### Or Add to Existing Project

```bash
npm install @runmesh/agent @runmesh/core @runmesh/tools zod
# or
pnpm add @runmesh/agent @runmesh/core @runmesh/tools zod
```

### Your First Agent (10 Lines)

```typescript
import { createAgent } from "@runmesh/agent";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";
import { tool, ToolRegistry } from "@runmesh/tools";
import { z } from "zod";

// Use 200+ models via OpenRouter (Claude, GPT, Gemini, Llama...)
const client = createFromProvider(
  createOpenRouterConfig(
    process.env.OPENROUTER_API_KEY!,
    "claude-3.5-sonnet" // or "gpt-4o", "gemini-pro", etc.
  )
);

const tools = new ToolRegistry();
tools.register(
  tool({
    name: "get_weather",
    description: "Get current weather for a city",
    schema: z.object({
      city: z.string().describe("City name")
    }),
    handler: async ({ city }) => {
      // Call your weather API here
      return { city, temp: 72, condition: "sunny" };
    }
  })
);

const agent = createAgent({
  name: "weather-assistant",
  client,
  model: "anthropic/claude-3.5-sonnet",
  systemPrompt: "You are a helpful weather assistant.",
  tools
});

const result = await agent.run("What's the weather in Paris?");
console.log(result.response.choices[0]?.message?.content);
```

---

## 🎨 Frontend Integration

### React (The Pain Béni Experience)

```tsx
import { useStreamingAgent } from "@runmesh/react";

function ChatInterface() {
  const { messages, sendMessage, isStreaming } = useStreamingAgent({
    apiUrl: "/api/agent"
  });

  return (
    <div className="chat-container">
      {messages.map((msg) => (
        <div key={msg.timestamp} className={`message ${msg.role}`}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}

      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        placeholder={isStreaming ? "AI is thinking..." : "Type a message..."}
      />
    </div>
  );
}
```

### Next.js API Route (App Router)

```typescript
// app/api/agent/route.ts
import { createAgent } from "@runmesh/agent";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";

const client = createFromProvider(createOpenRouterConfig(process.env.OPENROUTER_API_KEY!));

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const agent = createAgent({
    name: "api-agent",
    client,
    model: "anthropic/claude-3.5-sonnet",
    systemPrompt: "You are a helpful AI assistant."
  });

  const result = await agent.run(prompt);

  return Response.json({
    content: result.response.choices[0]?.message?.content
  });
}
```

---

## 🌟 Key Features

### 🔄 Multi-Provider Support

Access **200+ models** through one unified API:

```typescript
// OpenRouter - Access everything (Recommended)
const or = createFromProvider(createOpenRouterConfig(key, "anthropic/claude-3.5-sonnet"));

// OpenAI
const openai = createOpenAI({
  apiKey,
  defaultModel: "gpt-4o"
});

// Anthropic
const anthropic = createFromProvider(createAnthropicConfig(key, "claude-3-5-sonnet-20241022"));

// Custom endpoint
const custom = createCustomConfig(key, "https://your-api.com/v1", "model-name");
```

### 🛠️ Type-Safe Tools

Define tools with full TypeScript support:

```typescript
const tools = new ToolRegistry();

tools.register(
  tool({
    name: "search_database",
    description: "Search the product database",
    schema: z.object({
      query: z.string(),
      limit: z.number().default(10),
      filters: z
        .object({
          category: z.string().optional(),
          minPrice: z.number().optional()
        })
        .optional()
    }),
    handler: async ({ query, limit, filters }) => {
      // All parameters are fully typed!
      const results = await db.search(query, { limit, ...filters });
      return results;
    }
  })
);
```

### 💾 Memory & Context

Built-in memory management for conversational agents:

```typescript
import { InMemoryAdapter } from "@runmesh/memory";

const agent = createAgent({
  name: "chatbot",
  client,
  memory: new InMemoryAdapter(),
  systemPrompt: "You remember user preferences and past conversations."
});

// Memory is automatically managed across conversations
await agent.run("My name is Alice");
await agent.run("What's my name?"); // "Your name is Alice"
```

### 📊 Structured Outputs

Extract structured data with Zod schemas:

```typescript
import { generateStructuredOutput } from "@runmesh/core";

const analysisSchema = z.object({
  summary: z.string(),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  topics: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

const result = await generateStructuredOutput({
  client,
  request: {
    messages: [{ role: "user", content: "Analyze this product review: ..." }]
  },
  schema: analysisSchema,
  maxRetries: 3
});

// result.value is fully typed!
const { summary, sentiment, topics, confidence } = result.value;
```

### 🎯 Multi-Step Planning

Orchestrate complex workflows with the Planner:

```typescript
import { Planner } from "@runmesh/agent";

const planner = new Planner(executor);

const result = await planner.execute({
  objective: "Research and write a comprehensive report on AI trends",
  steps: [
    "Research current AI trends and gather data",
    "Analyze the data and identify key patterns",
    "Write a detailed report with findings",
    "Review and refine the report"
  ],
  continueOnError: false,
  onStepComplete: (step) => {
    console.log(`✅ Completed: ${step.description}`);
  },
  onStepError: (step, error) => {
    console.error(`❌ Failed: ${step.description}`, error);
  }
});

console.log(`Success: ${result.success}`);
result.steps.forEach((step) => {
  console.log(`${step.id}: ${step.status} - ${step.description}`);
});
```

### 📡 Streaming Responses

Real-time streaming for better UX:

```typescript
const stream = await agent.stream("Write a long story...");

for await (const event of stream) {
  if (event.type === "token") {
    process.stdout.write(event.content);
  } else if (event.type === "tool_call") {
    console.log(`\n[Tool: ${event.name}]`);
  } else if (event.type === "final") {
    console.log("\n\nDone!");
  }
}
```

---

## 📦 Packages

RunMesh is organized as a monorepo with focused packages:

| Package                  | Description                                     | Version                                                                                                                               |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `@runmesh/core`          | OpenAI client, providers, streaming, validation | [![npm](https://img.shields.io/npm/v/@runmesh/core?style=flat-square)](https://www.npmjs.com/package/@runmesh/core)                   |
| `@runmesh/agent`         | Agent runtime, executor, planner                | [![npm](https://img.shields.io/npm/v/@runmesh/agent?style=flat-square)](https://www.npmjs.com/package/@runmesh/agent)                 |
| `@runmesh/tools`         | Tool definitions, registry, executor            | [![npm](https://img.shields.io/npm/v/@runmesh/tools?style=flat-square)](https://www.npmjs.com/package/@runmesh/tools)                 |
| `@runmesh/memory`        | Memory adapters, embeddings, retrieval          | [![npm](https://img.shields.io/npm/v/@runmesh/memory?style=flat-square)](https://www.npmjs.com/package/@runmesh/memory)               |
| `@runmesh/schema`        | Zod helpers, JSON Schema conversion             | [![npm](https://img.shields.io/npm/v/@runmesh/schema?style=flat-square)](https://www.npmjs.com/package/@runmesh/schema)               |
| `@runmesh/observability` | Logging, tracing, cost estimation               | [![npm](https://img.shields.io/npm/v/@runmesh/observability?style=flat-square)](https://www.npmjs.com/package/@runmesh/observability) |
| `@runmesh/react`         | React hooks and components                      | [![npm](https://img.shields.io/npm/v/@runmesh/react?style=flat-square)](https://www.npmjs.com/package/@runmesh/react)                 |
| `@runmesh/cli`           | Project scaffolding tool                        | [![npm](https://img.shields.io/npm/v/@runmesh/cli?style=flat-square)](https://www.npmjs.com/package/@runmesh/cli)                     |

---

## 🎓 Examples

Check out our [examples directory](./examples) for complete, runnable examples:

- **[Simple Chatbot](./examples/simple-chatbot)** - Basic conversational agent
- **[Tool-Using Agent](./examples/tool-agent)** - Agent with custom tools
- **[Multi-Agent System](./examples/multi-agent)** - Multiple agents working together
- **[Next.js App](./examples/nextjs-chat)** - Full-stack chat application
- **[API Server](./examples/api-server)** - REST API with RunMesh
- **[Structured Extraction](./examples/structured-output)** - Data extraction example

---

## 🧪 Testing

RunMesh includes comprehensive testing utilities:

```typescript
import { describe, it, expect } from "vitest";
import { createAgent } from "@runmesh/agent";
import { createMockClient } from "@runmesh/core/testing";

describe("MyAgent", () => {
  it("should respond correctly", async () => {
    const mockClient = createMockClient({
      responses: [{ content: "Hello! How can I help?" }]
    });

    const agent = createAgent({
      name: "test-agent",
      client: mockClient,
      model: "gpt-4o"
    });

    const result = await agent.run("Hi");
    expect(result.response.choices[0]?.message?.content).toBe("Hello! How can I help?");
  });
});
```

---

## 🚢 Deployment

RunMesh works everywhere JavaScript runs:

- **Vercel** - Deploy with one command
- **Railway** - Container deployment
- **Cloudflare Workers** - Edge runtime
- **AWS Lambda** - Serverless
- **Docker** - Containerized deployment
- **Node.js** - Traditional server

See our [deployment guides](./docs/deployment) for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/iluxu/RunMesh.git
cd RunMesh
pnpm install
pnpm test
pnpm build
```

---

## 📝 License

RunMesh is licensed under the [Business Source License 1.1](LICENSE).

**Free for:**

- Personal projects
- Internal company use
- Production deployments of your own applications

**Commercial license required for:**

- Hosting RunMesh as a service
- Selling RunMesh-based products

After 4 years, RunMesh will automatically convert to Apache 2.0.

For commercial licensing, [open an issue](https://github.com/iluxu/RunMesh/issues/new) or contact us.

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=iluxu/RunMesh&type=Date)](https://star-history.com/#iluxu/RunMesh&Date)

---

## 💬 Community

- [Discord](https://discord.gg/runmesh) - Chat with the community
- [GitHub Discussions](https://github.com/iluxu/RunMesh/discussions) - Ask questions, share ideas
- [Twitter](https://twitter.com/runmesh) - Follow for updates
- [Blog](https://runmesh.dev/blog) - Tutorials and announcements

---

## 🙏 Acknowledgments

RunMesh is built on the shoulders of giants:

- [OpenAI](https://openai.com) for the excellent SDK
- [Zod](https://zod.dev) for schema validation
- [Vercel](https://vercel.com) for AI SDK inspiration

---

<div align="center">

**Built with ❤️ by the RunMesh Team**

[⭐ Star us on GitHub](https://github.com/iluxu/RunMesh) · [📖 Read the docs](https://runmesh.dev) · [💬 Join Discord](https://discord.gg/runmesh)

</div>
