# Contributing to collect-ts

Thank you for your interest in contributing to collect-ts! This guide will help you get started.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ovdlinden/collect-ts.git
cd collect-ts

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linting
pnpm lint

# Build the package
pnpm build
```

## Development Workflow

### Branching

- Create feature branches from `main`
- Use descriptive branch names: `feat/add-new-method`, `fix/issue-123`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). This enables automatic changelog generation.

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `test` - Adding or updating tests
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `style` - Code style changes (formatting, etc.)
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `build` - Build system changes

**Examples:**
```
feat(collection): add new partition method
fix(lazy): resolve memory leak in chunked iteration
docs: update installation instructions
test: add edge case tests for flatten
```

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass: `pnpm test`
5. Ensure linting passes: `pnpm lint`
6. Push and create a PR against `main`

## Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting.

- **Indentation:** Tabs
- **Quotes:** Single quotes
- **Semicolons:** Always
- **Line width:** 120 characters

Pre-commit hooks automatically format staged files. You can also run:

```bash
pnpm lint          # Check for issues
pnpm format        # Auto-fix formatting
```

## Testing

Tests are written with [Vitest](https://vitest.dev/).

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

### Writing Tests

- Place tests in `tests/` directory
- Name test files `*.test.ts`
- Test edge cases and error conditions
- Aim for high coverage on new features

## Laravel Sync

collect-ts mirrors Laravel's Collection API. When adding or modifying methods:

1. **Check Laravel source:** Reference [Laravel's Collection.php](https://github.com/laravel/framework/blob/master/src/Illuminate/Support/Collection.php)
2. **Match signatures:** Keep method signatures consistent with Laravel
3. **Port tests:** Laravel's test cases are a great reference
4. **Document differences:** Note any TypeScript-specific adaptations

## Project Structure

```
collect-ts/
├── src/
│   ├── Collection.ts       # Main Collection class
│   ├── LazyCollection.ts   # Lazy evaluation collection
│   ├── index.ts            # Public exports
│   ├── exceptions/         # Exception classes
│   └── traits/             # Mixin traits
├── tests/
│   ├── Collection.test.ts
│   └── LazyCollection.test.ts
├── docs/                   # VitePress documentation
└── scripts/                # Build and sync scripts
```

## Questions?

- Open an [issue](https://github.com/ovdlinden/collect-ts/issues) for bugs or feature requests
- Check existing issues before creating new ones

Thank you for contributing!
