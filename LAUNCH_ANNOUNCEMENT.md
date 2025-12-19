# 🚀 RunMesh Launch Announcement

## Twitter/X Thread

````
🚀 Today, we're launching RunMesh - The Angular of Gen AI Applications

After months of development, we're releasing the first truly batteries-included framework for building AI agents.

Here's why it's different 🧵👇

1/ The Problem

Building AI agents today is PAINFUL:
• Endless boilerplate
• Juggling multiple SDKs
• No type safety
• Poor DX
• Hard to test & deploy

Every project starts from scratch. There has to be a better way.

2/ The Solution: RunMesh

We built what the ecosystem has been missing:
✅ Batteries included (tools, memory, streaming, validation)
✅ Multi-provider (200+ models via OpenRouter)
✅ Type-safe (end-to-end TypeScript + Zod)
✅ Framework-agnostic (Next.js, Express, Cloudflare...)
✅ Production-ready

3/ Getting Started is EASY

```bash
npx create-runmesh@latest my-app
````

Choose your template, provider, and go.
No configuration hell. No integration headaches.

Just pure agent logic.

4/ Multi-Provider Support

Access 200+ models through ONE API:
• Claude 3.5 Sonnet
• GPT-4o
• Gemini Pro
• Llama 3.1
• Mistral
• DeepSeek
• And 190+ more

Switch models with one line. No vendor lock-in.

5/ Type Safety Everywhere

Define tools with Zod schemas:

```typescript
tool({
  name: "search",
  schema: z.object({
    query: z.string(),
    limit: z.number()
  }),
  handler: async (input) => {
    // input is fully typed!
  }
});
```

TypeScript infers everything. No any types. No runtime surprises.

6/ React Hooks (Pain Béni!)

Building a chat interface? Done:

```tsx
const { messages, sendMessage } = useStreamingAgent({
  apiUrl: "/api/agent"
});
```

Real-time streaming. Perfect UX. Zero boilerplate.

7/ Structured Outputs

Extract data with schemas:

```typescript
const schema = z.object({
  name: z.string(),
  email: z.string().email()
});

const result = await generateStructuredOutput({
  client,
  schema
});
// result.value is typed!
```

No more parsing. No more validation. Just data.

8/ Production Ready

✅ Comprehensive test suite
✅ ESLint + Prettier configured
✅ CI/CD with GitHub Actions
✅ Memory management
✅ Error handling
✅ Observability hooks
✅ Deployment templates

Ship with confidence.

9/ Why "The Angular of Gen AI"?

Angular brought:
• Structure over chaos
• Best practices built-in
• Batteries included
• Amazing DX

RunMesh does the same for AI.

We're not just a library. We're a complete framework.

10/ Get Started Today

⭐ Star: github.com/iluxu/RunMesh
📖 Docs: runmesh.dev
💬 Discord: discord.gg/runmesh
📦 npm: npm install @runmesh/agent

Join 1000+ developers building the future of AI applications.

Let's build something amazing together! 🚀

#AI #TypeScript #OpenAI #Anthropic #GenAI #DevTools

````

---

## Reddit Post (r/programming, r/typescript, r/artificial)

**Title:** Show Reddit: RunMesh - The Angular of Gen AI Applications

**Body:**

Hey Reddit!

After months of building, I'm excited to share RunMesh - a comprehensive TypeScript framework for building AI agents. Think of it as Angular for Gen AI apps.

**The Problem I'm Solving**

I've built dozens of AI applications, and every time I start a new project, I'm rewriting the same code:
- OpenAI/Anthropic SDK integration
- Tool/function calling setup
- Input validation
- Memory management
- Error handling
- Testing utilities

It's exhausting. And every codebase looks different because there's no standard way to do things.

**Enter RunMesh**

RunMesh provides everything you need in one package:

🎯 **Multi-Provider Support**
- Access 200+ models through OpenRouter (Claude, GPT, Gemini, Llama...)
- Switch providers with one line
- No vendor lock-in

🔧 **Type-Safe Tools**
- Define tools with Zod schemas
- Full TypeScript inference
- Runtime validation included

💾 **Memory & Context**
- Built-in conversation memory
- Pluggable adapters
- Automatic context management

📊 **Structured Outputs**
- Extract typed data from LLMs
- Automatic retries on validation failures
- Zero parsing headaches

⚛️ **React Hooks**
- `useStreamingAgent` for real-time chat
- Perfect DX for frontend developers
- Works with Next.js, Remix, etc.

🧪 **Production Ready**
- Comprehensive test suite
- CI/CD templates
- Deployment guides
- Error handling built-in

**Getting Started (Literally 30 Seconds)**

```bash
npx create-runmesh@latest my-app
````

Or add to existing project:

```bash
npm install @runmesh/agent @runmesh/core @runmesh/tools zod
```

