# RunMesh

RunMesh is an OpenAI-first JS/TS agent runtime: typed end-to-end, observable, and built for production. It wraps OpenAI models (Chat/Responses), tools, memory, and structured outputs into a composable framework you can ship to npm and demo on HN/Reddit.

## Quickstart

```ts
import { createAgent } from "@runmesh/agent";
import { tool, ToolRegistry } from "@runmesh/tools";
import { z } from "zod";

const tools = new ToolRegistry();
tools.register(
  tool({
    name: "get_time",
    description: "Return the current ISO time",
    schema: z.object({}),
    handler: () => new Date().toISOString()
  })
);

const agent = createAgent({
  name: "demo",
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  systemPrompt: "You are a concise assistant.",
  tools
});

const result = await agent.run("Quelle heure est-il à Paris ?");
console.log(result.response.choices[0]?.message?.content);
```

## Features
- **Agent runtime**: prompt + tools + memory + policies with multi-round tool loops.
- **Typed tools**: Zod schemas → OpenAI JSON Schema automatically.
- **Structured outputs**: retry with schema validation via `generateStructuredOutput`.
- **Streaming**: event iterator (`token`, `tool_call`, `final`) ready for CLIs/HTTP.
- **Observability**: pluggable logger/tracer and cost helpers.

## Demo CLI

```
pnpm install
pnpm --filter demo-cli run start "résume cet article: <url>"
```

See `framework/apps/demo-cli/index.ts` for the full demo using tools + streaming.

## Packages
- `@runmesh/core` – OpenAI client wrapper, routing, responses, streaming, errors.
- `@runmesh/agent` – agent runtime, planner, executor, policies.
- `@runmesh/tools` – tool definition, registry, executor.
- `@runmesh/memory` – memory adapters, embeddings, retriever.
- `@runmesh/schema` – Zod validation + JSON schema export.
- `@runmesh/observability` – logger, tracer, cost estimation.
- `@runmesh/adapters` – CLI/Web/Bot adapters.

## Status
Alpha scaffold with working runtime loops and streaming. Production polish in progress (Responses API path, richer demos, CI). Contributions welcome.
