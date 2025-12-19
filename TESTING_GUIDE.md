# RunMesh Testing & Launch Guide

Complete guide to test RunMesh before pushing to GitHub and npm.

## 🧪 Pre-Launch Checklist

### 1. Environment Setup

```bash
# Clone/navigate to repo
cd RunMesh

# Install dependencies
pnpm install

# Create .env for testing
cp .env.example .env
# Add your OPENROUTER_API_KEY or OPENAI_API_KEY
```

### 2. Run All Tests

```bash
# Run test suite
pnpm test

# Expected output:
# ✓ 27 tests passing
# No failures

# Run with coverage
pnpm test:coverage

# Check coverage report in coverage/index.html
```

### 3. Lint & Format Check

```bash
# Check linting
pnpm lint

# Should show: No errors

# Check formatting
pnpm format:check

# Should show: All files formatted correctly
```

### 4. Build All Packages

```bash
# Build all packages
pnpm build

# Verify build outputs
ls framework/packages/*/dist

# Should see compiled .js and .d.ts files in each package
```

### 5. Test Core Functionality

#### Test OpenRouter Integration

Create `test-openrouter.ts`:

```typescript
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";

const client = createFromProvider(
  createOpenRouterConfig(process.env.OPENROUTER_API_KEY!, "claude-3.5-sonnet")
);

const response = await client.respond({
  messages: [{ role: "user", content: "Say hello!" }]
});

console.log("✅ OpenRouter test passed");
console.log(response.choices[0]?.message?.content);
```

Run it:

```bash
npx tsx test-openrouter.ts
```

#### Test Agent with Tools

Create `test-agent.ts`:

```typescript
import { createAgent } from "@runmesh/agent";
import { tool, ToolRegistry } from "@runmesh/tools";
import { createOpenRouterConfig, createFromProvider } from "@runmesh/core";
import { z } from "zod";

const client = createFromProvider(
  createOpenRouterConfig(process.env.OPENROUTER_API_KEY!, "claude-3.5-sonnet")
);

const tools = new ToolRegistry();
tools.register(
  tool({
    name: "get_time",
    description: "Get current time",
    schema: z.object({}),
    handler: async () => ({ time: new Date().toISOString() })
  })
);

const agent = createAgent({
  name: "test-agent",
  client,
  model: "anthropic/claude-3.5-sonnet",
  tools
});

const result = await agent.run("What time is it?");
console.log("✅ Agent test passed");
console.log(result.response.choices[0]?.message?.content);
```

Run it:

```bash
npx tsx test-agent.ts
```

#### Test Structured Output

Create `test-structured.ts`:

```typescript
import {
  generateStructuredOutput,
  createOpenRouterConfig,
  createFromProvider
} from "@runmesh/core";
import { z } from "zod";

const client = createFromProvider(
  createOpenRouterConfig(process.env.OPENROUTER_API_KEY!, "claude-3.5-sonnet")
);

const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email()
});

const result = await generateStructuredOutput({
  client,
  request: {
    messages: [{ role: "user", content: "Extract: John Doe, 30 years old, john@example.com" }]
  },
  schema
});

console.log("✅ Structured output test passed");
console.log(result.value);
```

Run it:

```bash
npx tsx test-structured.ts
```

### 6. Test Demo Apps

#### Test Demo Web

```bash
cd framework/apps/demo-web

# Use the simplified server
npx tsx server-simple.ts

# In another terminal:
curl -X POST http://localhost:8787/api/agent \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello!"}'

# Should return agent response
```

Open browser to `http://localhost:8787` - test the UI.

#### Test Demo CLI

```bash
cd framework/apps/demo-cli
npx tsx index.ts "What's 2+2?"

# Should show agent response with tool usage
```

### 7. Test Examples

```bash
cd examples/simple-chatbot
npm install
npm start

# Test interactive chatbot
```

### 8. Test CLI Scaffolding

