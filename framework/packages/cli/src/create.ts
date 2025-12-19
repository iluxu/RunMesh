#!/usr/bin/env node

/**
 * create-runmesh - Project scaffolding tool
 * Like create-next-app but for AI agents
 */

import { program } from "commander";
import prompts from "prompts";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const TEMPLATES = {
  minimal: {
    name: "Minimal Agent",
    description: "Single agent with tools"
  },
  chatbot: {
    name: "Chatbot",
    description: "Full-featured chatbot with memory"
  },
  "multi-agent": {
    name: "Multi-Agent System",
    description: "Multiple specialized agents working together"
  },
  "api-server": {
    name: "API Server",
    description: "REST API with agent endpoints"
  },
  "web-app": {
    name: "Web Application",
    description: "Full-stack app with Next.js + RunMesh"
  }
} as const;

const PROVIDERS = {
  openrouter: {
    name: "OpenRouter",
    description: "200+ models (Claude, GPT, Gemini, Llama...)",
    envKey: "OPENROUTER_API_KEY"
  },
  openai: {
    name: "OpenAI",
    description: "GPT-4o, GPT-4-turbo, etc.",
    envKey: "OPENAI_API_KEY"
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Opus, etc.",
    envKey: "ANTHROPIC_API_KEY"
  }
} as const;

async function main() {
  console.log(chalk.bold.cyan("\n✨ Welcome to RunMesh CLI\n"));
  console.log(chalk.gray("The Angular of Gen AI Applications\n"));

  const response = await prompts([
    {
      type: "text",
      name: "projectName",
      message: "What is your project name?",
      initial: "my-runmesh-app"
    },
    {
      type: "select",
      name: "template",
      message: "Which template would you like to use?",
      choices: Object.entries(TEMPLATES).map(([value, { name, description }]) => ({
        title: `${name} - ${chalk.gray(description)}`,
        value
      }))
    },
    {
      type: "select",
      name: "provider",
      message: "Which AI provider?",
      choices: Object.entries(PROVIDERS).map(([value, { name, description }]) => ({
        title: `${name} - ${chalk.gray(description)}`,
        value
      }))
    },
    {
      type: "select",
      name: "packageManager",
      message: "Package manager?",
      choices: [
        { title: "pnpm", value: "pnpm" },
        { title: "npm", value: "npm" },
        { title: "yarn", value: "yarn" }
      ]
    },
    {
      type: "confirm",
      name: "installDeps",
      message: "Install dependencies now?",
      initial: true
    }
  ]);

  if (!response.projectName) {
    console.log(chalk.red("\n✖ Project creation cancelled"));
    process.exit(1);
  }

  const spinner = ora("Creating project...").start();

  try {
    // Create project directory
    const projectPath = join(process.cwd(), response.projectName);
    mkdirSync(projectPath, { recursive: true });

    // Generate files based on template
    await generateProject(projectPath, response);

    spinner.succeed(chalk.green("Project created successfully!"));

    // Install dependencies
    if (response.installDeps) {
      const installSpinner = ora("Installing dependencies...").start();
      await execa(response.packageManager, ["install"], { cwd: projectPath });
      installSpinner.succeed(chalk.green("Dependencies installed!"));
    }

    // Show next steps
    console.log(chalk.bold.cyan("\n🚀 Next steps:\n"));
    console.log(chalk.gray("  cd"), response.projectName);
    if (!response.installDeps) {
      console.log(chalk.gray(`  ${response.packageManager} install`));
    }
    console.log(
      chalk.gray(
        `  Add your ${PROVIDERS[response.provider as keyof typeof PROVIDERS].envKey} to .env`
      )
    );
    console.log(chalk.gray(`  ${response.packageManager} dev`));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red("Failed to create project"));
    console.error(error);
    process.exit(1);
  }
}

