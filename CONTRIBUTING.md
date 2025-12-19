# Contributing to RunMesh

Thank you for your interest in contributing to RunMesh! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Prerequisites**
   - Node.js >= 20.0.0
   - pnpm 8.15.1 or higher
   - Git

2. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/RunMesh.git
   cd RunMesh
   ```

3. **Install Dependencies**

   ```bash
   pnpm install
   ```

4. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY to .env
   ```

## Project Structure

```
RunMesh/
├── framework/
│   ├── packages/          # Core framework packages
│   │   ├── core/         # OpenAI client, streaming, responses
│   │   ├── agent/        # Agent runtime and planner
│   │   ├── tools/        # Tool definitions and execution
│   │   ├── memory/       # Memory adapters
│   │   ├── schema/       # Zod validation helpers
│   │   ├── observability/# Logging and tracing
│   │   └── adapters/     # Platform adapters
│   └── apps/             # Demo applications
│       ├── demo-cli/     # CLI demo
│       └── demo-web/     # Web demo
├── .github/
│   └── workflows/        # CI/CD pipelines
└── docs/                 # Documentation
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### 4. Lint and Format

```bash
# Check linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### 5. Build

```bash
pnpm build
```

### 6. Commit Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in response parsing"
git commit -m "docs: update README with examples"
git commit -m "test: add tests for planner"
git commit -m "refactor: simplify executor logic"
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build process or auxiliary tool changes

### 7. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Prefer `type` over `interface` for simple types
- Use `interface` for extensible object shapes
- Avoid `any` - use `unknown` if type is truly unknown
- Use descriptive variable names
- Add JSDoc comments for public APIs

### Testing

- Write unit tests for all new features
- Aim for >70% code coverage
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

```typescript
it("should execute plan steps in sequence", async () => {
  // Arrange
  const executor = createTestExecutor();
  const planner = new Planner(executor);

  // Act
  const result = await planner.execute({
    objective: "Test objective",
    steps: ["Step 1", "Step 2"]
  });

  // Assert
  expect(result.success).toBe(true);
  expect(result.steps).toHaveLength(2);
});
```

### Error Handling

- Use custom error classes that extend `RunMeshError`
- Preserve error context with `cause` parameter
- Provide helpful error messages

```typescript
throw new ValidationError("Invalid schema", originalError);
```

## Adding a New Package

1. Create package directory: `framework/packages/your-package/`
2. Add `package.json`:
   ```json
   {
     "name": "@runmesh/your-package",
     "version": "0.1.0",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts"
   }
   ```
3. Add `tsconfig.json`
4. Add `src/index.ts` with exports
5. Update root workspace configuration

## Adding Tests

Create test files alongside source files with `.test.ts` extension:

```
src/
  feature.ts
  feature.test.ts
```

Tests are automatically discovered by Vitest.

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for all exported functions/classes
- Include code examples in documentation
- Update CHANGELOG.md (if exists)

## Pull Request Guidelines

**Before Submitting:**

- [ ] Tests pass locally
- [ ] Code is linted and formatted
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

**PR Description Should Include:**

- What changes were made
- Why the changes were necessary
- How to test the changes
- Any breaking changes
- Related issues (if any)

## Getting Help

- Open an issue for bug reports or feature requests
- Join discussions for questions
- Tag maintainers for urgent issues

## License

By contributing, you agree that your contributions will be licensed under the BSL 1.1 license.
