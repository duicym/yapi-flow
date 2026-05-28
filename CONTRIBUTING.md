# Contributing to YApi Flow

First off, thank you for considering contributing to YApi Flow! 🎉

## Development Setup

```bash
# Clone
git clone https://github.com/duicym/yapi-flow.git
cd yapi-flow

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in dev mode
cd packages/cli && pnpm dev

# Run tests
pnpm test
```

## Project Structure

```
yapi-flow/
├── packages/
│   ├── cli/        # CLI entry (Commander.js)
│   ├── core/       # Pipeline orchestration engine
│   ├── shared/     # Shared types and utilities
│   ├── publish/    # Stage 2: YApi publishing
│   └── generator/  # Stage 3+4: Code generation engine
└── docs/           # Documentation site
```

## Adding a New Language Generator

1. Create directory: `packages/generator/src/languages/<lang>/`
2. Implement the generator following the TypeScript generator as reference
3. Add templates in `templates/` directory
4. Register in `packages/generator/src/engine.ts`
5. Add tests in `packages/generator/__tests__/`

## Coding Style

- TypeScript strict mode
- Prettier for formatting (see `.prettierrc`)
- JSDoc comments for public APIs
- Functional style preferred, avoid classes where possible

## Pull Request Process

1. Fork the repo
2. Create a feature branch
3. Add tests for new functionality
4. Update docs if needed
5. Run `pnpm test` and ensure all pass
6. Submit PR with clear description

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

## Questions?

Open a [Discussion](https://github.com/duicym/yapi-flow/discussions) or join our community.
