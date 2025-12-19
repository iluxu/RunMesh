# RunMesh

**RunMesh** is a **JS/TS framework** for agentic applications, **OpenAI-first**, like **React/Vue/Angular** but for AI: a clean, typed, observable runtime layer.

It provides the core runtime for **agents + tools + streaming + structured outputs + memory**, so you stop rewriting glue code for every AI project.

> **Status:** Alpha (API may change). Chat Completions supported today. Responses API support is on the roadmap.

---

## Why RunMesh

Modern AI apps keep needing the same building blocks:
- tool calling with safe input validation
- multi-round tool loops
- streaming events for CLIs/servers
- structured JSON outputs that actually validate
- memory + retrieval
- observability (logs, cost, traces)

RunMesh ships these as a **composable framework**, not a pile of snippets.

---

## Install

```bash
pnpm add @runmesh/agent @runmesh/tools zod
# or
npm i @runmesh/agent @runmesh/tools zod
```

OpenAI key required:

```bash
export OPENAI_API_KEY="..."
export OPENAI_MODEL="gpt-4o-mini"
```

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
  systemPrompt: "You are a concise assistant. Use tools when helpful.",
  tools
});

const result = await agent.run("Quelle heure est-il a Paris ?");
console.log(result.response.choices[0]?.message?.content);
```

## Features

**Agent runtime**
- prompt + tools + memory + policies
- multi-round tool loops with persisted tool-call messages
- configurable `maxToolRounds`

**Typed tools**
- define tools with Zod
- validate args before execution
- export Zod -> JSON Schema for OpenAI tool definitions

**Structured outputs**
- `generateStructuredOutput(...)` retries on invalid JSON
- schema-first extraction for reliable automation

**Streaming**
- event iterator for real-time UX
- emits `token`, `tool_call`, `tool_result`, `final`

**Observability**
- pluggable logger/tracer hooks
- token/cost helpers (when available)

## Market Positioning / Comparison

RunMesh is **higher-level than the OpenAI SDK**, **simpler than LangChain**, and **more typed/modern** for production use.

- **OpenAI SDK**: great low-level API access, but you still assemble tools, loops, retries, and observability yourself.
- **LangChain**: powerful, but can feel heavy and magic-heavy for clean, typed app code.
- **RunMesh**: explicit runtime primitives, end-to-end typing, clean defaults, and a predictable execution loop.

Think of it as the **React/Vue-style framework layer** for agentic apps.

## Demo CLI

A streaming CLI demo lives here: `framework/apps/demo-cli`

```bash
pnpm install
pnpm --filter demo-cli run start "summarize this article: <url>"
```

See `framework/apps/demo-cli/index.ts` for the full example.

## Packages
- `@runmesh/core` – OpenAI client, streaming, response helpers, errors
- `@runmesh/agent` – agent runtime, planner/executor, policies
- `@runmesh/tools` – tool definition, registry, executor
- `@runmesh/memory` – memory adapters, embeddings, retrieval
- `@runmesh/schema` – Zod validation + JSON Schema export
- `@runmesh/observability` – logger, tracer, cost estimation
- `@runmesh/adapters` – CLI/Web/Bot adapters

## License (Important)

RunMesh is licensed under **Business Source License 1.1 (BSL 1.1)**.

Free to use for:
- personal projects
- internal/company use
- production deployments of your own apps

Commercial hosted offerings / "RunMesh-as-a-Service" require a commercial license.

A future change date can relicense to Apache-2.0 (see `LICENSE`).

For a commercial license: open an issue or contact the maintainer.

## Roadmap
- Responses API-first
- richer web demo (Next.js)
- CI + tests
- more adapters (Discord/Telegram)
- replayable runs + persistent traces

## Contributing

PRs welcome. If you are building something on RunMesh, share it in Discussions.
