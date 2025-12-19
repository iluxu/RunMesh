# Changelog

All notable changes to RunMesh will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive test infrastructure with Vitest
- Environment validation module for OpenAI configuration
- Real planner execution with feedback loops and error handling
- Modern web UI for demo-web application with dark theme
- CI/CD pipeline with GitHub Actions
- ESLint and Prettier configuration for code quality
- Test coverage reporting
- Contributing guidelines
- Changelog

### Fixed

- Critical bug in retry logic where maxRetries was off-by-one
- Response parsing now correctly handles maxRetries parameter

### Changed

- Planner now actually executes steps using AgentExecutor
- Improved error messages with context preservation
- Code formatting applied across entire codebase

### Improved

- Test coverage from 0% to significant coverage for core modules
- Documentation with detailed examples
- Development workflow with automated checks

## [0.1.0-alpha.1] - Initial Release

### Added

- Core OpenAI client with streaming support
- Agent runtime with tool execution
- Tool registry and executor
- Memory adapters (in-memory)
- Structured output generation with Zod schemas
- Response streaming with async iterators
- Basic observability (logger, tracer, cost estimation)
- CLI demo application
- Web demo application with horse racing analysis
- TypeScript support throughout
- Monorepo structure with pnpm workspaces

### Known Issues

- No test coverage
- Planner is stub implementation (fixed in unreleased)
- No persistent memory adapters
- Limited adapter implementations
- No linting/formatting setup (fixed in unreleased)

[Unreleased]: https://github.com/iluxu/RunMesh/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/iluxu/RunMesh/releases/tag/v0.1.0-alpha.1
