# Contributing to AgentForge

**First off, thank you for considering contributing to AgentForge!** We believe in the power of community-driven development and welcome contributions of all kinds — whether it's fixing a typo, adding a feature, improving documentation, or reporting a bug.

---

## Table of Contents

1. [Code of Conduct](#1-code-of-conduct)
2. [Getting Started](#2-getting-started)
3. [Development Workflow](#3-development-workflow)
4. [Coding Standards](#4-coding-standards)
5. [Testing Requirements](#5-testing-requirements)
6. [Documentation Standards](#6-documentation-standards)
7. [PR Review Process](#7-pr-review-process)
8. [Commit Message Convention](#8-commit-message-convention)
9. [Issue Reporting Guidelines](#9-issue-reporting-guidelines)
10. [Feature Request Process](#10-feature-request-process)
11. [Community Guidelines](#11-community-guidelines)
12. [Recognition](#12-recognition)

---

## 1. Code of Conduct

All contributors, maintainers, and community members are expected to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to:

- **Be respectful and inclusive** — Use welcoming and inclusive language. Respect differing viewpoints and experiences.
- **Focus on constructive feedback** — Critique ideas, not people. Provide actionable suggestions.
- **Prioritize community well-being** — Harassment, trolling, and personal attacks will not be tolerated.
- **Collaborate openly** — Assume good faith and give others the benefit of the doubt.

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team at [conduct@agentforge.io](mailto:conduct@agentforge.io).

---

## 2. Getting Started

### 2.1 Prerequisites

| Dependency | Version   | Purpose                         |
|------------|-----------|---------------------------------|
| Node.js    | >= 22.x   | Runtime for frontend & backend  |
| pnpm       | >= 9.x    | Package manager (monorepo)      |
| Docker     | >= 24.x   | Local PostgreSQL, Redis         |
| Git        | >= 2.40   | Version control                 |

Optional but recommended:
- **Ollama** — For running local LLMs during development
- **Docker Compose** — For spinning up the full stack locally

### 2.2 Local Setup

```bash
# Clone the repository
git clone https://github.com/agentforge/agentforge.git
cd agentforge

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d db redis

# Run database migrations
pnpm db:migrate

# Start development servers (frontend + backend)
pnpm dev
```

### 2.3 First Steps

1. **Explore the codebase** — Familiarize yourself with the monorepo structure under `packages/` (frontend, backend, shared, SDK).
2. **Find a good first issue** — Look for labels like `good first issue`, `help wanted`, or `bug` in our [issue tracker](https://github.com/agentforge/agentforge/issues).
3. **Join the discussion** — Introduce yourself in our [Discord](https://discord.gg/agentforge) `#contributors` channel.
4. **Read the docs** — Review the docs under `docs/` for architecture, API design, and system design details.

---

## 3. Development Workflow

We follow a standard **fork-and-pull** workflow:

### 3.1 Fork the Repository

Click the "Fork" button on the top-right of the [AgentForge GitHub page](https://github.com/agentforge/agentforge).

### 3.2 Create a Feature Branch

```bash
git checkout -b feat/my-feature-name
```

Branch naming convention:

| Prefix       | Purpose                       | Example                        |
|--------------|-------------------------------|--------------------------------|
| `feat/`      | New feature                   | `feat/agent-memory-persistence`|
| `fix/`       | Bug fix                       | `fix/rate-limit-header`        |
| `docs/`      | Documentation changes         | `docs/api-memory-endpoint`     |
| `chore/`     | Maintenance, deps, config     | `chore/update-docker-compose`  |
| `refactor/`  | Code restructuring            | `refactor/execution-engine`    |
| `test/`      | Adding or fixing tests        | `test/agent-service-unit`      |

### 3.3 Make Your Changes

- Keep changes focused on a single concern. If you find yourself fixing two unrelated bugs, use separate branches.
- Write or update tests to cover your changes.
- Ensure all existing tests pass.

### 3.4 Commit Your Changes

Follow the [Conventional Commits](#8-commit-message-convention) standard (see Section 8).

```bash
git commit -m "feat(agents): add memory persistence with pgvector"
```

### 3.5 Keep Your Fork Synced

```bash
git remote add upstream https://github.com/agentforge/agentforge.git
git fetch upstream
git rebase upstream/main
```

### 3.6 Push and Open a Pull Request

```bash
git push origin feat/my-feature-name
```

Then open a PR on [github.com/agentforge/agentforge](https://github.com/agentforge/agentforge) against the `main` branch.

---

## 4. Coding Standards

### 4.1 Language

All code **must** be written in **TypeScript**. We enforce strict type checking. Avoid `any` unless absolutely necessary and always justify with a comment.

### 4.2 Linting & Formatting

We use **ESLint** (with `@typescript-eslint`) for linting and **Prettier** for formatting. Configuration is shared across all packages via the root `eslint.config.js` and `prettier.config.js`.

```bash
# Check lint
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting (CI)
pnpm format:check
```

### 4.3 Style Guidelines

- **Indentation:** 2 spaces (set via `.editorconfig`).
- **Quotes:** Single quotes for strings, double quotes for JSX attributes.
- **Semicolons:** Required.
- **Naming:**
  - `camelCase` — Variables, functions, methods, file names (except components).
  - `PascalCase` — Classes, types, interfaces, enums, React components.
  - `UPPER_SNAKE_CASE` — Constants, environment variables, enum values.
  - `kebab-case` — Directory names, markdown files.
- **Imports:** Order: built-in → external → internal → relative. Use path aliases (`@/` for source root).
- **Exports:** Prefer named exports over default exports.
- **Async:** Use `async`/`await` over raw promises or callbacks.
- **Error handling:** Never swallow errors. Use typed error classes and structured error responses in the API layer.

### 4.4 File Organization

- One logical concern per file. Maximum ~400 lines per file; split into modules if it grows larger.
- React components go in `packages/frontend/src/components/` following the feature folder pattern.
- Backend routes go in `packages/backend/src/routes/`.
- Shared types go in `packages/shared/src/types/`.

---

## 5. Testing Requirements

We require tests for all new code. We use **Vitest** as our test runner and **Playwright** for end-to-end tests.

### 5.1 Test Types

| Type           | Location                        | Coverage Target | Run Command             |
|----------------|---------------------------------|-----------------|-------------------------|
| Unit tests     | Co-located (`*.test.ts`)        | >= 80%          | `pnpm test`             |
| Integration    | `packages/*/tests/integration/` | Critical paths  | `pnpm test:integration` |
| E2E            | `e2e/`                          | Core flows      | `pnpm test:e2e`         |

### 5.2 Writing Tests

- **Unit tests** — Test functions and classes in isolation. Mock external dependencies (DB, Redis, LLM APIs).
- **Integration tests** — Test API endpoints with real database connections (using testcontainers).
- **E2E tests** — Test critical user flows in a headless browser (Playwright).

### 5.3 Test Guidelines

- Use descriptive test names following the pattern: `describe('Feature')` → `it('should ...')`.
- Arrange → Act → Assert. Keep tests focused on one behavior.
- Do not test implementation details; test behavior and contracts.
- Use fixtures and factories (via `@/test/factories`) for test data.
- Never use `console.log` in tests; use the test runner's debugging tools.

### 5.4 CI Checks

All tests must pass before a PR is merged. The CI pipeline runs:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:integration
```

---

## 6. Documentation Standards

Good documentation is as important as good code.

### 6.1 When to Document

- **New features** must include documentation before the PR is merged.
- **API changes** must update the relevant API docs in `docs/API_DESIGN.md`.
- **Architecture changes** must update `docs/TECHNICAL_ARCHITECTURE.md` or `docs/SYSTEM_DESIGN.md`.
- **Configuration changes** must be reflected in `.env.example` and configuration docs.

### 6.2 Documentation Format

- All documentation is written in **Markdown** (`.md` files under `docs/`).
- Use [semantic line breaks](https://sembr.org/) (one sentence per line) for easier diff review.
- Include code examples where relevant, using fenced code blocks with language annotations.
- Use relative links for internal references.

### 6.3 Code Comments

- Write comments to explain **why**, not **what**. The code itself should express intent.
- Use JSDoc for all public APIs, exported functions, and complex types.
- Mark todos with `// TODO(username): description` and link to a GitHub issue.

---

## 7. PR Review Process

### 7.1 Before Submitting

- [ ] Branch is based on the latest `main`.
- [ ] All commits follow [Conventional Commits](#8-commit-message-convention).
- [ ] Tests are written/updated and pass locally.
- [ ] Lint (`pnpm lint`) and typecheck (`pnpm typecheck`) pass.
- [ ] Documentation is updated if needed.
- [ ] PR description follows the template (see `.github/PULL_REQUEST_TEMPLATE.md`).

### 7.2 PR Description

Include in the PR description:

- **What** does this change do?
- **Why** is this change needed? (Link to issue if applicable)
- **How** was it tested?
- **Screenshots** (for UI changes)

### 7.3 Review Flow

1. **Author** opens the PR.
2. **CI** runs automated checks (lint, typecheck, test, build).
3. **At least one maintainer** reviews the code.
4. **Author** addresses feedback (push new commits — do not rebase until review is complete).
5. **Reviewer** approves.
6. **Author** squashes commits if needed and rebases onto `main`.
7. **Maintainer** merges (using "squash and merge" or "rebase and merge").

### 7.4 Review Expectations

- Reviews happen within **2 business days** for most PRs.
- Be respectful and constructive in review comments.
- If you disagree with a reviewer's feedback, discuss politely. The reviewer has the final call on technical decisions.
- Small PRs (< 200 lines changed) are reviewed faster. Large PRs may be asked to be split up.

---

## 8. Commit Message Convention

We enforce **Conventional Commits** (v1.0.0) specification for all commits. This enables automated changelog generation and semantic versioning.

### 8.1 Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 8.2 Types

| Type       | Usage                                       |
|------------|---------------------------------------------|
| `feat`     | A new feature                               |
| `fix`      | A bug fix                                   |
| `docs`     | Documentation only changes                  |
| `style`    | Formatting, missing semicolons, etc.        |
| `refactor` | Code restructuring without behavior change  |
| `perf`     | Performance improvement                     |
| `test`     | Adding or fixing tests                      |
| `chore`    | Build process, dependencies, tooling        |
| `ci`       | CI/CD configuration changes                 |

### 8.3 Scopes

Common scopes include: `agents`, `memory`, `tools`, `workflows`, `api`, `auth`, `marketplace`, `frontend`, `backend`, `cli`, `sdk`, `docker`, `deps`.

### 8.4 Examples

```
feat(agents): add memory persistence with pgvector

Implements long-term memory storage using pgvector embeddings.
Closes #142.
```

```
fix(api): return correct rate limit headers on 429

The X-RateLimit-Remaining header was not being decremented
on ratelimited requests. This fix ensures the header reflects
the correct remaining quota.
```

```
docs(readme): add quickstart section for CLI setup
```

```
chore(deps): upgrade next to 15.2.0
```

### 8.5 Why This Matters

- Automated `CHANGELOG.md` generation via `standard-version` or `semantic-release`.
- Clear, searchable git history.
- Semantic version bumps are inferred from commit types.

---

## 9. Issue Reporting Guidelines

### 9.1 Before Filing an Issue

- Search existing [issues](https://github.com/agentforge/agentforge/issues) (open and closed) to avoid duplicates.
- Check the [discussions](https://github.com/agentforge/agentforge/discussions) for known workarounds.
- Ensure you're running the latest version.

### 9.2 Bug Reports

Use the **Bug Report** template. Include:

- **Summary** — Concise description of the bug.
- **Environment** — OS, Node.js version, browser (if applicable), AgentForge version.
- **Steps to reproduce** — Minimal, complete, verifiable steps.
- **Expected behavior** — What should happen.
- **Actual behavior** — What actually happens (screenshots, logs).
- **Severity** — Critical (blocks work), Major (feature broken), Minor (cosmetic/edge case).

### 9.3 Labeling

Maintainers will apply labels:

| Label                | Meaning                               |
|----------------------|---------------------------------------|
| `bug`                | Confirmed bug                         |
| `good first issue`   | Suitable for new contributors         |
| `help wanted`        | Needs community help                  |
| `needs reproduction` | Steps to reproduce are missing        |
| `priority`           | Should be addressed in current sprint |

---

## 10. Feature Request Process

### 10.1 Submission

1. **Start a Discussion** — Open a new [Discussion](https://github.com/agentforge/agentforge/discussions) under the "Ideas" category.
2. **Describe the feature** — What problem does it solve? Who is the target user?
3. **Provide examples** — Mockups, API shapes, or workflow diagrams are highly encouraged.
4. **Community feedback** — The community discusses and upvotes the proposal over 1–2 weeks.

### 10.2 Acceptance Criteria

A feature request is accepted when:

- It aligns with the [product roadmap](./FEATURE_ROADMAP.md).
- It has demonstrated community interest (upvotes, discussion engagement).
- A maintainer endorses it and converts it to a GitHub issue with the `feature` label.
- The scope is well-defined and achievable within a single development cycle.

### 10.3 Implementation

- Once accepted, the feature is added to the roadmap and prioritized.
- Contributors can self-assign the issue. For complex features, we recommend discussing the design approach in the issue before coding.
- Large features should be preceded by a short RFC document (template in `docs/rfcs/`).

---

## 11. Community Guidelines

### 11.1 Communication Channels

| Channel        | Purpose                                | Link                                    |
|----------------|----------------------------------------|-----------------------------------------|
| GitHub Issues  | Bug reports, feature requests          | [github.com/agentforge/agentforge/issues](https://github.com/agentforge/agentforge/issues) |
| GitHub Discussions | Q&A, ideas, general chat           | [github.com/agentforge/agentforge/discussions](https://github.com/agentforge/agentforge/discussions) |
| Discord        | Real-time chat, contributor hangouts   | [discord.gg/agentforge](https://discord.gg/agentforge) |
| Twitter / X    | Announcements                          | [@agentforge](https://twitter.com/agentforge) |

### 11.2 Contribution Etiquette

- Ask questions early if something is unclear — we love helping new contributors.
- Respect the time of maintainers and reviewers. They volunteer their time.
- If you're stuck on a PR, ask for help rather than abandoning it.
- Forks of the project for experimental or alternative approaches are welcome and encouraged.

### 11.3 Security Disclosures

**Do not** report security vulnerabilities in public issues. Email **[security@agentforge.io](mailto:security@agentforge.io)** directly. We follow a 90-day responsible disclosure window.

---

## 12. Recognition

We believe in celebrating our contributors.

### 12.1 Contributors List

- All contributors who merge a PR are added to the **CONTRIBUTORS.md** file and acknowledged in release notes.
- Top contributors are featured on the [AgentForge website](https://agentforge.io/contributors).

### 12.2 Badges & Swag

| Milestone                              | Recognition                        |
|----------------------------------------|------------------------------------|
| First PR merged                        | Contributor badge on GitHub + shoutout in Discord |
| 5+ PRs merged                          | Contributor tier on website        |
| 10+ PRs merged / Significant RFC       | Limited-edition AgentForge T-shirt or hoodie |
| Core maintainer                        | Invitation to maintainer team, swag pack, and conference travel support |

### 12.3 Maintainer Track

Consistent high-quality contributors may be invited to become **maintainers**, which includes write access to the repository, a voice in roadmap decisions, and recognition as an official project maintainer.

---

*Thank you for being part of AgentForge. Every contribution — no matter how small — makes this project better for everyone. Happy coding!*
