# RunMesh

**RunMesh** is an OpenAI-first **JS/TS framework** for building agentic applications: typed end-to-end, observable, and designed for production.

It provides a clean runtime layer for **agents + tools + streaming + structured outputs + memory**, so you don’t rewrite the same glue code for every OpenAI project.

> **Status:** Alpha (API may change). Chat Completions supported today. Responses API support is on the roadmap.

---

## Why RunMesh

Most OpenAI apps need the same building blocks:
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

You’ll also need an OpenAI API key:

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

const result = await agent.run("Quelle heure est-il à Paris ?");
console.log(result.response.choices[0]?.message?.content);
```

## Features

**Agent runtime**
- prompt + tools + memory + policies
- multi-round tool loops with persisted tool-call messages
- configurable `maxToolRounds`

**Typed tools**
- define tools with Zod
- args validated before execution
- Zod → JSON Schema export for OpenAI tool definitions

**Structured outputs**
- `generateStructuredOutput(...)` re-queries on invalid JSON
- schema-first extraction for reliable automation

**Streaming**
- event iterator for real-time UX
- emits `token`, `tool_call`, `tool_result`, `final`

**Observability**
- pluggable logger/tracer hooks
- token/cost helpers (where available)

## Demo CLI

A working CLI demo showcasing tools + streaming lives here: `framework/apps/demo-cli`

Run it:

```bash
pnpm install
pnpm --filter demo-cli run start "résume cet article: <url>"
```

See `framework/apps/demo-cli/index.ts` for the full example.

## Packages
- `@runmesh/core` – OpenAI client wrapper, streaming, response helpers, errors
- `@runmesh/agent` – agent runtime, planner/executor, policies
- `@runmesh/tools` – tool definition, registry, executor
- `@runmesh/memory` – memory adapters, embeddings, retrieval
- `@runmesh/schema` – Zod validation + JSON Schema export
- `@runmesh/observability` – logger, tracer, cost estimation
- `@runmesh/adapters` – CLI/Web/Bot adapters

## License (Important)

RunMesh is licensed under Business Source License 1.1 (BSL 1.1).

Free to use for:
- personal projects
- internal/company use
- production deployments of your own apps

Commercial hosted offerings / “RunMesh-as-a-Service” require a commercial license.

A future change date can relicense to Apache-2.0 (see LICENSE).

If you need a commercial license: open an issue or contact the maintainer.

## Roadmap
- Responses API-first path
- richer web demo (Next.js)
- CI + tests
- more adapters (Discord/Telegram)
- replayable runs + persistent traces

## Contributing

PRs welcome. If you’re building something on RunMesh, share it in Discussions.
