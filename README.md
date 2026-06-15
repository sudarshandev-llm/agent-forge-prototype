<p align="center">
  <pre>
    _    ____  _  _    ___   __ _  ___   ___   ___
   / \  / ___|| || |  / _ \ / _| |/ _ \ / _ \ / _ \
  / _ \ \___ \| || |_| | | | |_| | | | | | | | | | |
 / ___ \ ___) |__   _| |_| |  _| | |_| | |_| | |_| |
/_/   \_\____/   |_|  \___/|_| |_|\___/ \___/ \___/
  </pre>
</p>

<h1 align="center">AgentForge</h1>

<p align="center">
  <strong>The Open-Source AI Agent Platform — Build, Deploy, and Orchestrate Intelligent Agents at Scale</strong>
</p>

<p align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.4-blue" alt="TypeScript">
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js 15">
  </a>
  <a href="https://github.com/sudarshandev-llm/agent-forge-prototype/actions/workflows/ci.yml">
    <img src="https://github.com/sudarshandev-llm/agent-forge-prototype/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <a href="CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  </a>
  <a href="https://github.com/sudarshandev-llm/agent-forge-prototype">
    <img src="https://img.shields.io/github/stars/sudarshandev-llm/agent-forge-prototype?style=social" alt="GitHub stars">
  </a>
</p>

<p align="center">
  <a href="#-introduction">Introduction</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

## 📖 Introduction

**AgentForge** is a comprehensive, open-source platform for building, deploying, and orchestrating AI agents. Think of it as **LangChain's flexibility** meets **CrewAI's team-based orchestration** with **n8n's visual workflow builder** — all wrapped in a production-grade, full-stack application.

Unlike fragmented solutions where you stitch together LLM providers, memory systems, tool registries, and UIs, AgentForge provides a **unified platform** with:

- A **visual agent builder** for designing complex agent behaviors without coding
- **Multi-LLM orchestration** across OpenAI, Anthropic, Google, and local models
- **Team-based collaboration** where agents delegate, debate, and coordinate
- **Extensible tool ecosystem** with a built-in marketplace
- **Enterprise-grade security** with role-based access control and audit logging

Whether you're building a customer support bot, an automated code reviewer, a research assistant, or a complex multi-agent workflow, AgentForge gives you the foundation to go from idea to production in minutes.

---

## ✨ Key Features

- 🧠 **Agent Creation Engine** — Design agents with custom personas, goals, constraints, and knowledge bases
- 👥 **Agent Teams** — Form collaborative teams with role-based delegation (leader, researcher, executor, reviewer)
- 💾 **Persistent Memory** — Short-term (conversation) and long-term (vector store) memory with automatic RAG
- 🔧 **Tool System** — Extensible tool registry with 50+ built-in tools and MCP (Model Context Protocol) support
- 🛒 **Agent Marketplace** — Discover, install, and publish pre-built agents, tools, and templates
- 🔄 **Visual Workflow Builder** — Drag-and-drop workflow design with branching, loops, and conditions
- 🤖 **Multi-LLM Support** — OpenAI, Anthropic Claude, Google Gemini, Mistral, Groq, Ollama, and more
- 🐙 **GitHub Integration** — Code review automation, issue triage, PR analysis, and repo management
- 🌐 **Browser Automation** — Headless browser agent for web scraping, testing, and automation
- 💬 **Slack Integration** — Deploy agents directly to your Slack workspace
- 🔌 **REST API** — Comprehensive API for programmatic control of all platform features
- 📊 **Real-time Dashboard** — Monitor agent activity, performance metrics, and usage analytics
- 🔒 **Enterprise Security** — RBAC, SSO, audit logs, encryption at rest, and SOC 2 compliance ready
- 📦 **Containerized Deployment** — Docker Compose setup for one-command deployment
- 🧪 **Testing Framework** — Built-in agent testing sandbox with scenario simulation
- 🌍 **Webhook Support** — Trigger and receive webhooks for external system integration

---

## 🏗 Architecture

AgentForge follows a **modular, microservices-inspired architecture** built on a monorepo structure with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │ Next.js 15  │  │  Agent CLI  │  │  Mobile App │  │   External API     │ │
│  │  (Web App)  │  │  (Terminal) │  │  (Future)   │  │     Clients        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬─────────┘ │
└─────────┼────────────────┼────────────────┼─────────────────────┼───────────┘
          │                │                │                     │