```bash
# Test the create-runmesh CLI
cd framework/packages/cli
npm link

# Create test project
cd /tmp
npx create-runmesh test-project

# Follow prompts, then:
cd test-project
npm install
npm run dev

# Should work without errors
```

## 📦 Prepare for npm Publishing

### 1. Update Package Versions

Edit `package.json` in root and all packages:

```json
{
  "version": "0.1.0"
}
```

### 2. Add npm Publishing Info

Each package needs:

```json
{
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/iluxu/RunMesh.git"
  },
  "bugs": {
    "url": "https://github.com/iluxu/RunMesh/issues"
  },
  "homepage": "https://runmesh.dev"
}
```

### 3. Build for Publishing

```bash
# Clean all
pnpm clean  # if you have this script

# Fresh build
pnpm build

# Verify no TypeScript errors
pnpm build --verbose
```

### 4. Test Package Installation

```bash
# Pack packages locally
cd framework/packages/core
npm pack
# Creates runmesh-core-0.1.0.tgz

# Test installation
cd /tmp
npm install /path/to/runmesh-core-0.1.0.tgz
# Verify it installs correctly
```

## 🚀 GitHub Push

### 1. Clean Repository

```bash
# Remove untracked files (be careful!)
git clean -xdn  # Dry run - see what would be removed

# If looks good:
git clean -xdf  # Actually remove
```

### 2. Final Commit

```bash
git add .
git commit -m "chore: prepare for v0.1.0 release"
```

### 3. Tag Release

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin main
git push origin v0.1.0
```

### 4. Create GitHub Release

1. Go to GitHub → Releases → Draft new release
2. Choose tag v0.1.0
3. Title: "RunMesh v0.1.0 - Initial Release"
4. Description: Copy from CHANGELOG.md
5. Publish release

## 📢 npm Publishing

### 1. Login to npm

```bash
npm login
# Enter credentials
```

### 2. Publish Packages

```bash
# Publish all packages
cd framework/packages/core && npm publish
cd framework/packages/agent && npm publish
cd framework/packages/tools && npm publish
cd framework/packages/memory && npm publish
cd framework/packages/schema && npm publish
cd framework/packages/observability && npm publish
cd framework/packages/adapters && npm publish
cd framework/packages/react && npm publish
cd framework/packages/cli && npm publish
```

Or use a script:

```bash
# Create publish script
cat > publish-all.sh << 'EOF'
#!/bin/bash
packages=(core agent tools memory schema observability adapters react cli)
for pkg in "${packages[@]}"; do
  echo "Publishing @runmesh/$pkg..."
  cd framework/packages/$pkg
  npm publish
  cd ../../..
done
EOF

chmod +x publish-all.sh
./publish-all.sh
```

### 3. Verify Published Packages

```bash
npm view @runmesh/core
npm view @runmesh/agent
# etc.
```

## ✅ Post-Launch Checklist

- [ ] All tests passing
- [ ] Builds successful
- [ ] Examples working
- [ ] GitHub pushed with tags
- [ ] npm packages published
- [ ] README badges updated
- [ ] Discord server created
- [ ] Twitter account set up
- [ ] Social media posts ready

## 🚨 Troubleshooting

### Tests Failing

```bash
# Clear cache
rm -rf node_modules
pnpm install

# Run tests individually
pnpm test framework/packages/core/src/response.test.ts
```

### Build Errors

```bash
# Check TypeScript version
npx tsc --version  # Should be 5.x

# Build with verbose logging
pnpm build --verbose
```

### Publishing Errors

```bash
# Check npm login
npm whoami

# Verify package.json has correct info
# Check no .npmignore blocking required files
```

## 🎯 Final Smoke Test

Create a fresh project and verify everything works:

```bash
cd /tmp
npx create-runmesh@latest smoke-test
cd smoke-test
npm install
npm run dev

# Should work perfectly!
```

---

**Ready to launch?** Follow this guide step-by-step and RunMesh will be ready for the world! 🚀
