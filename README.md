# RunMesh

**Build agentic applications the right way.**

RunMesh is an OpenAI-first JS/TS framework for production-ready agentic apps. It is typed end-to-end, observable, and designed to replace glue code with a clean runtime layer for agents, tools, streaming, structured outputs, and memory.

Docs: https://runmesh.llmbasedos.com  
GitHub: https://github.com/iluxu/RunMesh

> Status: Alpha (API may change). Chat Completions supported today. Responses API support is on the roadmap.

---

## Why RunMesh

Most AI apps need the same building blocks:
- tool calling with safe input validation
- multi-round tool loops
- streaming events for CLIs and servers
- structured JSON outputs that actually validate
- memory and retrieval
- observability (logs, cost, traces)

RunMesh ships these as a composable framework, not a pile of snippets.

---

## Install

```bash
pnpm add @runmesh/agent @runmesh/tools zod
# or
npm i @runmesh/agent @runmesh/tools zod
# or
yarn add @runmesh/agent @runmesh/tools zod
```

OpenAI key required:

```bash
export OPENAI_API_KEY="..."
export OPENAI_MODEL="gpt-5.2"
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
  model: process.env.OPENAI_MODEL ?? "gpt-5.2",
  systemPrompt: "You are a concise assistant.",
  tools
});

const result = await agent.run("What time is it?");
console.log(result.response.choices[0]?.message?.content);
```

## Features

**Agent Runtime**
- prompts, tools, memory, policies
- multi-round tool loops with persisted tool-call messages
- configurable `maxToolRounds`

**Typed Tools**
- define tools with Zod
- validate args before execution
- export Zod -> JSON Schema for OpenAI tool definitions

**Structured Outputs**
- `generateStructuredOutput(...)` retries on invalid JSON
- schema-first extraction for reliable automation

**Streaming Support**
- event iterator for real-time UX
- emits `token`, `tool_call`, `final` (tool_result events are planned)

**Memory and Retrieval**
- pluggable memory adapters
- embeddings and similarity search helpers

**Observability**
- logger and tracer hooks
- token and cost helpers (when available)

## Market Positioning / Comparison

RunMesh is higher-level than the OpenAI SDK, simpler than LangChain, and more typed and modern for production use.

- **OpenAI SDK**: great low-level API access, but you still assemble tools, loops, retries, and observability.
- **LangChain**: powerful, but can feel heavy and magic-heavy for clean, typed app code.
- **RunMesh**: explicit runtime primitives, end-to-end typing, and predictable execution loops.

Think of it as the React/Vue style framework layer for agentic apps.

## Demo CLI

A streaming CLI demo lives here: `framework/apps/demo-cli`

```bash
pnpm install
pnpm --filter demo-cli run start "summarize this article: <url>"
```

See `framework/apps/demo-cli/index.ts` for the full example.

## Packages
- `@runmesh/core` - OpenAI client, streaming, response helpers, errors
- `@runmesh/agent` - agent runtime, planner/executor, policies
- `@runmesh/tools` - tool definition, registry, executor
- `@runmesh/memory` - memory adapters, embeddings, retrieval
- `@runmesh/schema` - Zod validation and JSON Schema export
- `@runmesh/observability` - logger, tracer, cost estimation
- `@runmesh/adapters` - CLI, Web, and Bot adapters

## License (Important)

RunMesh is licensed under Business Source License 1.1 (BSL 1.1).

Free to use for:
- personal projects
- internal or company use
- production deployments of your own apps

Commercial hosted offerings or "RunMesh-as-a-Service" require a commercial license.

A future change date will relicense to Apache-2.0 (see `LICENSE`).

For a commercial license, open an issue or contact the maintainer.

## Roadmap
- Responses API first path
- richer web demo (Next.js)
- CI and tests
- more adapters (Discord, Telegram)
- replayable runs and persistent traces

## Contributing

PRs welcome. If you build something with RunMesh, share it in Discussions.