**Quick Example**

```typescript
import { createAgent } from "@runmesh/agent";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";
import { tool, ToolRegistry } from "@runmesh/tools";
import { z } from "zod";

const client = createFromProvider(
  createOpenRouterConfig(process.env.OPENROUTER_API_KEY!, "claude-3.5-sonnet")
);

const tools = new ToolRegistry();
tools.register(
  tool({
    name: "calculate",
    schema: z.object({ expr: z.string() }),
    handler: async ({ expr }) => eval(expr)
  })
);

const agent = createAgent({
  name: "assistant",
  client,
  tools
});

const result = await agent.run("What's 123 * 456?");
console.log(result.response.choices[0]?.message?.content);
```

That's it. No boilerplate, no glue code, just logic.

**Why I Built This**

I wanted to bring the "batteries included" philosophy from frameworks like Angular and Rails to AI development. The ecosystem needed structure, best practices, and a great developer experience.

**Links**

- GitHub: github.com/iluxu/RunMesh
- Documentation: runmesh.dev
- Discord: discord.gg/runmesh
- npm: @runmesh/agent

**Tech Stack**

- TypeScript (100%)
- Zod for validation
- Vitest for testing
- Monorepo with pnpm

I'd love your feedback! What features would you want to see? What pain points should we solve next?

Thanks for reading!

---

## Hacker News Post

**Title:** RunMesh: TypeScript framework for building AI agents

**Body:**

Hi HN!

I'm excited to share RunMesh, a comprehensive TypeScript framework for building AI agents. It's inspired by Angular's "batteries included" philosophy.

**What it does:**

RunMesh provides a complete toolkit for AI application development:

- Multi-provider support (200+ models via OpenRouter, OpenAI, Anthropic)
- Type-safe tool definitions with Zod
- Built-in memory and context management
- React hooks for frontend integration
- Structured output extraction
- Testing utilities and deployment templates

**Why it exists:**

After building many AI applications, I found myself rewriting the same patterns repeatedly. There was no standardized way to structure AI agents, handle tool calling, manage context, or integrate with frontends.

RunMesh solves this by providing a framework (not just a library) with:

- Clear architectural patterns
- End-to-end type safety
- Best practices built-in
- Excellent developer experience

**Quick example:**

```typescript
import { createAgent } from "@runmesh/agent";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";

const client = createFromProvider(
  createOpenRouterConfig(process.env.OPENROUTER_API_KEY!, "claude-3.5-sonnet")
);

const agent = createAgent({
  name: "assistant",
  client,
  systemPrompt: "You are a helpful assistant."
});

const result = await agent.run("Hello!");
```

**Getting started:**

```bash
npx create-runmesh@latest my-app
```

**Links:**

- GitHub: https://github.com/iluxu/RunMesh
- Docs: https://runmesh.dev
- npm: https://www.npmjs.com/package/@runmesh/agent

I'm here to answer questions and would love your feedback!

---

## Dev.to Article

**Title:** Introducing RunMesh: The Angular of Gen AI Applications

**Tags:** #typescript #ai #opensource #webdev

[Full article content with code examples, architecture diagrams, comparisons, and deep dive into features]

---

## Product Hunt Launch

**Tagline:** The Angular of Gen AI - Build AI agents with the best DX

**Description:**

RunMesh is the first comprehensive, batteries-included framework for building Gen AI applications. We're bringing structure, best practices, and amazing developer experience to AI engineering.

🎯 **What makes RunMesh different:**

✅ **Multi-Provider**: Access 200+ models (Claude, GPT, Gemini, Llama) through one unified API
✅ **Type-Safe**: End-to-end TypeScript with Zod validation
✅ **Batteries Included**: Tools, memory, streaming, structured outputs, observability
✅ **React Hooks**: Perfect integration for frontend developers
✅ **CLI Scaffolding**: `npx create-runmesh` to start in seconds
✅ **Production Ready**: Tests, CI/CD, deployment templates

**Perfect for:**

- Building chatbots and conversational AI
- Creating AI-powered tools and APIs
- Extracting structured data from text
- Multi-agent systems
- Full-stack AI applications

**Get started in 30 seconds:**

```bash
npx create-runmesh@latest my-ai-app
```

Join the community building the future of AI applications!

---

## Email Newsletter Template

**Subject:** 🚀 RunMesh is Live - The Framework AI Developers Have Been Waiting For

**Body:**

Hey there!

Today marks a special milestone - we're launching RunMesh to the world!

If you've ever built an AI application, you know the pain:

- Rewriting the same boilerplate
- Juggling multiple SDKs
- No standardization
- Poor developer experience

RunMesh solves all of this.

[Continue with features, examples, and call-to-action]

---

These announcements are ready to flood the internet with RunMesh! 🌊🚀
