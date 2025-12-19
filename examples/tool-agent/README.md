# Tool-Using Agent Example

Agent with custom tools for real-world tasks.

## Features

- Custom tool definitions with Zod validation
- Type-safe tool inputs/outputs
- Multi-step tool usage
- Error handling

## What It Does

This agent has tools for:

- Weather lookup
- Calculator
- Web search (mock)
- Email sending (mock)

## Run

```bash
npm install
npm start
```

## Code Example

```typescript
const tools = new ToolRegistry();

tools.register(
  tool({
    name: "calculate",
    description: "Perform math calculations",
    schema: z.object({
      expression: z.string()
    }),
    handler: async ({ expression }) => {
      try {
        return { result: eval(expression), success: true };
      } catch (error) {
        return { error: "Invalid expression", success: false };
      }
    }
  })
);

const agent = createAgent({
  name: "tool-agent",
  client,
  tools // Pass tools to agent
});

// Agent will automatically use tools when needed
await agent.run("What's 123 * 456?");
```

## Add Your Own Tools

```typescript
tools.register(
  tool({
    name: "my_tool",
    description: "What it does",
    schema: z.object({
      param1: z.string(),
      param2: z.number().optional()
    }),
    handler: async (input) => {
      // Your logic here
      return { result: "..." };
    }
  })
);
```

## Best Practices

1. **Clear Descriptions**: Help the agent understand when to use the tool
2. **Validate Inputs**: Use Zod schemas for type safety
3. **Handle Errors**: Return structured error objects
4. **Return Structured Data**: Objects are better than strings

## Next Steps

- Build a [multi-agent system](../multi-agent)
- Add [memory](../simple-chatbot) for context
- Create a [web interface](../nextjs-chat)