┌─────────┼────────────────┼────────────────┼─────────────────────┼───────────┐
│         ▼                ▼                ▼                     ▼           │
│                         API GATEWAY / tRPC ROUTER                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Agents   │ │ Teams    │ │Workflows │ │ Memory   │ │ Tools    │  │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Auth     │ │Marketplace│ │  Queue   │ │Monitor   │ │ Webhook  │  │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────────┐
│                             ▼                                               │
│                        DATA & INFRASTRUCTURE                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │PostgreSQL│  │  Redis   │  │  BullMQ  │  │   S3/    │  │  Vector DB   │ │
│  │(Primary) │  │ (Cache)  │  │ (Queue)  │  │  Local   │  │ (pgvector)   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

- **Type Safety End-to-End** — tRPC ensures typesafe communication from database to UI
- **Event-Driven Architecture** — BullMQ handles async agent execution, webhooks, and notifications
- **Pluggable Providers** — LLM providers, vector stores, and file storage are all swappable
- **Stateless Services** — Horizontal scaling ready with shared-nothing design
- **Observability First** — OpenTelemetry instrumentation across all services

---

## 🛠 Tech Stack

| Layer           | Technology                                                | Purpose                                |
| --------------- | --------------------------------------------------------- | -------------------------------------- |
| **Frontend**    | Next.js 15 (App Router), React 19, Tailwind CSS, Radix UI | Web application UI                     |
| **Type Safety** | TypeScript (Strict), tRPC, Zod                            | End-to-end type safety                 |
| **Backend**     | Express.js, tRPC, Node.js 20+                             | API and server logic                   |
| **Database**    | PostgreSQL 15+, Drizzle ORM, pgvector                     | Primary data store & vector embeddings |
| **Cache**       | Redis 7+ (Upstash/ioredis)                                | Session cache, rate limiting, pub/sub  |
| **Queue**       | BullMQ                                                    | Async job processing & scheduling      |
| **Auth**        | NextAuth.js v5, JWT, OAuth                                | Authentication & authorization         |
| **Storage**     | Local filesystem, S3-compatible (AWS, R2, MinIO)          | File & asset storage                   |
| **LLM Clients** | AI SDK (Vercel), LangChain, OpenRouter                    | Multi-provider LLM integration         |
| **Monitoring**  | OpenTelemetry, Sentry, Pino                               | Logging, tracing, error tracking       |
| **Testing**     | Vitest, Playwright, MSW                                   | Unit, E2E, and API mocking             |
| **CI/CD**       | GitHub Actions, Docker, Docker Compose                    | Build, test, deploy                    |
| **Deployment**  | Docker, Vercel, Railway, Render, self-hosted              | Platform deployment                    |

---

## 📸 Screenshots

> Screenshots will be available in the `/apps/web/public/screenshots` directory once generated.

|                        Dashboard                        |                          Agent Builder                          |                       Workflow Editor                        |
| :-----------------------------------------------------: | :-------------------------------------------------------------: | :----------------------------------------------------------: |
| ![Dashboard](apps/web/public/screenshots/dashboard.png) | ![Agent Builder](apps/web/public/screenshots/agent-builder.png) | ![Workflow](apps/web/public/screenshots/workflow-editor.png) |
|                   **Chat Interface**                    |                         **Marketplace**                         |                        **Analytics**                         |
| ![Chat](apps/web/public/screenshots/chat-interface.png) |   ![Marketplace](apps/web/public/screenshots/marketplace.png)   |   ![Analytics](apps/web/public/screenshots/analytics.png)    |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or later (LTS recommended)
- **PostgreSQL** 15+ (with pgvector extension)
- **Redis** 7+
- **Docker** (optional, for containerized development)
- **pnpm** (recommended) or npm

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/sudarshandev-llm/agent-forge-prototype.git
cd agent-forge-prototype
```

#### 2. Install Dependencies

```bash
pnpm install
```

#### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agentforge"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
AUTH_SECRET="your-secret-key"
AUTH_GITHUB_ID="your-github-oauth-app-id"
AUTH_GITHUB_SECRET="your-github-oauth-app-secret"

# LLM API Keys
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="..."
```

