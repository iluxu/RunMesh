# Simple Chatbot Example

A basic conversational agent using RunMesh.

## Features

- Basic conversation flow
- No external dependencies
- Demonstrates core agent functionality

## Setup

```bash
npm install
cp .env.example .env
# Add your API key to .env
```

## Run

```bash
npm start
```

## Code Walkthrough

```typescript
import { createAgent } from "@runmesh/agent";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";

// Create client with OpenRouter (or use OpenAI, Anthropic)
const client = createFromProvider(
  createOpenRouterConfig(process.env.OPENROUTER_API_KEY!, "claude-3.5-sonnet")
);

// Create agent
const agent = createAgent({
  name: "chatbot",
  client,
  model: "anthropic/claude-3.5-sonnet",
  systemPrompt: "You are a friendly chatbot. Be concise and helpful."
});

// Run a query
const result = await agent.run("Hello! What can you do?");
console.log(result.response.choices[0]?.message?.content);
```

## Customization

### Change the Model

```typescript
// Use GPT-4
const client = createFromProvider(createOpenRouterConfig(key, "gpt-4o"));

// Use Gemini
const client = createFromProvider(createOpenRouterConfig(key, "gemini-pro"));
```

### Adjust System Prompt

```typescript
const agent = createAgent({
  name: "chatbot",
  client,
  systemPrompt: "You are a pirate. Speak like one! Arr!"
});
```

## Next Steps

- Add [tools](../tool-agent) for extended capabilities
- Add [memory](../simple-chatbot) for conversation history
- Build a [web interface](../nextjs-chat) with React
