# AgentForge — Technical Architecture

> **Version:** 1.0.0  
> **Last Updated:** 2026-06-10  
> **Audience:** Developers, DevOps, Technical Architects

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack Rationale](#2-technology-stack-rationale)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Redis Architecture](#6-redis-architecture)
7. [BullMQ Queue Architecture](#7-bullmq-queue-architecture)
8. [API Design](#8-api-design)
9. [Security Implementation](#9-security-implementation)
10. [Docker Configuration](#10-docker-configuration)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [File/Folder Structure](#12-filefolder-structure)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Next.js 14 App (Frontend)                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │ App      │ │ React    │ │ Zustand  │ │ React Query   │  │  │
│  │  │ Router   │ │ Server   │ │ Stores   │ │ (TanStack     │  │  │
│  │  │ Pages    │ │ Comps    │ │           │ │  Query)       │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ HTTPS / WSS
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PROXY / LOAD BALANCER                          │
│                  Nginx / Cloudflare / AWS ALB                       │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY (Optional)                        │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Express.js API Server                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │   │
│  │  │ Routes   │ │Middleware│ │ Services │ │ WebSocket     │  │   │
│  │  │          │ │ Stack    │ │ Layer    │ │ (Socket.IO)   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────┬────────────────────────────┬─────────────────────────────┘
           │                            │
           ▼                            ▼
┌──────────────────────┐   ┌──────────────────────────┐
│    PostgreSQL DB      │   │         Redis             │
│  ┌────────────────┐  │   │  ┌─────────────────────┐ │
│  │  Tables         │  │   │  │ Cache / Sessions    │ │
│  │  Indexes        │  │   │  │ Pub/Sub Bus         │ │
│  │  Migrations     │  │   │  │ Rate Limiter        │ │
│  └────────────────┘  │   │  └─────────────────────┘ │
└──────────────────────┘   └──────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────┐
                    │       BullMQ (via Redis)     │
                    │  ┌────────────────────────┐ │
                    │  │ Queues                  │ │
                    │  │ Workers                 │ │
                    │  │ Schedulers              │ │
                    │  └────────────────────────┘ │
                    └────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────────────┐
                    │  External Services           │
                    │  OpenAI / Anthropic / etc.   │
                    │  Email (Resend/SendGrid)     │
                    │  File Storage (S3/R2)        │
                    └────────────────────────────┘
```

---

## 2. Technology Stack Rationale

| Technology | Version | Rationale |
|---|---|---|
| **Next.js 14** | 14.x | Full-stack React framework with App Router, React Server Components, streaming SSR, and server actions. Chosen over Remix for its mature ecosystem and Vercel-first deployment model. App Router provides nested layouts and fine-grained loading states. |
| **React 18** | 18.x | Concurrent features, `Suspense`, `useTransition`, and automatic batching. Required by Next.js 14. |
| **TypeScript** | 5.x | Static typing across the entire stack. Catches class of bugs at compile time, improves DX with IntelliSense, and serves as living documentation. |
| **Express.js** | 4.x | Mature, minimalist Node.js framework. Chosen over Fastify due to larger middleware ecosystem and simpler custom middleware. Lightweight enough to pair with edge-caching layers. |
| **Socket.IO** | 4.x | Bidirectional real-time communication with automatic fallback (WebSocket → polling). Chosen over raw WebSocket for built-in rooms, acknowledgements, and reconnection handling. |
| **PostgreSQL** | 16.x | ACID-compliant, advanced indexing (GiST, GIN, partial), JSONB for semi-structured agent configurations. Chosen over MySQL for superior extensibility and analytical query support. |
| **Redis** | 7.x | In-memory data store used for caching, session storage, BullMQ job queue backend, and pub/sub. Chosen over Memcached for versatility beyond simple key-value cache. |
| **BullMQ** | 5.x | Redis-backed job queue with delayed jobs, priority, rate limiting, and scheduler patterns. Chosen over Agenda/Bull for native TypeScript, ESM support, and rich dashboard (Bull Board). |
| **Zustand** | 4.x | Lightweight state management for React. Chosen over Redux for minimal boilerplate, no providers, and straightforward subscription model. Used for UI state only. |
| **React Query (TanStack Query)** | 5.x | Server state synchronization. Chosen over SWR for richer dev tools, infinite queries, optimistic updates, and first-class mutation handling. |
| **Clerk** | — | Authentication provider handling OAuth (Google, GitHub), MFA, session management, orgs. Chosen over Auth.js for lower self-hosted complexity and built-in webhooks. |
| **Drizzle ORM** | 0.30+ | Type-safe SQL ORM for TypeScript. Chosen over Prisma for better performance (no binary engine), SQL-like syntax, and superior migration tooling. |
| **Docker** | 24+ | Containerization for reproducible dev/staging/prod environments. Multi-stage builds keep production images slim. |

---

## 3. Frontend Architecture

### 3.1 Next.js App Router Structure

```
app/
├── (auth)/                    # Route group — auth pages
│   ├── sign-in/[[...sign-in]] → page.tsx (Clerk sign-in)
│   ├── sign-up/[[...sign-up]] → page.tsx (Clerk sign-up)
│   └── layout.tsx              # Auth-specific layout (minimal chrome)
├── (dashboard)/               # Route group — authenticated pages
│   ├── layout.tsx              # Dashboard layout (nav, sidebar, header)
│   ├── page.tsx                # /dashboard — overview/stats
│   ├── agents/
│   │   ├── page.tsx            # /dashboard/agents — agent list
│   │   ├── [agentId]/
│   │   │   ├── page.tsx        # Agent detail / chat
│   │   │   └── settings/page.tsx
│   │   └── new/page.tsx        # Create agent wizard
│   ├── workflows/
│   │   ├── page.tsx
│   │   └── [workflowId]/page.tsx
│   ├── api-keys/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── logs/
│       └── page.tsx
├── api/                        # API route handlers (BFF pattern)
│   ├── trpc/                   # tRPC handlers (if adopted)
│   └── webhooks/               # External webhook receivers
├── layout.tsx                  # Root layout (fonts, providers)
├── loading.tsx                 # Global loading boundary
├── error.tsx                   # Global error boundary
├── not-found.tsx
└── sitemap.ts / robots.ts
```

**Key patterns:**
- **Route Groups** (`(auth)`, `(dashboard)`) provide different layouts for public vs. authenticated sections.
- **Parallel Routes** (`@sidebar`, `@main`) for complex dashboard views.
- **Intercepting Routes** for modals (e.g., quick agent preview).
- **Loading UI** at each segment via `loading.tsx` — leverages `Suspense` boundaries.
- **Server Components by default** — client components (`'use client'`) only where interactivity is required.

### 3.2 Component Hierarchy

```
<RootLayout>
  <Providers>                     // ClerkProvider, QueryClientProvider, ThemeProvider
    <AuthGuard>                   // Redirects unauthenticated users
      <DashboardLayout>
        <Sidebar />               // Navigation links, org switcher
        <Header>                  // User menu, search, notifications
          <UserButton />          // Clerk's <UserButton />
          <NotificationBell />
        </Header>
        <main>
          {children}              // Page-specific content
        </main>
      </DashboardLayout>
    </AuthGuard>
  </Providers>
</RootLayout>

--- Page-level composition ---

<AgentListPage>
  <PageHeader title="Agents" />
  <AgentFilters />                // Search, tags, status filter
  <AgentGrid>                     // or <AgentTable>
    <AgentCard                    // Server or Client comp depending on interactivity
      agent={agent}
      actions={<AgentActions />}  // Delete, duplicate, edit
    />
  </AgentGrid>
  <Pagination />
</AgentListPage>

<AgentChatPage>
  <SplitPane>
    <ChatPanel>
      <MessageList />             // Virtualized (react-virtuoso)
      <MessageInput />            // Rich text, file upload, send
    </ChatPanel>
    <AgentSidebar>
      <AgentInfo />              // Name, model, system prompt
      <AgentTools />             // Enabled tools list
      <AgentMemory />            // Conversation memory settings
    </AgentSidebar>
  </SplitPane>
</AgentChatPage>
```

### 3.3 State Management Approach

```
┌──────────────────────────────────────────────────────────────────┐
│                      STATE ARCHITECTURE                            │
│                                                                    │
│  ┌─────────────────────┐       ┌────────────────────────────────┐ │
│  │   Zustand Stores     │       │   React Query (Server Cache)  │ │
│  │  (UI / Client State) │       │                                │ │
│  │─────────────────────│       │────────────────────────────────│ │
│  │ • useUIStore         │       │ • useAgents()        GET /api/agents       │
│  │   - sidebarOpen      │       │ • useAgent(id)       GET /api/agents/:id   │
│  │   - theme            │       │ • useCreateAgent()   POST /api/agents      │
│  │   - activeModal      │       │ • useAgentLogs(id)   GET /api/agents/:id/logs │
│  │   - toastQueue       │       │ • useWorkflows()     GET /api/workflows    │
│  │ • useChatStore        │       │ • useApiKeys()       GET /api/api-keys    │
│  │   - activeChatId      │       │ • useOrgMembers()    GET /api/org/members │
│  │   - inputDraft        │       └────────────────────────────────┘
│  │   - streamingState    │
│  │ • useFilterStore       │
│  │   - searchQuery       │
│  │   - statusFilter      │
│  └─────────────────────┘
│
│  ┌──────────────────────────────────────────────────────────────┐
│  │  React Context (Limited Use)                                  │
│  │  • ThemeContext       — theme preference (also in Zustand)    │
│  │  • SocketContext      — Socket.IO instance per user session   │
│  └──────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

**Data flow rules:**
1. **Server state** (agents, workflows, logs, API keys) → always React Query. Mutations go through `useMutation`, which invalidates queries on success.
2. **UI state** (sidebar, modals, theme, input drafts) → Zustand. No server involvement.
3. **Ephemeral state** (form fields) → local `useState` / `useForm` (React Hook Form).
4. **Real-time state** (chat messages, streaming tokens) → Zustand + Socket.IO event listeners update the store directly. React Query is **not** used for streaming data to avoid stale-while-revalidate issues.
5. **Cache invalidation** — after a mutation, call `queryClient.invalidateQueries({ queryKey: [...] })` to refetch.

### 3.4 API Client Layer

```
src/lib/api-client.ts
───────────────────────
- Axios instance with baseURL from env
- Request interceptor: attaches Clerk session token via `auth().getToken()`
- Response interceptor: handles 401 (redirect to sign-in), 429 (rate limit backoff), 5xx (toast)
- Type-safe wrapper functions per resource:

    agents.ts       → getAgents, getAgent, createAgent, updateAgent, deleteAgent
    workflows.ts    → getWorkflows, getWorkflow, createWorkflow, runWorkflow
    api-keys.ts     → getApiKeys, createApiKey, revokeApiKey
    logs.ts         → getAgentLogs, getWorkflowLogs
    chat.ts         → sendMessage (returns ReadableStream for SSE/streaming)

- tRPC alternative: if endpoints grow beyond ~30, migrate to tRPC for end-to-end type safety.
```

### 3.5 Authentication Flow

```
┌──────┐        ┌──────────┐        ┌────────────┐        ┌──────────┐
│ User │        │ Clerk UI │        │ Next.js    │        │ Express  │
│      │        │          │        │ Middleware  │        │ Backend  │
└──┬───┘        └────┬─────┘        └──────┬─────┘        └────┬─────┘
   │                  │                     │                   │
   │  Click Sign In   │                     │                   │
   │─────────────────>│                     │                   │
   │                  │                     │                   │
   │   OAuth / Email  │                     │                   │
   │<─────────────────│                     │                   │
   │                  │                     │                   │
   │   Redirect with  │                     │                   │
   │   session token  │                     │                   │
   │────────────────────────────────────────────────────────────>│
   │                  │                     │                    │
   │                  │                     │  Verify token      │
   │                  │                     │  via Clerk API     │
   │                  │                     │<───────────────────│
   │                  │                     │                    │
   │                  │                     │  Set req.user      │
   │                  │     API Request     │  Set session       │
   │                  │     (token in       │───────────────────>│
   │                  │      Authorization  │                    │
   │                  │      header)        │   Process request  │
   │                  │                     │   (authorization   │
   │                  │                     │    checked)        │
   │                  │     Response        │<───────────────────│
   │                  │<────────────────────│                    │
```

**Clerk integration points:**
- **Frontend:** `<ClerkProvider>` wraps the app. `useAuth()`, `useUser()`, `useOrganization()` hooks.
- **Next.js middleware:** `authMiddleware()` protects `/dashboard/*` routes, redirects to `/sign-in`.
- **Backend:** Clerk SDK's `clerkClient.verifyToken()` in Express middleware validates session JWTs.
- **Webhooks:** Clerk sends webhooks (user.created, organization.created) to `/api/webhooks/clerk`. These create/update records in PostgreSQL.

---

## 4. Backend Architecture

### 4.1 Express Middleware Stack

```
Request Flow (top to bottom):
─────────────────────────────

1. cors()                          — CORS headers (origin from env)
2. helmet()                        — Security headers (XSS, clickjacking, etc.)
3. express.json({ limit: '5mb' }) — Body parsing (with size limit)
4. cookie-parser                   — Parse cookies (for session refresh token)
5. morgan('combined')              — HTTP request logging
6. rateLimiter                     — express-rate-limit (global: 100/min, per-route)
7. authMiddleware                  — Verify Clerk JWT, attach req.user / req.orgId
8. requestLogger                   — Log structured request context (correlation ID)
9. router                          — Route handlers (see §8)
10. errorHandler                   — Catch-all error middleware (structured JSON errors)
11. notFoundHandler                — 404 fallback
```

**Error response format:**
```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent with ID 'abc-123' not found.",
    "details": { "agentId": "abc-123" },
    "requestId": "req_9a8b7c"
  }
}
```

### 4.2 Service Layer Pattern

```
src/
├── services/
│   ├── agent.service.ts          — Agent CRUD, run, stop, clone
│   ├── workflow.service.ts       — Workflow CRUD, execution, state transitions
│   ├── chat.service.ts           — Message handling, LLM streaming
│   ├── api-key.service.ts        — API key generation, validation, revocation
│   ├── llm.service.ts            — LLM provider abstraction (OpenAI, Anthropic, etc.)
│   ├── memory.service.ts         — Agent memory (conversation history, RAG)
│   ├── tool-execution.service.ts — Tool call execution sandbox
│   ├── organization.service.ts   — Org CRUD, member management
│   ├── billing.service.ts        — Usage tracking, invoicing (Stripe)
│   └── notification.service.ts   — Email, in-app, webhook notifications
```

**Service rules:**
- Services accept typed params, return typed results.
- Services **do not** depend on Express `req`/`res` objects.
- Services use **dependency injection** (constructor injection via simple factory pattern or `tsyringe`).
- Services throw typed errors (`AgentNotFoundError`, `WorkflowExecutionError`) that the error middleware maps to HTTP codes.
- Cross-cutting concerns (logging, metrics, tracing) use **decorators** or explicit wrapping.

### 4.3 Repository Pattern for Data Access

```
src/
├── db/
│   ├── repositories/
│   │   ├── agent.repository.ts       — SQL queries for agents table
│   │   ├── workflow.repository.ts    — Workflow CRUD + execution log queries
│   │   ├── message.repository.ts     — Chat messages (paginated, time-scoped)
│   │   ├── api-key.repository.ts     — API key hashes
│   │   └── organization.repository.ts
│   ├── schema/                       — Drizzle schema definitions
│   │   ├── agents.ts
│   │   ├── workflows.ts
│   │   ├── messages.ts
│   │   ├── api-keys.ts
│   │   └── organizations.ts
│   ├── migrations/                   — Drizzle Kit generated SQL migrations
│   ├── connection.ts                 — pg Pool + Drizzle client initialization
│   └── seed.ts                       — Development seed data
```

**Repository pattern rules:**
- Each repository maps to one primary table (may JOIN other tables for reads).
- Repositories return plain objects (no ORM proxy objects).
- Write operations are wrapped in transactions via `db.transaction()`.
- Read operations prefer indexed columns and use `.limit()` / `.offset()` for pagination.
- Queries are written in Drizzle's query builder (SQL-like) or raw SQL for complex queries.

### 4.4 WebSocket Handling

```
┌──────────────────────────────────────────────────────────────┐
│                 Socket.IO Architecture                        │
│                                                              │
│  Client                Server (Express + Socket.IO)           │
│  ┌─────┐              ┌──────────────────────────────────┐  │
│  │     │──connect──>  │  io.use(authMiddleware)           │  │
│  │     │              │    - verify JWT                    │  │
│  │     │              │    - join user room (user:{id})    │  │
│  │     │              │    - join org room (org:{id})      │  │
│  │     │              └──────────────────────────────────┘  │
│  │     │──join:agent  ──> room: agent:{agentId}             │
│  │     │──leave:agent ──> leave room                       │
│  │     │              │                                      │
│  │     │  Events:     │                                      │
│  │     │<──agent:status     — agent status change           │
│  │     │<──agent:log        — real-time log line            │
│  │     │<──chat:message     — new chat message              │
│  │     │<──chat:token       — streaming token               │
│  │     │<──workflow:update  — workflow step progress        │
│  │     │<──notification     — in-app notification           │
│  │     │──chat:send         — send message (or use REST)    │
│  └─────┘              │                                      │
└──────────────────────────────────────────────────────────────┘
```

**Rooms:**
- `user:{userId}` — personal notifications, any event for the user.
- `org:{orgId}` — org-wide events (member joined, agent shared).
- `agent:{agentId}` — agent runtime events (status, logs, streaming output).

**Scaling (horizontal):**
- Socket.IO **Adapter**: `@socket.io/redis-adapter` for cross-process message broadcasting.
- Redis pub/sub channels: `socket.io#/#` (default).
- Sticky sessions required (or use a shared adapter).

---

## 5. Database Architecture

### 5.1 PostgreSQL Schema

```
┌───────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  organizations                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK  (default: gen_random_uuid())             │  │
│  │ name          VARCHAR(255)  NOT NULL                             │  │
│  │ slug          VARCHAR(100)  UNIQUE NOT NULL                     │  │
│  │ logo_url      TEXT                                               │  │
│  │ plan          VARCHAR(50)   NOT NULL  DEFAULT 'free'            │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  │ updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  users                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK  (default: gen_random_uuid())             │  │
│  │ clerk_id      VARCHAR(255)  UNIQUE NOT NULL                     │  │
│  │ email         VARCHAR(255)  NOT NULL                             │  │
│  │ name          VARCHAR(255)                                       │  │
│  │ avatar_url    TEXT                                               │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  │ updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  organization_members                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ org_id        UUID  FK → organizations(id)  ON DELETE CASCADE   │  │
│  │ user_id       UUID  FK → users(id)          ON DELETE CASCADE   │  │
│  │ role          VARCHAR(50) NOT NULL DEFAULT 'member'             │  │
│  │               (admin | member | viewer)                          │  │
│  │ joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()                │  │
│  │ ───── UNIQUE(org_id, user_id) ─────                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  agents                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ org_id        UUID  FK → organizations(id)  ON DELETE CASCADE   │  │
│  │ created_by    UUID  FK → users(id)                               │  │
│  │ name          VARCHAR(255) NOT NULL                              │  │
│  │ description   TEXT                                               │  │
│  │ system_prompt TEXT          NOT NULL                              │  │
│  │ model         VARCHAR(100) NOT NULL DEFAULT 'gpt-4o'            │  │
│  │ temperature   REAL          NOT NULL DEFAULT 0.7                │  │
│  │ max_tokens    INTEGER       NOT NULL DEFAULT 4096               │  │
│  │ tools         JSONB         NOT NULL DEFAULT '[]'               │  │
│  │               — [{ type: "web_search", config: {} }]             │  │
│  │ memory_config JSONB         NOT NULL DEFAULT '{}'               │  │
│  │               — { type: "buffer", k: 10 }                       │  │
│  │ status        VARCHAR(50)   NOT NULL DEFAULT 'inactive'         │  │
│  │               (active | inactive | error)                        │  │
│  │ metadata      JSONB         NOT NULL DEFAULT '{}'               │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  │ updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  │ deleted_at    TIMESTAMPTZ   — soft delete                       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  sessions                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ agent_id      UUID  FK → agents(id)        ON DELETE CASCADE    │  │
│  │ org_id        UUID  FK → organizations(id)                      │  │
│  │ title         VARCHAR(255) NOT NULL DEFAULT 'New Session'       │  │
│  │ status        VARCHAR(50)  NOT NULL DEFAULT 'active'            │  │
│  │               (active | archived)                                │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  │ updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  messages                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ session_id    UUID  FK → sessions(id)     ON DELETE CASCADE     │  │
│  │ role          VARCHAR(50)  NOT NULL                              │  │
│  │               (user | assistant | system | tool)                 │  │
│  │ content       TEXT          NOT NULL                              │  │
│  │ tool_calls    JSONB                  — array of tool invocations │  │
│  │ metadata      JSONB         NOT NULL DEFAULT '{}'               │  │
│  │               — { tokens: 150, model: "gpt-4o", latency: 1234 } │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  workflows                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ org_id        UUID  FK → organizations(id)  ON DELETE CASCADE   │  │
│  │ created_by    UUID  FK → users(id)                               │  │
│  │ name          VARCHAR(255) NOT NULL                              │  │
│  │ description   TEXT                                               │  │
│  │ steps         JSONB         NOT NULL                              │  │
│  │               — [{ stepId, type, config, next: [...] }]         │  │
│  │ triggers      JSONB         NOT NULL DEFAULT '[]'               │  │
│  │               — [{ type: "schedule", cron: "0 9 * * *" }]       │  │
│  │ status        VARCHAR(50)   NOT NULL DEFAULT 'draft'            │  │
│  │               (draft | active | paused | error)                  │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  │ updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  │ deleted_at    TIMESTAMPTZ                                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  workflow_executions                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ workflow_id   UUID  FK → workflows(id)    ON DELETE CASCADE     │  │
│  │ triggered_by  UUID  FK → users(id)        (nullable)            │  │
│  │ status        VARCHAR(50) NOT NULL DEFAULT 'pending'            │  │
│  │               (pending | running | completed | failed)           │  │
│  │ input         JSONB                                              │  │
│  │ output        JSONB                                              │  │
│  │ error         TEXT                                               │  │
│  │ started_at    TIMESTAMPTZ                                        │  │
│  │ completed_at  TIMESTAMPTZ                                        │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  api_keys                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ org_id        UUID  FK → organizations(id)  ON DELETE CASCADE   │  │
│  │ created_by    UUID  FK → users(id)                               │  │
│  │ name          VARCHAR(255) NOT NULL                              │  │
│  │ key_prefix    VARCHAR(10)  NOT NULL              — "af_" prefix  │  │
│  │ key_hash      VARCHAR(255) NOT NULL              — bcrypt hash   │  │
│  │ last_chars    VARCHAR(4)   NOT NULL              — display only  │  │
│  │ permissions   JSONB         NOT NULL DEFAULT '["read"]'          │  │
│  │ expires_at    TIMESTAMPTZ                                        │  │
│  │ last_used_at  TIMESTAMPTZ                                        │  │
│  │ revoked_at    TIMESTAMPTZ                                        │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  agent_logs                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ agent_id      UUID  FK → agents(id)       ON DELETE CASCADE     │  │
│  │ session_id    UUID  FK → sessions(id)     (nullable)            │  │
│  │ level         VARCHAR(20) NOT NULL DEFAULT 'info'               │  │
│  │               (debug | info | warn | error)                      │  │
│  │ message       TEXT          NOT NULL                              │  │
│  │ metadata      JSONB         NOT NULL DEFAULT '{}'               │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  │ ──────── PARTITION BY RANGE (created_at) ─────────              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  usage_events                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ id            UUID  PK                                           │  │
│  │ org_id        UUID  FK → organizations(id) ON DELETE CASCADE    │  │
│  │ agent_id      UUID  FK → agents(id)                             │  │
│  │ event_type    VARCHAR(50) NOT NULL                              │  │
│  │               (llm_request | tool_call | workflow_step)          │  │
│  │ tokens_in     INTEGER       NOT NULL DEFAULT 0                  │  │
│  │ tokens_out    INTEGER       NOT NULL DEFAULT 0                  │  │
│  │ cost_cents    INTEGER       NOT NULL DEFAULT 0                  │  │
│  │ created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

### 5.2 Indexing Strategy

```sql
-- Primary indexes (auto on PK)
-- PostgreSQL automatically creates a B-tree index on PRIMARY KEY columns.

-- Foreign key indexes (manual — critical for JOIN performance)
CREATE INDEX idx_org_members_org_id     ON organization_members(org_id);
CREATE INDEX idx_org_members_user_id    ON organization_members(user_id);
CREATE INDEX idx_agents_org_id          ON agents(org_id);
CREATE INDEX idx_sessions_agent_id      ON sessions(agent_id);
CREATE INDEX idx_sessions_org_id        ON sessions(org_id);
CREATE INDEX idx_messages_session_id    ON messages(session_id);
CREATE INDEX idx_workflows_org_id       ON workflows(org_id);
CREATE INDEX idx_workflow_exec_wf_id    ON workflow_executions(workflow_id);
CREATE INDEX idx_api_keys_org_id        ON api_keys(org_id);
CREATE INDEX idx_agent_logs_agent_id    ON agent_logs(agent_id);
CREATE INDEX idx_usage_events_org_id    ON usage_events(org_id);

-- Selective / Partial indexes
CREATE INDEX idx_agents_active          ON agents(org_id) WHERE status = 'active';
CREATE INDEX idx_sessions_active        ON sessions(agent_id) WHERE status = 'active';
CREATE INDEX idx_workflows_active       ON workflows(org_id) WHERE status = 'active';

-- Time-series query indexes (for logs, usage)
CREATE INDEX idx_agent_logs_created_at  ON agent_logs(org_id, created_at DESC)
  WHERE level IN ('warn', 'error');
CREATE INDEX idx_usage_events_created   ON usage_events(org_id, created_at DESC);

-- Full-text search index (for agent name/description)
CREATE INDEX idx_agents_fts             ON agents
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- JSONB index (for agent tool queries)
CREATE INDEX idx_agent_tools            ON agents USING GIN (tools);
CREATE INDEX idx_workflow_steps         ON workflows USING GIN (steps);

-- Composite covering indexes
CREATE INDEX idx_messages_session_time  ON messages(session_id, created_at ASC);
CREATE INDEX idx_workflow_exec_status   ON workflow_executions(workflow_id, status);
```

**Partitioning:**
- `agent_logs` — **partition by RANGE on `created_at`** (monthly partitions) for efficient time-range pruning and easy archival.
- `messages` — partition by RANGE on `created_at` if volume exceeds ~50M rows.

### 5.3 Migration Approach

```
Tool: Drizzle Kit (drizzle-kit)

Commands:
  drizzle-kit generate:pg     — Generate SQL migration from schema diff
  drizzle-kit migrate         — Apply pending migrations
  drizzle-kit push:pg         — Push schema directly (dev only)
  drizzle-kit pull            — Introspect DB → generate schema file

Migration files stored in:  src/db/migrations/

Workflow:
  1. Edit Drizzle schema files in  src/db/schema/
  2. Run  pnpm db:generate     → produces  src/db/migrations/XXXX_migration_name.sql
  3. Review generated SQL (critical step — Drizzle may miss renames)
  4. Run  pnpm db:migrate      → applies migration in order
  5. Run  pnpm db:seed         → populate test data (dev/staging only)

Production rules:
  - Never use `push:pg` on production
  - Always review generated SQL manually
  - Write rollback SQL in a `migrations/rollbacks/` directory
  - Use `db.transaction()` in seed files to ensure atomicity
```

---

## 6. Redis Architecture

### 6.1 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     CACHE LAYERS                                 │
│                                                                 │
│  ┌─────────────────────┐    ┌───────────────────────────────┐  │
│  │  L1: In-Memory       │    │  L2: Redis (Distributed)      │  │
│  │  (Node.js Map)       │    │                               │  │
│  │  • Short TTL (2-5s)  │    │  • Medium TTL (30-300s)      │  │
│  │  • Small payloads    │    │  • All cacheable data        │  │
│  │  • Per-instance      │    │  • Shared across instances  │  │
│  └─────────────────────┘    └───────────────────────────────┘  │
│                                                                 │
│  Cache keys naming convention:                                  │
│    agent:{orgId}:{agentId}                                      │
│    agents:list:{orgId}:{status}:{page}                          │
│    session:{sessionId}:messages:{limit}                         │
│    org:{orgId}:members                                          │
│    llm:config:{modelName}                                       │
│    rate:limit:{userId}:{endpoint}                               │
│                                                                 │
│  Cache-aside pattern:                                           │
│    1. Check L1 → hit? return                                    │
│    2. Check L2 → hit? set L1, return                           │
│    3. Query DB → set L2, set L1, return                        │
│                                                                 │
│  Invalidation:                                                  │
│    • After write to entity → DEL / PUBLISH cache key            │
│    • TTL-based expiry is primary invalidation mechanism         │
│    • Pattern-based flush: await cache.flushPattern('agents:*')  │
└─────────────────────────────────────────────────────────────────┘
```

**Cacheable vs. non-cacheable data:**

| Data | Cache TTL | Strategy |
|---|---|---|
| Agent config (system prompt, tools, model) | 300s | Write-through |
| Session message list (last N messages) | 60s | Cache-aside |
| API key → org mapping | 600s | Cache-aside |
| Org member list | 120s | Write-through |
| Usage quotas / rate limits | sliding window | Redis sorted sets |
| Chat streaming tokens | — | **Not cached** (real-time) |
| Agent execution logs | — | **Not cached** (write-heavy) |

### 6.2 Session Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION STRATEGY                               │
│                                                                 │
│  Clerk manages JWTs (stateless). Redis sessions for:            │
│                                                                 │
│  1. Rate limiting counters                                      │
│     Key:  rate:limit:{userId}:{endpoint}                        │
│     Type: Sorted Set (score = timestamp)                        │
│     TTL:  sliding window (60s)                                  │
│                                                                 │
│  2. WebSocket connection registry                               │
│     Key:  ws:connections:{userId}                               │
│     Type: Set of socket IDs                                     │
│     TTL:  None (explicit cleanup on disconnect)                 │
│                                                                 │
│  3. Temporary tokens (password reset, invite)                   │
│     Key:  token:{tokenId}                                       │
│     Type: String (JSON payload)                                 │
│     TTL:  15 minutes                                            │
│                                                                 │
│  4. API key → Org lookup cache                                  │
│     Key:  apikey:{keyPrefix}:{hashSuffix}                       │
│     Type: Hash (orgId, permissions, userId)                     │
│     TTL:  600s                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Real-Time Pub/Sub

```
┌─────────────────────────────────────────────────────────────────┐
│                    REDIS PUB/SUB CHANNELS                        │
│                                                                 │
│  Channel pattern:  agentforge:{eventType}                       │
│                                                                 │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐  │
│  │  agent:status  │    │  chat:message  │    │ workflow:step │  │
│  │  • active      │    │  • new_message │    │  • started    │  │
│  │  • inactive    │    │  • token       │    │  • completed  │  │
│  │  • error       │    │  • error       │    │  • failed     │  │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘  │
│          │                    │                    │           │
│          ▼                    ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Message Broker (Redis)                       │  │
│  │                                                          │  │
│  │  Publisher: Express server (on agent state change)       │  │
│  │  Subscriber: Socket.IO adapter (broadcast to clients)    │  │
│  │  Subscriber: Worker processes (horizontal scaling)       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Usage:                                                         │
│  - Agent status changes  → PUB → Socket.IO → WebSocket client  │
│  - LLM token stream      → PUB → Socket.IO → Chat UI           │
│  - Workflow step update  → PUB → Socket.IO → Workflow page    │
│  - Cache invalidation    → PUB → All app instances             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. BullMQ Queue Architecture

### 7.1 Job Types

```
┌─────────────────────────────────────────────────────────────────┐
│                      BULLMQ QUEUE DEFINITIONS                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Queue: agent-execution                                   │  │
│  │  ├── Process agent messages (LLM calls)                   │  │
│  │  ├── Concurrency: 5 per worker                            │  │
│  │  └── Jobs: { agentId, sessionId, message, context }       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Queue: workflow-execution                                │  │
│  │  ├── Execute workflow steps (DAG traversal)               │  │
│  │  ├── Concurrency: 3 per worker                            │  │
│  │  └── Jobs: { workflowId, executionId, stepId, input }    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Queue: email                                             │  │
│  │  ├── Send transactional emails (invites, receipts, etc.) │  │
│  │  ├── Concurrency: 10 per worker                           │  │
│  │  └── Jobs: { to, subject, body, templateId, data }       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Queue: webhook-outgoing                                  │  │
│  │  ├── Deliver webhooks to external URLs                   │  │
│  │  ├── Concurrency: 20 per worker                           │  │
│  │  └── Jobs: { url, event, payload, retryCount }           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Queue: cleanup                                           │  │
│  │  ├── Periodic: archive old logs, delete expired sessions  │  │
│  │  ├── Concurrency: 1 (serial to avoid conflicts)           │  │
│  │  └── Jobs: { type, olderThan }                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Worker Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKER SETUP                                   │
│                                                                 │
│  // src/queue/workers/agent-execution.worker.ts                 │
│  import { Worker } from 'bullmq';                               │
│                                                                 │
│  const worker = new Worker(                                     │
│    'agent-execution',                                           │
│    async (job) => {                                             │
│      const { agentId, sessionId, message } = job.data;          │
│      const agent = await agentService.getAgent(agentId);        │
│      const response = await llmService.generate(                │
│        agent.model,                                             │
│        agent.systemPrompt,                                      │
│        message,                                                 │
│        { tools: agent.tools, stream: true }                     │
│      );                                                         │
│      await messageService.save(sessionId, response);            │
│      return { messageId: response.id, tokens: response.tokens };│
│    },                                                           │
│    {                                                            │
│      connection: { host: process.env.REDIS_HOST },               │
│      concurrency: 5,                                            │
│      lockDuration: 60_000,        // 60s max job lock           │
│      stalledInterval: 30_000,     // check stalls every 30s     │
│      maxStalledCount: 2,          // retry stalled jobs twice   │
│      removeOnComplete: { age: 3600 * 24, count: 1000 },        │
│      removeOnFail: { age: 3600 * 24 * 7 },                     │
│    }                                                            │
│  );                                                             │
│                                                                 │
│  worker.on('completed', (job) => log.info({ job.id }));         │
│  worker.on('failed', (job, err) => log.error({ job.id, err }));│
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Retry and Failure Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    RETRY & FAILURE STRATEGIES                    │
│                                                                 │
│  Queue              Max Retries   Backoff          Dead-Letter  │
│  ─────────────────────────────────────────────────────────────  │
│  agent-execution    3             exponential 10s   N/A        │
│  workflow-execution  2             exponential 30s   N/A        │
│  email              5             exponential 5s    email:dead │
│  webhook-outgoing   10            exponential 60s   webhook:dlq │
│  cleanup             1             fixed 10s         N/A        │
│                                                                 │
│  Backoff formula:  delay = baseDelay * 2^(attempt - 1)          │
│  Example:  10s → 20s → 40s                                      │
│                                                                 │
│  Failure handling per queue:                                    │
│                                                                 │
│  agent-execution:                                               │
│    - LLM provider error: retry (transient)                      │
│    - Rate limit error: retry with longer delay                  │
│    - Invalid agent config: move to failed (permanent)           │
│    - On max retries: set agent.status = 'error', emit event     │
│                                                                 │
│  workflow-execution:                                            │
│    - Step failure: set workflow_execution.status = 'failed'     │
│    - Store error message in execution record                    │
│    - Emit 'workflow:update' event with failure info             │
│                                                                 │
│  webhook-outgoing:                                              │
│    - Non-2xx response: retry                                    │
│    - 410 Gone / 404 Not Found: move to DLQ (don't retry)       │
│    - On max retries: move to dead-letter queue for manual       │
│      inspection via Bull Board                                  │
│                                                                 │
│  All queues:                                                    │
│    - Failed jobs are logged with full context                   │
│    - Bull Board UI available at /admin/queues in dev            │
│    - Metrics: job duration, queue depth, failure rate           │
│      exposed as Prometheus metrics                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. API Design

### 8.1 RESTful Endpoints

```
Base URL:  https://api.agentforge.dev/v1
Content-Type:  application/json
Authorization:  Bearer <clerk_jwt>  or  X-API-Key <api_key>

┌──────────────────────────────────────────────────────────────────────┐
│                          API ENDPOINTS                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ── Agents ───────────────────────────────────────────────────────  │
│  GET    /agents              → list agents (paginated, filterable)   │
│  POST   /agents              → create agent                          │
│  GET    /agents/:id          → get agent details                     │
│  PATCH  /agents/:id          → update agent (partial)                │
│  DELETE /agents/:id          → soft-delete agent                     │
│  POST   /agents/:id/run      → execute agent (single message)       │
│  POST   /agents/:id/stop     → stop agent execution                  │
│  POST   /agents/:id/clone    → duplicate agent                       │
│                                                                      │
│  ── Sessions ──────────────────────────────────────────────────────  │
│  GET    /agents/:id/sessions   → list sessions for an agent          │
│  POST   /agents/:id/sessions   → create new session                  │
│  GET    /sessions/:id          → get session detail + messages       │
│  PATCH  /sessions/:id          → update session (title, status)      │
│  DELETE /sessions/:id          → delete session                      │
│                                                                      │
│  ── Messages ───────────────────────────────────────────────────────  │
│  GET    /sessions/:id/messages  → list messages (paginated)          │
│  POST   /sessions/:id/messages  → send message (returns stream)      │
│                                                                      │
│  ── Workflows ─────────────────────────────────────────────────────  │
│  GET    /workflows              → list workflows                      │
│  POST   /workflows              → create workflow                     │
│  GET    /workflows/:id          → get workflow + step definitions    │
│  PATCH  /workflows/:id          → update workflow                     │
│  DELETE /workflows/:id          → soft-delete workflow                │
│  POST   /workflows/:id/run      → trigger workflow execution         │
│  POST   /workflows/:id/pause    → pause scheduled workflow           │
│  GET    /workflows/:id/executions → list executions                   │
│  GET    /executions/:id          → get execution detail               │
│                                                                      │
│  ── API Keys ───────────────────────────────────────────────────────  │
│  GET    /api-keys               → list API keys (prefixes only)      │
│  POST   /api-keys               → create API key (returns full key)  │
│  DELETE /api-keys/:id           → revoke API key                     │
│                                                                      │
│  ── Organization ──────────────────────────────────────────────────  │
│  GET    /org                     → get org details                    │
│  PATCH  /org/                    → update org (name, settings)        │
│  GET    /org/members             → list members                       │
│  PATCH  /org/members/:id         → update member role                 │
│  DELETE /org/members/:id         → remove member                      │
│                                                                      │
│  ── Usage / Billing ───────────────────────────────────────────────  │
│  GET    /org/usage              → current billing period usage       │
│  GET    /org/usage/history      → historical usage (monthly)         │
│  GET    /org/invoices           → list invoices                      │
│  GET    /org/plan               → get current plan + limits           │
│  PATCH  /org/plan               → update plan                         │
│                                                                      │
│  ── Logs ───────────────────────────────────────────────────────────  │
│  GET    /agents/:id/logs        → agent logs (paginated, filterable) │
│  GET    /workflows/:id/logs     → workflow execution logs             │
│                                                                      │
│  ── Health ────────────────────────────────────────────────────────  │
│  GET    /health                 → basic health check                  │
│  GET    /health/ready           → readiness (DB + Redis + LLM)       │
└──────────────────────────────────────────────────────────────────────┘
```

**Pagination:**
```json
// Request:  GET /agents?cursor=abc&limit=20&status=active
// Response:
{
  "data": [ ... ],
  "pagination": {
    "nextCursor": "def",
    "hasMore": true,
    "limit": 20
  }
}
```

**Filtering/search:**
```json
// Syntax:  ?search=keyword&status=active&model=gpt-4o
// Search applies full-text search on name + description (GIN index)
```

### 8.2 WebSocket Events

```typescript
// ── Client → Server ──────────────────────────────────────────────
interface ClientEvents {
  'room:join':      (room: string) => void;           // Join agent room
  'room:leave':     (room: string) => void;           // Leave agent room
  'chat:send':      (data: { sessionId: string; message: string; files?: File[] }) => void;
  'agent:stop':     (data: { agentId: string }) => void;
  'typing:start':   (data: { sessionId: string }) => void;
  'typing:stop':    (data: { sessionId: string }) => void;
}

// ── Server → Client ──────────────────────────────────────────────
interface ServerEvents {
  'agent:status':   (data: { agentId: string; status: string; error?: string }) => void;
  'agent:log':      (data: { agentId: string; level: string; message: string; timestamp: string }) => void;
  'chat:message':   (data: { sessionId: string; message: Message }) => void;
  'chat:token':     (data: { sessionId: string; token: string }) => void;   // SSE/streaming
  'chat:error':     (data: { sessionId: string; error: string }) => void;
  'workflow:update': (data: { executionId: string; stepId: string; status: string; output?: any }) => void;
  'notification':   (data: { id: string; type: string; title: string; body: string }) => void;
  'error':          (data: { code: string; message: string }) => void;
}
```

### 8.3 Rate Limiting

```
┌─────────────────────────────────────────────────────────────────┐
│                    RATE LIMITING STRATEGY                        │
│                                                                 │
│  Tool:  @upstash/rate-limiter  +  Redis                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Unauthenticated (IP-based)                                │ │
│  │  ├── Window: 1 minute                                     │ │
│  │  ├── Max: 20 requests                                     │ │
│  │  └── Scoped to: IP address                                │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Authenticated — Global (per user)                         │ │
│  │  ├── Window: 1 minute                                     │ │
│  │  ├── Max: 100 requests                                    │ │
│  │  └── Scoped to: userId                                    │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Authenticated — Per Endpoint                              │ │
│  │  ├── POST /agents         : 30/min                        │ │
│  │  ├── POST /agents/:id/run : 20/min                        │ │
│  │  ├── POST /workflows      : 20/min                        │ │
│  │  ├── POST /workflows/:id/run : 10/min                    │ │
│  │  ├── POST /api-keys       : 5/min                        │ │
│  │  ├── POST /org/members/:id : 10/min                      │ │
│  │  └── GET endpoints        : 200/min                      │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  API Key — Per Key                                        │ │
│  │  ├── Tier-based (stored in DB: plan -> rate limit)         │ │
│  │  ├── Free:     60 req/min                                │ │
│  │  ├── Pro:      600 req/min                                │ │
│  │  └── Enterprise: custom                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Response on rate limit exceeded (HTTP 429):                    │
│  {                                                              │
│    "error": {                                                   │
│      "code": "RATE_LIMIT_EXCEEDED",                             │
│      "message": "Too many requests. Retry after X seconds.",    │
│      "retryAfter": 12                                           │
│    }                                                            │
│  }                                                              │
│  Headers:  Retry-After: 12                                      │
│            X-RateLimit-Limit: 100                               │
│            X-RateLimit-Remaining: 0                             │
│            X-RateLimit-Reset: 1712345678                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Security Implementation

### 9.1 Authentication Flow (Clerk)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION ARCHITECTURE                   │
│                                                                 │
│  1. Client-side authentication:                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  <ClerkProvider> wraps entire app (frontend)         │    │
│     │  useAuth() → { userId, orgId, sessionId, getToken } │    │
│     │  useUser() → { id, email, name, imageUrl }          │    │
│     │  useOrganization() → { id, name, slug, role }       │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│  2. Next.js middleware:                                         │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  export { default } from '@clerk/nextjs/server'     │    │
│     │     .authMiddleware({                                │    │
│     │       publicRoutes: ['/', '/sign-in(.*)', '/sign-up(.*)',│ │
│     │                     '/api/webhooks(.*)', '/health'] │    │
│     │     });                                              │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│  3. Backend JWT verification (Express middleware):              │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  const authMiddleware = async (req, res, next) =>   │    │
│     │    const token = req.headers.authorization          │    │
│     │                     ?.replace('Bearer ', '');       │    │
│     │    if (!token) return res.status(401).json(...);    │    │
│     │    const session = await clerkClient                │    │
│     │      .verifyToken(token, { jwtKey: CLERK_JWT_KEY });│    │
│     │    req.userId = session.sub;                        │    │
│     │    req.orgId = session.org_id;                      │    │
│     │    req.session = session;                           │    │
│     │    next();                                          │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│  4. Webhook verification:                                       │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Clerk sends Svix signature headers.                │    │
│     │  Verify with svix.verify(webhookPayload, headers).  │    │
│     │  Webhooks handled at /api/webhooks/clerk/*          │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│  5. Session token refresh:                                      │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Clerk handles session rotation automatically        │    │
│     │  Axios interceptor calls getToken() on 401           │    │
│     │  Retries original request with new token             │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 API Key Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    API KEY LIFECYCLE                              │
│                                                                 │
│  Creation:                                                      │
│    key = 'af_' + crypto.randomBytes(32).toString('hex')         │
│    prefix = key.substring(0, 10)   // "af_a1b2c3d4e5"          │
│    hash = await bcrypt.hash(key, 10)                            │
│    lastChars = key.slice(-4)                                    │
│    Store: { key_prefix, key_hash, last_chars } in DB            │
│    Return full key to user ONCE                                 │
│                                                                 │
│  Validation (middleware):                                       │
│    const apiKey = req.headers['x-api-key'];                     │
│    const prefix = apiKey.substring(0, 10);                      │
│    const record = await cache.get(`apikey:${prefix}`)           │
│                  ?? await apiKeyRepo.findByPrefix(prefix);      │
│    if (!record || record.revoked_at) return 401;                │
│    const valid = await bcrypt.compare(apiKey, record.key_hash); │
│    if (!valid) return 401;                                      │
│    Update last_used_at (async, fire-and-forget)                 │
│    req.orgId = record.org_id;                                   │
│    req.apiKeyPermissions = record.permissions;                  │
│    next();                                                      │
│                                                                 │
│  Display:                                                       │
│    UI shows "af_a1b2...cdef" (prefix + last 4 chars)           │
│    Full key is never stored in logs or error messages           │
│                                                                 │
│  Revocation:                                                    │
│    SET revoked_at = NOW() in DB                                 │
│    DEL cache key for this prefix                                │
│    Socket.IO event to notify org admins                         │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Data Encryption

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION STRATEGY                            │
│                                                                 │
│  At Rest (Database):                                            │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  PostgreSQL TDE (Transparent Data Encryption)        │      │
│    │  — Enabled at storage layer (cloud provider)        │      │
│    │  — EBS encryption (AWS) / volume encryption (Fly.io)│      │
│    │                                                      │      │
│    │  Application-level encryption (sensitive fields):    │      │
│    │  — LLM API keys stored in per-org vault             │      │
│    │  — Encrypted with AES-256-GCM using org-specific key│      │
│    │  — Key derived from org master key + org ID          │      │
│    │  — Master key stored in cloud KMS (AWS KMS / GCP KMS)│      │
│    │  — Data type: encrypted_text with pgcrypto extension │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  In Transit:                                                    │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  TLS 1.3 for all HTTP and WebSocket connections      │      │
│    │  HSTS header (Strict-Transport-Security)            │      │
│    │  mTLS between internal services (optional)          │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  Secrets Management:                                            │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  No secrets in source code or .env files committed  │      │
│    │  Secrets injected via Docker secrets / Kubernetes   │      │
│    │  Secret rotation: automated via schedule in CI/CD   │      │
│    │  Tools: Doppler / 1Password CLI / AWS Secrets Mgr  │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  PII / Sensitive Data Handling:                                 │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  User emails: stored in DB, never logged            │      │
│    │  Agent conversation content: encrypted at rest      │      │
│    │  Log scrubbing: regex removes API keys, tokens,     │      │
│    │    emails from log output before persistence        │      │
│    │  Data retention: auto-delete messages > 90 days     │      │
│    │    for free tier (configurable per org plan)         │      │
│    └─────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Docker Configuration

### 10.1 Multi-Stage Builds

```dockerfile
# ─────────────────────────────────────────────────────────────────
# Dockerfile (Frontend — Next.js)
# ─────────────────────────────────────────────────────────────────

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]


# ─────────────────────────────────────────────────────────────────
# Dockerfile (Backend — Express)
# ─────────────────────────────────────────────────────────────────

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build  # tsc → dist/

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tini

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
```

### 10.2 Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.9'

services:
  # ── Frontend ──────────────────────────────────────────────
  frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    depends_on:
      - backend
    restart: unless-stopped

  # ── Backend ───────────────────────────────────────────────
  backend:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://agentforge:agentforge@postgres:5432/agentforge
      - REDIS_URL=redis://redis:6379
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - CLERK_JWT_KEY=${CLERK_JWT_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/api/src:/app/src  # Hot-reload in dev
    restart: unless-stopped

  # ── Workers ───────────────────────────────────────────────
  worker:
    build:
      context: ./apps/worker
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://agentforge:agentforge@postgres:5432/agentforge
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      replicas: 2      # Scale workers independently

  # ── PostgreSQL ────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: agentforge
      POSTGRES_PASSWORD: agentforge
      POSTGRES_DB: agentforge
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./infra/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U agentforge']
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ── Redis ─────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redisdata:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # ── Bull Board (Queue Monitoring) ────────────────────────
  bullboard:
    image: ghcr.io/bull-board/bull-board:latest
    ports:
      - '3005:3000'
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

volumes:
  pgdata:
  redisdata:
```

---

## 11. CI/CD Pipeline

### 11.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  # ── Lint & Type Check ──────────────────────────────────────
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  # ── Unit & Integration Tests ──────────────────────────────
  test:
    name: Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: agentforge
          POSTGRES_PASSWORD: agentforge
          POSTGRES_DB: agentforge_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://agentforge:agentforge@localhost:5432/agentforge_test
      - run: pnpm test -- --coverage
        env:
          DATABASE_URL: postgresql://agentforge:agentforge@localhost:5432/agentforge_test
          REDIS_URL: redis://localhost:6379

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  # ── Build & Docker ────────────────────────────────────────
  build:
    name: Build & Docker
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/web
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
            ghcr.io/${{ github.repository }}/frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & Push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
            ghcr.io/${{ github.repository }}/backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & Push Worker
        uses: docker/build-push-action@v5
        with:
          context: ./apps/worker
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/worker:${{ github.sha }}
            ghcr.io/${{ github.repository }}/worker:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ── Deploy ─────────────────────────────────────────────────
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Fly.io
        uses: superfly/flyctl-actions@1.4
        with:
          args: 'deploy --app agentforge-staging --image ghcr.io/${{ github.repository }}/backend:${{ github.sha }}'
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Run DB Migrations
        run: |
          flyctl ssh console --app agentforge-staging -C "pnpm db:migrate"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  # ── Production Deploy (Manual Approval) ───────────────────
  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [deploy]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to Fly.io Production
        uses: superfly/flyctl-actions@1.4
        with:
          args: 'deploy --app agentforge --image ghcr.io/${{ github.repository }}/backend:${{ github.sha }}'
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### 11.2 Pipeline Stages (Visual)

```
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │   Lint   │───>│   Test   │───>│  Build   │───>│  Deploy  │
    │ & Type   │    │ (w/ DB + │    │ & Push   │    │ Staging  │
    │  Check   │    │  Redis)  │    │  Docker  │    │          │
    └──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                         │
                                                    ┌────▼─────┐
                                                    │   E2E    │
                                                    │  Tests   │
                                                    │(Staging) │
                                                    └────┬─────┘
                                                         │
                                                    ┌────▼─────┐
                                                    │  Deploy  │
                                                    │  Prod    │
                                                    │(Approval)│
                                                    └──────────┘
```

---

## 12. File/Folder Structure

```
agentforge/
├── .github/
│   └── workflows/
│       ├── ci.yml                      # CI/CD pipeline (lint, test, build, deploy)
│       └── codeql.yml                  # CodeQL security analysis
│
├── apps/
│   ├── web/                            # Next.js frontend
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── og-image.png
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── sign-in/
│   │   │   │   │   │   └── [[...sign-in]]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── sign-up/
│   │   │   │   │   │   └── [[...sign-up]]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── agents/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── [agentId]/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── settings/
│   │   │   │   │   │   │       └── page.tsx
│   │   │   │   │   │   └── new/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── workflows/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [workflowId]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── api-keys/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── logs/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── api/
│   │   │   │   │   └── webhooks/
│   │   │   │   │       └── clerk/
│   │   │   │   │           └── route.ts
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── not-found.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/                # Atomic UI (shadcn/ui)
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── layouts/
│   │   │   │   │   ├── dashboard-layout.tsx
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   └── header.tsx
│   │   │   │   ├── agents/
│   │   │   │   │   ├── agent-card.tsx
│   │   │   │   │   ├── agent-grid.tsx
│   │   │   │   │   ├── agent-filters.tsx
│   │   │   │   │   ├── agent-form.tsx      # Create/Edit agent form
│   │   │   │   │   └── agent-actions.tsx
│   │   │   │   ├── chat/
│   │   │   │   │   ├── chat-panel.tsx
│   │   │   │   │   ├── message-list.tsx
│   │   │   │   │   ├── message-input.tsx
│   │   │   │   │   └── streaming-message.tsx
│   │   │   │   ├── workflows/
│   │   │   │   │   ├── workflow-card.tsx
│   │   │   │   │   ├── workflow-builder.tsx # DAG editor
│   │   │   │   │   └── workflow-step.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── loading-spinner.tsx
│   │   │   │       ├── empty-state.tsx
│   │   │   │       ├── pagination.tsx
│   │   │   │       └── confirm-dialog.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   ├── use-socket.ts
│   │   │   │   ├── use-streaming-chat.ts
│   │   │   │   └── use-debounce.ts
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts           # Axios instance
│   │   │   │   ├── api/
│   │   │   │   │   ├── agents.ts
│   │   │   │   │   ├── workflows.ts
│   │   │   │   │   ├── sessions.ts
│   │   │   │   │   └── api-keys.ts
│   │   │   │   ├── queries/                # React Query hooks
│   │   │   │   │   ├── use-agents.ts
│   │   │   │   │   ├── use-workflows.ts
│   │   │   │   │   └── use-sessions.ts
│   │   │   │   ├── stores/                 # Zustand stores
│   │   │   │   │   ├── ui-store.ts
│   │   │   │   │   ├── chat-store.ts
│   │   │   │   │   └── filter-store.ts
│   │   │   │   ├── socket.ts               # Socket.IO client
│   │   │   │   ├── utils.ts
│   │   │   │   └── constants.ts
│   │   │   └── providers/
│   │   │       ├── auth-provider.tsx        # Clerk wrapper
│   │   │       ├── query-provider.tsx       # TanStack Query
│   │   │       ├── theme-provider.tsx
│   │   │       └── socket-provider.tsx
│   │   ├── middleware.ts                   # Clerk auth middleware
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── api/                                # Express backend
│   │   ├── src/
│   │   │   ├── server.ts                   # Entry point
│   │   │   ├── app.ts                      # Express app setup
│   │   │   ├── config/
│   │   │   │   ├── index.ts                # Environment config
│   │   │   │   ├── logger.ts               # Pino logger
│   │   │   │   └── cors.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts                 # Clerk JWT verification
│   │   │   │   ├── api-key-auth.ts         # API key validation
│   │   │   │   ├── rate-limiter.ts
│   │   │   │   ├── error-handler.ts
│   │   │   │   ├── request-logger.ts
│   │   │   │   └── validate.ts             # Zod request validation
│   │   │   ├── routes/
│   │   │   │   ├── index.ts                # Route aggregator
│   │   │   │   ├── agents.routes.ts
│   │   │   │   ├── sessions.routes.ts
│   │   │   │   ├── workflows.routes.ts
│   │   │   │   ├── api-keys.routes.ts
│   │   │   │   ├── organization.routes.ts
│   │   │   │   ├── usage.routes.ts
│   │   │   │   ├── logs.routes.ts
│   │   │   │   └── health.routes.ts
│   │   │   ├── controllers/
│   │   │   │   ├── agent.controller.ts
│   │   │   │   ├── session.controller.ts
│   │   │   │   ├── workflow.controller.ts
│   │   │   │   ├── api-key.controller.ts
│   │   │   │   ├── organization.controller.ts
│   │   │   │   ├── usage.controller.ts
│   │   │   │   └── log.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── agent.service.ts
│   │   │   │   ├── session.service.ts
│   │   │   │   ├── workflow.service.ts
│   │   │   │   ├── chat.service.ts
│   │   │   │   ├── api-key.service.ts
│   │   │   │   ├── llm.service.ts
│   │   │   │   ├── memory.service.ts
│   │   │   │   ├── tool-execution.service.ts
│   │   │   │   ├── organization.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   ├── db/
│   │   │   │   ├── connection.ts
│   │   │   │   ├── schema/
│   │   │   │   │   ├── agents.ts
│   │   │   │   │   ├── sessions.ts
│   │   │   │   │   ├── messages.ts
│   │   │   │   │   ├── workflows.ts
│   │   │   │   │   ├── workflow-executions.ts
│   │   │   │   │   ├── api-keys.ts
│   │   │   │   │   ├── users.ts
│   │   │   │   │   ├── organizations.ts
│   │   │   │   │   ├── organization-members.ts
│   │   │   │   │   ├── agent-logs.ts
│   │   │   │   │   └── usage-events.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── agent.repository.ts
│   │   │   │   │   ├── session.repository.ts
│   │   │   │   │   ├── message.repository.ts
│   │   │   │   │   ├── workflow.repository.ts
│   │   │   │   │   ├── api-key.repository.ts
│   │   │   │   │   └── organization.repository.ts
│   │   │   │   └── migrations/
│   │   │   ├── socket/
│   │   │   │   ├── index.ts                # Socket.IO server init
│   │   │   │   ├── auth.ts                 # Socket auth middleware
│   │   │   │   └── handlers/
│   │   │   │       ├── chat.handler.ts
│   │   │   │       ├── agent.handler.ts
│   │   │   │       └── workflow.handler.ts
│   │   │   ├── cache/
│   │   │   │   ├── redis.ts                # Redis client
│   │   │   │   ├── strategies.ts           # Cache strategies
│   │   │   │   └── keys.ts                 # Key builders
│   │   │   ├── queue/
│   │   │   │   ├── connection.ts           # BullMQ connection
│   │   │   │   ├── queues.ts               # Queue definitions
│   │   │   │   └── workers/
│   │   │   │       ├── agent-execution.worker.ts
│   │   │   │       ├── workflow-execution.worker.ts
│   │   │   │       ├── email.worker.ts
│   │   │   │       ├── webhook-outgoing.worker.ts
│   │   │   │       └── cleanup.worker.ts
│   │   │   ├── validators/                 # Zod schemas
│   │   │   │   ├── agent.schema.ts
│   │   │   │   ├── workflow.schema.ts
│   │   │   │   └── api-key.schema.ts
│   │   │   ├── types/                      # Shared TypeScript types
│   │   │   │   ├── agent.ts
│   │   │   │   ├── workflow.ts
│   │   │   │   ├── session.ts
│   │   │   │   ├── api-key.ts
│   │   │   │   └── common.ts
│   │   │   ├── utils/
│   │   │   │   ├── crypto.ts               # Encryption / hashing
│   │   │   │   ├── pagination.ts
│   │   │   │   ├── errors.ts               # Typed error classes
│   │   │   │   └── webhook.ts              # Svix verify
│   │   │   └── __tests__/
│   │   │       ├── unit/
│   │   │       ├── integration/
│   │   │       └── fixtures/
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── worker/                             # Standalone worker process
│       ├── src/
│       │   ├── index.ts                    # Worker entry point
│       │   ├── workers/
│       │   │   ├── agent-execution.worker.ts
│       │   │   ├── workflow-execution.worker.ts
│       │   │   ├── email.worker.ts
│       │   │   ├── webhook-outgoing.worker.ts
│       │   │   └── cleanup.worker.ts
│       │   ├── services/                   # Shared services (or symlinked)
│       │   └── config/
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                             # Shared types, constants, utils
│       ├── src/
│       │   ├── types/
│       │   │   ├── agent.ts
│       │   │   ├── workflow.ts
│       │   │   ├── socket-events.ts
│       │   │   └── api.ts
│       │   ├── constants.ts
│       │   └── utils.ts
│       ├── tsconfig.json
│       └── package.json
│
├── infra/
│   ├── docker/
│   │   ├── nginx/
│   │   │   └── default.conf
│   │   └── postgres/
│   │       └── init.sql
│   ├── terraform/                          # Infrastructure as code
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── kubernetes/                         # K8s manifests (optional)
│       ├── frontend-deployment.yaml
│       ├── api-deployment.yaml
│       └── worker-deployment.yaml
│
├── docs/
│   ├── TECHNICAL_ARCHITECTURE.md           # ← This document
│   ├── API.md
│   ├── DEVELOPMENT.md
│   └── DEPLOYMENT.md
│
├── scripts/
│   ├── dev.sh                              # Start dev environment
│   ├── seed.ts                             # Database seed script
│   └── migrate.sh                          # Run migrations
│
├── .env.example
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json                              # Turborepo configuration
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Appendix A: Key Architectural Decisions (ADRs)

| ID | Decision | Rationale |
|---|---|---|
| ADR-001 | **Drizzle ORM over Prisma** | No binary engine, faster DX, SQL-like syntax, better migration tooling |
| ADR-002 | **Zustand over Redux** | Minimal boilerplate, no providers, sufficient for UI-only state |
| ADR-003 | **Clerk over Auth.js** | Lower self-hosted complexity, built-in MFA + orgs, webhook support |
| ADR-004 | **BullMQ over Agenda** | Native ESM + TypeScript, richer job control, Bull Board dashboard |
| ADR-005 | **Socket.IO over raw WebSocket** | Rooms, auto-reconnect, fallback transport, acknowledgement support |
| ADR-006 | **PostgreSQL JSONB for config** | Flexible agent/workflow config without schema migrations, GIN indexing |
| ADR-007 | **Multi-stage Docker builds** | Minimal production images (no dev deps, no source code) |
| ADR-008 | **Cursor-based pagination** | Stable under active writes, no offset drift, better performance at scale |

## Appendix B: Performance Budgets

| Metric | Target | Measurement |
|---|---|---|
| API response time (p50) | < 50ms (cached), < 500ms (DB) | OpenTelemetry |
| API response time (p99) | < 200ms (cached), < 2s (DB) | OpenTelemetry |
| LLM first token latency | < 2s | Client-side + server timing |
| WebSocket message delivery | < 100ms p99 | Socket.IO metrics |
| Page load (LCP) | < 2s | Lighthouse CI |
| DB query time (p99) | < 100ms | pg_stat_statements |
| Cache hit ratio | > 80% | Redis INFO / metrics |
| Queue job latency | < 5s for urgent queues | BullMQ metrics |

## Appendix C: Monitoring & Observability

| Concern | Tool | Integration |
|---|---|---|
| Application metrics | Prometheus + Grafana | OpenTelemetry SDK exports metrics |
| Distributed tracing | OpenTelemetry / Jaeger | Trace context propagated across services |
| Log aggregation | Grafana Loki / SigNoz | Pino logger outputs structured JSON |
| Error tracking | Sentry | Captures unhandled rejections, Express errors |
| Uptime monitoring | Checkly / BetterStack | Synthetic checks every 1 minute |
| Database monitoring | pg_stat_statements, pghero | Query performance, index usage |
| Queue monitoring | Bull Board | Web UI at /admin/queues |
| LLM cost tracking | Custom (usage_events table) | Aggregated per org per billing period |
