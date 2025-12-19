# Getting Started with RunMesh

Welcome to RunMesh! This guide will get you up and running in under 5 minutes.

## Prerequisites

- Node.js 20+ or Bun
- An API key from:
  - [OpenRouter](https://openrouter.ai) (Recommended - 200+ models)
  - [OpenAI](https://platform.openai.com)
  - [Anthropic](https://console.anthropic.com)

## Quick Start

### Option 1: Create New Project (Recommended)

```bash
npx create-runmesh@latest my-ai-app
cd my-ai-app
```

Choose your options:

- **Template**: Start with "Simple Chatbot"
- **Provider**: OpenRouter (access to all models)
- **Package Manager**: Your preference

Add your API key to `.env`:

```bash
OPENROUTER_API_KEY=your_key_here
```

Run it:

```bash
npm run dev
```

### Option 2: Add to Existing Project

```bash
npm install @runmesh/agent @runmesh/core @runmesh/tools zod
```

## Your First Agent

Create `agent.ts`:

```typescript
import { createAgent } from "@runmesh/agent";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";
import { tool, ToolRegistry } from "@runmesh/tools";
import { z } from "zod";

// Setup client
const client = createFromProvider(
  createOpenRouterConfig(
    process.env.OPENROUTER_API_KEY!,
    "claude-3.5-sonnet" // or "gpt-4o", "gemini-pro"
  )
);

// Define tools
const tools = new ToolRegistry();
tools.register(
  tool({
    name: "get_weather",
    description: "Get weather for a city",
    schema: z.object({
      city: z.string()
    }),
    handler: async ({ city }) => {
      // Your API call here
      return { city, temp: 72, condition: "sunny" };
    }
  })
);

// Create agent
const agent = createAgent({
  name: "assistant",
  client,
  model: "anthropic/claude-3.5-sonnet",
  systemPrompt: "You are a helpful weather assistant.",
  tools
});

// Run it
const result = await agent.run("What's the weather in Paris?");
console.log(result.response.choices[0]?.message?.content);
```

Run it:

```bash
npx tsx agent.ts
```

## Next Steps

### Add Memory for Conversations

```typescript
import { InMemoryAdapter } from "@runmesh/memory";

const agent = createAgent({
  name: "chatbot",
  client,
  memory: new InMemoryAdapter(),
  systemPrompt: "Remember user preferences."
});
```

### Extract Structured Data

```typescript
import { generateStructuredOutput } from "@runmesh/core";

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number()
});

const result = await generateStructuredOutput({
  client,
  request: {
    messages: [{ role: "user", content: "Extract: John, john@email.com, 30" }]
  },
  schema
});

console.log(result.value); // Fully typed!
```

### Build a Web App

Install React hooks:

```bash
npm install @runmesh/react
```

Use in your component:

```tsx
import { useStreamingAgent } from "@runmesh/react";

function Chat() {
  const { messages, sendMessage, isStreaming } = useStreamingAgent({
    apiUrl: "/api/agent"
  });

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.timestamp}>{msg.content}</div>
      ))}
      <input onSubmit={(e) => sendMessage(e.target.value)} />
    </div>
  );
}
```

## Examples

Check out complete examples:

- [Simple Chatbot](../examples/simple-chatbot) - Basic conversation
- [Tool-Using Agent](../examples/tool-agent) - Agent with custom tools
- [Structured Output](../examples/structured-output) - Data extraction
- [Next.js App](../examples/nextjs-chat) - Full-stack application

## Common Issues

### "OPENAI_API_KEY is required"

Make sure your `.env` file exists and has the correct key:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

### "Model not found"

OpenRouter model names follow the format `provider/model`:

```typescript
"anthropic/claude-3.5-sonnet"  ✅
"openai/gpt-4o"                ✅
"google/gemini-pro"            ✅
"claude-3.5-sonnet"            ❌ (missing provider)
```

### TypeScript Errors

Make sure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```

## Learn More

- [Core Concepts](./CONCEPTS.md) - Understand the framework
- [API Reference](./API.md) - Complete API documentation
- [Best Practices](./BEST_PRACTICES.md) - Production tips
- [Deployment](./DEPLOYMENT.md) - Deploy to production

## Need Help?

- [Discord](https://discord.gg/runmesh) - Chat with the community
- [GitHub Issues](https://github.com/iluxu/RunMesh/issues) - Report bugs
- [Discussions](https://github.com/iluxu/RunMesh/discussions) - Ask questions

---

**Ready to build?** Start with our [examples](../examples) or read the [core concepts](./CONCEPTS.md)!