async function generateProject(path: string, config: any) {
  const { projectName, template, provider } = config;

  // package.json
  const packageJson = {
    name: projectName,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "tsx watch src/index.ts",
      build: "tsc",
      start: "node dist/index.js",
      test: "vitest"
    },
    dependencies: {
      "@runmesh/agent": "^0.1.0",
      "@runmesh/core": "^0.1.0",
      "@runmesh/tools": "^0.1.0",
      zod: "^3.23.8"
    },
    devDependencies: {
      "@types/node": "^20.11.0",
      tsx: "^4.7.0",
      typescript: "^5.3.3",
      vitest: "^1.2.0"
    }
  };

  writeFileSync(join(path, "package.json"), JSON.stringify(packageJson, null, 2));

  // .env
  const providerConfig = PROVIDERS[provider as keyof typeof PROVIDERS];
  const envContent = `# ${providerConfig.name} Configuration
${providerConfig.envKey}=your-api-key-here

# Optional: Specific model to use
MODEL=gpt-4o
`;

  writeFileSync(join(path, ".env"), envContent);
  writeFileSync(join(path, ".env.example"), envContent.replace(/=.+/g, "="));

  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: "./dist",
      rootDir: "./src"
    },
    include: ["src/**/*"]
  };

  writeFileSync(join(path, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));

  // .gitignore
  const gitignore = `node_modules
dist
.env
*.log
`;

  writeFileSync(join(path, ".gitignore"), gitignore);

  // Create src directory
  mkdirSync(join(path, "src"), { recursive: true });

  // Generate template-specific code
  const templateCode = generateTemplateCode(template, provider);
  writeFileSync(join(path, "src/index.ts"), templateCode);

  // README.md
  const readme = generateReadme(projectName, template, provider);
  writeFileSync(join(path, "README.md"), readme);
}

function generateTemplateCode(template: string, provider: string): string {
  const importProvider =
    provider === "openrouter"
      ? `import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";`
      : `import { createOpenAI } from "@runmesh/core";`;

  const clientSetup =
    provider === "openrouter"
      ? `const config = createOpenRouterConfig(
  process.env.OPENROUTER_API_KEY!,
  "claude-3.5-sonnet" // or any model from 200+ options
);
const client = createFromProvider(config);`
      : `const client = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  defaultModel: process.env.MODEL || "gpt-4o"
});`;

  if (template === "minimal") {
    return `import { createAgent } from "@runmesh/agent";
import { tool, ToolRegistry } from "@runmesh/tools";
${importProvider}
import { z } from "zod";

// Setup AI client
${clientSetup}

// Define tools
const tools = new ToolRegistry();

tools.register(
  tool({
    name: "get_weather",
    description: "Get weather for a location",
    schema: z.object({
      location: z.string().describe("City name")
    }),
    handler: async ({ location }) => {
      // In real app, call weather API
      return {
        location,
        temperature: 72,
        condition: "sunny"
      };
    }
  })
);

// Create agent
const agent = createAgent({
  name: "weather-assistant",
  client,
  model: "${provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : "gpt-4o"}",
  systemPrompt: "You are a helpful weather assistant.",
  tools
});

// Run agent
const result = await agent.run("What's the weather in Paris?");
console.log(result.response.choices[0]?.message?.content);
`;
  }

  // Add more templates...
  return `// ${template} template\nconsole.log("Template: ${template}");`;
}

function generateReadme(projectName: string, template: string, provider: string): string {
  return `# ${projectName}

Created with **RunMesh** - The Angular of Gen AI Applications

## Template: ${TEMPLATES[template as keyof typeof TEMPLATES].name}

## Provider: ${PROVIDERS[provider as keyof typeof PROVIDERS].name}

## Getting Started

1. Add your API key to \`.env\`:
   \`\`\`
   ${PROVIDERS[provider as keyof typeof PROVIDERS].envKey}=your-key-here
   \`\`\`

2. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Documentation

- [RunMesh Docs](https://runmesh.dev/docs)
- [Examples](https://runmesh.dev/examples)
- [API Reference](https://runmesh.dev/api)

## Features

✨ Multi-provider support (OpenRouter, OpenAI, Anthropic)
🔧 Type-safe tools with Zod schemas
💾 Built-in memory and context management
📊 Observability and logging
🔄 Streaming responses
🧪 Testing utilities

---

Built with ❤️ using RunMesh
`;
}

program.name("create-runmesh").description("Create a new RunMesh project").action(main);

program.parse();