#### 4. Run Database Migrations

```bash
pnpm db:migrate
```

#### 5. Seed Development Data (Optional)

```bash
pnpm db:seed
```

#### 6. Start Development Server

```bash
pnpm dev
```

Visit **[http://localhost:3000](http://localhost:3000)** to access AgentForge.

---

## 💡 Usage

### Creating an Agent

```typescript
import { AgentForge } from '@agentforge/core';

const forge = new AgentForge();

const agent = await forge.agents.create({
  name: 'Code Reviewer',
  persona: 'Senior software engineer with expertise in TypeScript and React',
  model: 'gpt-4o',
  tools: ['github', 'code-analysis', 'linting'],
  memory: {
    type: 'conversation',
    ttl: 3600,
  },
});

await agent.run('Review the latest PR in the main repository');
```

### Building a Workflow

Create visual workflows in the built-in editor, or define them programmatically:

```typescript
const workflow = await forge.workflows.create({
  name: 'Bug Triage Pipeline',
  steps: [
    { agent: 'triage-agent', action: 'classify_issue' },
    { agent: 'research-agent', action: 'find_similar_bugs' },
    { agent: 'reviewer-agent', action: 'assess_severity' },
    { agent: 'assigner-agent', action: 'assign_developer' },
  ],
  onComplete: {
    webhook: 'https://hooks.slack.com/services/...',
  },
});
```

### Using the Marketplace

```bash
# Install an agent from the marketplace
npx agentforge marketplace install agent-research-assistant

# Publish your own agent
npx agentforge marketplace publish
```

---

## 📂 Project Structure

```
agentforge/
├── apps/
│   ├── web/                          # Next.js 15 web application
│   │   ├── app/                      # App Router pages & API routes
│   │   ├── components/               # Shared React components
│   │   ├── lib/                      # Client-side utilities
│   │   └── public/                   # Static assets & screenshots
│   ├── api/                          # Express API server
│   │   ├── src/
│   │   │   ├── controllers/          # Route controllers
│   │   │   ├── services/             # Business logic
│   │   │   ├── middleware/           # Auth, rate limiting, validation
│   │   │   └── routes/              # API route definitions
│   │   └── test/                     # API tests
│   └── worker/                       # BullMQ worker for async processing
│       ├── src/
│       │   ├── jobs/                 # Job processors
│       │   └── queues/              # Queue definitions
│       └── test/                     # Worker tests
├── packages/
│   ├── core/                         # Core agent engine & abstractions
│   │   ├── src/
│   │   │   ├── agents/              # Agent creation & management
│   │   │   ├── teams/               # Team orchestration & delegation
│   │   │   ├── memory/              # Memory providers (conversation, vector)
│   │   │   ├── tools/               # Tool registry & built-in tools
│   │   │   └── llm/                 # LLM provider adapters
│   │   └── test/                    # Core unit & integration tests
│   ├── database/                     # Drizzle ORM schema & migrations
│   │   ├── schema/                  # Database table definitions
│   │   └── migrations/              # Migration files
│   ├── api/                          # tRPC routers & middleware
│   │   ├── routers/                 # tRPC route definitions
│   │   └── middleware/              # Auth, rate limiting, validation
│   └── shared/                       # Shared types, utilities, configs
│       ├── types/                   # Shared TypeScript types
│       ├── utils/                   # Shared utilities
│       └── config/                  # Shared configuration
├── infra/
│   ├── docker/                       # Docker & Docker Compose configs
│   └── github/                       # GitHub-specific infrastructure configs
├── scripts/                          # Build & maintenance scripts
├── docs/                             # Documentation
├── assets/                           # Logos, branding, media
├── .github/                          # GitHub templates & workflows
├── turbo.json                        # Turborepo configuration
├── package.json                      # Root package configuration
└── tsconfig.base.json                # Base TypeScript configuration
```

---

## 📚 API Documentation

AgentForge exposes a comprehensive REST and tRPC API. Key endpoints:

| Endpoint                     | Method  | Description                                  |
| ---------------------------- | ------- | -------------------------------------------- |
| `/api/agents`                | CRUD    | Manage agents (create, read, update, delete) |
| `/api/agents/:id/run`        | POST    | Execute an agent with input                  |
| `/api/teams`                 | CRUD    | Manage agent teams                           |
| `/api/workflows`             | CRUD    | Manage workflows                             |
| `/api/workflows/:id/execute` | POST    | Trigger a workflow execution                 |
| `/api/tools`                 | GET     | List available tools                         |
| `/api/marketplace/packages`  | GET     | Browse marketplace                           |
| `/api/auth/*`                | Various | Authentication endpoints                     |

Full API documentation is available in the `/docs` directory.

---

## 🤝 Contributing

We welcome contributions from the community! See our [Contributing Guide](CONTRIBUTING.md) for detailed information.

**Quick steps:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m "feat: add amazing feature"`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 🗺 Roadmap

### Q1 2026 — Foundation & Core

- [x] Agent creation and management engine
- [x] Multi-LLM provider support (OpenAI, Anthropic, Google, Groq)
- [x] Visual workflow builder
- [x] Tool system with MCP protocol support
- [x] Agent marketplace MVP
- [x] GitHub integration
- [x] Docker deployment

### Q2 2026 — Scale & Collaborate

- [🔄] Real-time agent collaboration and communication
- [🔄] Advanced team orchestration (debate, voting, consensus)
- [🔄] Enterprise SSO (SAML, OIDC, LDAP)
- [🔄] Audit logging and compliance reporting
- [🔄] Performance optimization and caching improvements
- [🔄] Agent analytics and cost tracking dashboard

### Q3 2026 — Ecosystem & Enterprise

- [📅] Mobile companion app (React Native)
- [📅] Custom model fine-tuning pipeline
- [📅] Agent-to-agent communication protocol
- [📅] Multi-tenant organization support with billing
- [📅] Advanced RAG with hybrid search
- [📅] Plugin SDK for third-party developers

### Q4 2026 — Platform Maturity

- [📅] Agent monitoring and observability suite
- [📅] Auto-scaling and self-healing infrastructure
- [📅] Compliance certifications (SOC 2, GDPR)
- [📅] Enterprise support tier
- [📅] On-premise deployment option
- [📅] Community governance model

---

## 📄 License

AgentForge is **MIT licensed**. See the [LICENSE](LICENSE) file for details.

---

## 👥 Contributors

<a href="https://github.com/sudarshandev-llm/agent-forge-prototype/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=sudarshandev-llm/agent-forge-prototype" alt="Contributors" />
</a>

**Want to become a contributor?** Check our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## 💬 Support

- **GitHub Issues** — Report bugs or request features
- **Documentation** — See the `/docs` directory
- **Email** — support@agentforge.dev

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=sudarshandev-llm/agent-forge-prototype&type=Date)](https://star-history.com/#sudarshandev-llm/agent-forge-prototype&Date)

---

## 🙏 Acknowledgments

AgentForge stands on the shoulders of giants. Special thanks to:

- **[LangChain](https://github.com/langchain-ai/langchain)** — For pioneering the LLM application framework concept
- **[CrewAI](https://github.com/joaomdmoura/crewai)** — For inspiring agent team orchestration patterns
- **[n8n](https://github.com/n8n-io/n8n)** — For the visual workflow builder paradigm
- **[Next.js](https://github.com/vercel/next.js)** — For the incredible React framework
- **[tRPC](https://github.com/trpc/trpc)** — For end-to-end typesafe APIs
- **[Drizzle ORM](https://github.com/drizzle-team/drizzle-orm)** — For the lightweight, type-safe ORM
- **[BullMQ](https://github.com/taskforcesh/bullmq)** — For robust job queue management
- **[Vercel AI SDK](https://github.com/vercel/ai)** — For streamlined LLM integrations
- **[All Contributors](https://github.com/sudarshandev-llm/agent-forge-prototype/graphs/contributors)** — Every contributor who helps make this project better

---

## 📋 Repository Topics

When setting up this repository on GitHub, add these topics:

- `ai-agents`
- `agent-framework`
- `llm`
- `nextjs`
- `typescript`
- `open-source`
- `multi-agent`
- `workflow-automation`
- `nodejs`
- `docker`

---

<p align="center">
  Made with ❤️ by the Team alum Team
  <br>
  <strong>AgentForge</strong> — Build the future of intelligent automation.
</p>
