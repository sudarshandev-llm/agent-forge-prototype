# Contributing to AgentForge

First off, thank you for considering contributing to AgentForge! It's people like you that make AgentForge such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@agentforge.dev.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues list to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible. Fill out the required template, the information it asks for helps us resolve issues faster.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include as many details as possible, including the steps you imagine you would take if the feature you're requesting existed.

### Pull Requests

1. Fill in the required template
2. Do not include issue numbers in the PR title
3. Follow the coding standards below
4. Include appropriate test coverage
5. Update documentation as needed
6. Ensure all tests pass before submitting

## Development Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized development)
- pnpm (recommended) or npm

### Local Development

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/your-username/AgentForge.git
   cd AgentForge
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Run database migrations:

   ```bash
   pnpm db:migrate
   ```

5. Seed development data (optional):

   ```bash
   pnpm db:seed
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

### Development Scripts

```bash
pnpm dev           # Start development servers
pnpm build         # Build for production
pnpm test          # Run tests
pnpm lint          # Lint code
pnpm format        # Format code
pnpm typecheck     # TypeScript type checking
pnpm db:migrate    # Run database migrations
pnpm db:seed       # Seed database
```

## Coding Standards

### TypeScript

- We use **TypeScript** exclusively — all new code must be written in TypeScript
- Strict mode is enabled in `tsconfig.json`
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and primitives
- Avoid `any` — use `unknown` if type is not known
- Use `as const` for literal types
- Prefer `async/await` over raw promises

### Naming Conventions

- **Files**: `kebab-case.ts`, `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase` prefixed with `I` for interfaces (or as configured in project ESLint)
- **Private class members**: prefix with `_`

### ESLint

We use ESLint with the following configuration:

- `@typescript-eslint/recommended`
- `eslint:recommended`
- `next/core-web-vitals` (for Next.js)
- `prettier` (for formatting)

Run `pnpm lint` before committing to ensure your code meets standards.

### Formatting

We use **Prettier** for automatic code formatting. Configuration is in `.prettierrc`:

- Semi-colons: required
- Single quotes: preferred
- Trailing commas: all
- Print width: 100
- Tab width: 2

## Commit Conventions

We follow **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                               |
| ---------- | --------------------------------------------------------- |
| `feat`     | A new feature                                             |
| `fix`      | A bug fix                                                 |
| `docs`     | Documentation only changes                                |
| `style`    | Changes that do not affect the meaning of code            |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf`     | A code change that improves performance                   |
| `test`     | Adding missing or correcting existing tests               |
| `chore`    | Changes to build process or auxiliary tools               |
| `ci`       | Changes to CI configuration files and scripts             |

### Examples

```
feat(agents): add multi-model support for Claude API
fix(memory): resolve context window overflow issue
docs(readme): update installation instructions
test(workflows): add integration tests for branching
```

## Pull Request Process

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes, following coding standards

3. Write or update tests as needed

4. Ensure all tests pass:

   ```bash
   pnpm test
   ```

5. Run linting and type checking:

   ```bash
   pnpm lint && pnpm typecheck
   ```

6. Commit your changes using conventional commit messages:

   ```bash
   git commit -m "feat(scope): your message"
   ```

7. Push to your fork and submit a pull request:

   ```bash
   git push origin feat/your-feature-name
   ```

8. Ensure the PR description clearly describes the change and references any related issues

### PR Review

- At least one maintainer review is required
- All CI checks must pass
- Changes requiring new dependencies need justification
- Significant API changes require documentation updates

## Testing Requirements

- **Unit tests**: Required for all new utility functions, hooks, and components
- **Integration tests**: Required for API routes, database operations, and external service integrations
- **End-to-end tests**: Required for critical user flows
- Minimum **80% code coverage** is expected for new code

### Running Tests

```bash
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Run tests with coverage report
pnpm test:e2e          # Run end-to-end tests
```

## Architecture Decisions

For significant architectural decisions, please create an **Architecture Decision Record (ADR)** in `docs/adr/`. This helps us track the rationale behind important choices.

## Questions?

If you have questions about contributing, feel free to:

- Open a [Discussion](https://github.com/agentforge/agentforge/discussions)
- Join our [Discord community](https://discord.gg/agentforge)
- Email us at contributors@agentforge.dev

Thank you for contributing to AgentForge!
