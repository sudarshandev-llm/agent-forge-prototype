# AgentForge — System Design Document

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** June 10, 2026  
**Author:** Platform Architecture Team

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Component Architecture](#3-component-architecture)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [API Architecture](#5-api-architecture)
6. [Database Schema](#6-database-schema)
7. [Security Architecture](#7-security-architecture)
8. [Scalability Strategy](#8-scalability-strategy)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Monitoring and Observability](#10-monitoring-and-observability)
11. [Disaster Recovery Plan](#11-disaster-recovery-plan)
12. [Cost Estimation](#12-cost-estimation)

---


## 1. System Architecture Overview

AgentForge is a **multi-tenant AI Agent Development Platform** built on a **microservices architecture**. The platform enables users to create, deploy, monitor, and monetize autonomous AI agents. Agents can call external tools, communicate with other agents, maintain long-term memory, and execute complex workflows.

### Architectural Principles

- **Microservices Decoupling** — Each domain (auth, agents, tools, execution, memory, marketplace, workflows) is an independently deployable service.
- **Event-Driven Communication** — Services communicate asynchronously via a message broker (BullMQ/Redis) for non-blocking operations and via REST/WebSocket for synchronous needs.
- **Polyglot Persistence** — PostgreSQL for relational data, Redis for caching/queues, Supabase for file/object storage.
- **Stateless Services** — All application services are stateless; state is externalized to databases and caches.
- **Defense in Depth** — Security at every layer: network, application, data, and access control.
- **Observability by Default** — Structured logging, distributed tracing, and metrics emitted by every service.


### Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Shadcn UI | SSR, file-based routing, rich ecosystem |
| Backend | Node.js 22, Express, TypeScript | High I/O throughput, shared types with frontend |
| Database | PostgreSQL 16 (with pgvector) | Relational integrity, vector embeddings support |
| Cache | Redis 7 (ElastiCache) | Sub-millisecond reads, session store, rate limiting |
| Queue | BullMQ (backed by Redis) | Delayed jobs, retries, concurrency control |
| Auth | Clerk + Auth.js | Multi-provider, webhooks, session management |
| Object Storage | Supabase (S3-compatible) | Agent artifacts, tool schemas, marketplace assets |
| Real-time | WebSocket (via Socket.IO) | Agent execution streaming, logs |
| Containerization | Docker + Docker Compose | Local dev parity, CI/CD consistency |
| Orchestration | Kubernetes (production) | Auto-scaling, self-healing, rolling updates |

---

## 2. High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT LAYER                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌────────────┐                │
│  │  Web App  │  │  Mobile  │  │  API CLI  │  │  SDK/API   │  │  Webhooks  │                │
│  │ (Next.js) │  │  (React  │  │  (Python) │  │  (REST)    │  │  (3rd-Party)│               │
│  │           │  │  Native) │  │           │  │            │  │            │                │
│  └─────┬─────┘  └─────┬────┘  └─────┬─────┘  └──────┬─────┘  └──────┬─────┘                │
│        │              │              │               │              │                       │
└────────┼──────────────┼──────────────┼───────────────┼──────────────┼───────────────────────┘
         │              │              │               │              │
         ▼              ▼              ▼               ▼              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              EDGE / CDN LAYER                                                │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    Cloudflare / Vercel Edge Network                                  │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────────────┐              │  │
│  │  │ Static CDN │  │  DDoS     │  │  WAF      │  │  Edge Functions     │              │  │
│  │  │  (assets)  │  │  Protection│  │  (OWASP   │  │  (auth checks,      │              │  │
│  │  │            │  │           │  │   rules)  │  │   redirects)         │              │  │
│  │  └───────────┘  └───────────┘  └───────────┘  └─────────────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY LAYER                                                │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    API Gateway (Kong / NGINX)                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │ Rate     │  │ Auth     │  │ Request  │  │ Response │  │ Service  │              │  │
│  │  │ Limiter  │  │ Check    │  │ Validation│  │ Cache    │  │ Discovery│              │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

```

## 3. Component Architecture

### 3.1 Frontend Architecture

The frontend is built with Next.js 15 using the App Router, TypeScript, TailwindCSS, and Shadcn UI components.

**Key Frontend Decisions:**
- **Next.js App Router** — Server components by default, client components where interactivity is needed.
- **BFF (Backend for Frontend)** — Next.js API routes act as a thin BFF layer, aggregating microservice calls, handling auth token exchange, and transforming responses.
- **ISR (Incremental Static Regeneration)** — Marketplace listings, docs, and blog pages use ISR for optimal performance.
- **Streaming SSR** — Agent execution views use streaming SSR for progressive rendering of logs and outputs.
- **Zustand** — Global state management for auth, workspace, and theme.
- **TanStack Query** — Server state management, caching, and mutations.
- **Socket.IO Client** — Real-time agent logs and execution streaming.

### 3.2 Backend Architecture

The backend consists of 10 microservices, each independently deployable and scalable.

| Service | Port | Purpose | Key Dependencies |
|---------|------|---------|-----------------|
| Auth Service | 3001 | User auth, RBAC, API keys | Clerk SDK, PostgreSQL, Redis |
| Agent Manager | 3002 | Agent CRUD, versioning, deployment | PostgreSQL, Redis |
| Agent Engine | 3003 | LLM execution, tool orchestration, streaming | PostgreSQL, Redis, BullMQ, Supabase |
| Tool Registry | 3004 | Tool registration, schema validation, sandboxed execution | PostgreSQL, Deno runtime, BullMQ |
| Memory Service | 3005 | Vector storage, semantic search, RAG pipeline | PostgreSQL (pgvector) |
| Workflow Engine | 3006 | DAG execution, state propagation, scheduling | PostgreSQL, Redis, BullMQ |
| Marketplace | 3007 | Listings, reviews, installs, payments | PostgreSQL, Stripe Connect |
| Billing Service | 3008 | Usage metering, credits, invoicing | PostgreSQL, Stripe, Redis |
| Analytics | 3009 | Event aggregation, dashboards, exports | PostgreSQL, ClickHouse |
| Notifications | 3010 | Email, in-app, webhook delivery | PostgreSQL, BullMQ |

#### Agent Execution Loop

The Agent Engine implements a recursive loop: THINK → ACT → OBSERVE → REPEAT

1. **Load Agent Config** — Retrieve agent configuration from cache or database.
2. **Build Context** — Assemble system prompt with instructions, tool definitions, and relevant memory.
3. **LLM Call** — Send prompt to configured LLM provider.
4. **Parse Response** — Extract reasoning, tool calls, or final answer from LLM output.
5. **Execute Tools** — For each tool call, validate arguments, invoke via Tool Registry, await result.
6. **Update Memory** — Store conversation turn, update vector embeddings.
7. **Check Termination** — Max iterations, timeout, user stop, or agent produced final answer.
8. **Return Result** — Final output with execution metadata.

### 3.3 Database Layer (PostgreSQL)

**Setup:**
- PostgreSQL 16 with extensions: pgvector, pgcrypto, pg_stat_statements, uuid-ossp, citext, pg_partman, ltree
- PgBouncer for connection pooling (transaction mode)
- Read replicas for analytics queries
- Connection limit: 200 per service instance

### 3.4 Caching Layer (Redis)

Redis serves three purposes: distributed cache, BullMQ queue backend, and Pub/Sub message broker.

**Cache Prefixes:**
| Prefix | TTL | Purpose |
|--------|-----|---------|
| session:* | 24h | User sessions |
| user:* | 1h | User profiles |
| agent:* | 30m | Agent configs |
| tool:* | 1h | Tool schemas |
| api:response:* | 5m | API response cache |
| rate:* | 1s-1h | Rate limit counters |
| plan:* | 1h | Pricing plan details |

**BullMQ Queues:**
| Queue Name | Concurrency | Priority | Description |
|-----------|------------|----------|-------------|
| agent:execute | 25 | Yes | Agent execution jobs |
| tool:invoke | 50 | Yes | Tool invocation jobs |
| workflow:run | 10 | Yes | Workflow execution jobs |
| memory:embed | 20 | No | Embedding generation |
| billing:meter | 5 | No | Usage metering |
| email:send | 10 | Yes | Email delivery |
| notification:push | 30 | Yes | Push notifications |
| cleanup:old-executions | 2 | No | Scheduled cleanup |

### 3.5 Storage Layer (Supabase)

**Buckets:**
- gent-artifacts (Private) â€” Agent code and config files (50 MB limit)
- gent-logs (Private) â€” Execution log archives (500 MB, auto-rotated weekly)
- 	ool-schemas (Public) â€” OpenAPI specs and manifests (5 MB)
- marketplace-assets (Public) â€” Listing images and demos (100 MB)
- user-uploads (Private) â€” User file uploads (25 MB)
- ackup-exports (Private) â€” Database and asset backups
- workflow-templates (Public) â€” Workflow JSON blueprints

Access control via Row Level Security (RLS) with pre-signed URLs for temporary access (15 min TTL).

### 3.6 Authentication Flow (Clerk + Auth.js)

The authentication flow follows this sequence:
1. Client initiates sign-in via Clerk UI (OAuth, email/password, or magic link)
2. Clerk handles the authentication flow and returns a JWT session token
3. Client sends API requests with Bearer token
4. API Gateway validates the JWT via Clerk SDK
5. Backend services receive verified user identity in request context
6. For API key auth: X-API-Key header is hashed and compared against stored bcrypt hash

---

## 4. Data Flow Diagrams

### 4.1 Agent Creation Flow

1. **Client â†’ BFF**: POST /v1/agents with agent configuration (name, model, instructions, tools, memory config)
2. **BFF â†’ Agent Manager**: Forward validated request
3. **Agent Manager â†’ Tool Registry**: Validate that specified tools exist and are accessible
4. **Tool Registry â†’ Agent Manager**: Return tool schemas
5. **Agent Manager**: Build default system prompt, generate agent ID, store in PostgreSQL
6. **Agent Manager â†’ Redis**: Cache agent configuration for fast retrieval
7. **Agent Manager â†’ BFF â†’ Client**: Return created agent object

### 4.2 Agent Execution Flow

1. **Client â†’ BFF â†’ Agent Engine**: POST /v1/agents/:id/execute with input
2. **Agent Engine â†’ BullMQ**: Queue execution job for async processing
3. **Worker Process**:
   a. Retrieve agent config (cache first, then DB)
   b. Build context from Memory Service (recent conversations, relevant memories)
   c. Execute LLM call with system prompt + context + input
   d. Parse LLM response for tool calls
   e. Execute tools via Tool Registry (sandboxed Deno runtime)
   f. Feed tool results back to LLM
   g. Store conversation turn in Memory Service
   h. Repeat until termination condition met
4. **Agent Engine â†’ Redis Pub/Sub â†’ WebSocket**: Stream logs and results to client in real-time
5. **Agent Engine â†’ PostgreSQL**: Persist execution record and logs

### 4.3 Multi-Agent Communication

Multi-agent communication uses a message bus pattern:
1. Orchestrator agent broadcasts task to available agents
2. Agents subscribe to relevant message types
3. Messages flow through gent_messages table with correlation IDs
4. Orchestrator manages workflow DAG (sequential, parallel, hierarchical, or mesh topology)
5. Each message contains: id, from, to, type, payload, timestamp, correlation_id
6. Agents can be arranged in any topology: sequential pipeline, parallel fan-out, hierarchical, or mesh

---

## 5. API Architecture

### 5.1 RESTful API Design

**Base URL:** https://api.agentforge.ai/v1

**Conventions:**
- Nouns for resources, verbs for actions (when needed)
- Consistent error format across all endpoints
- Versioned via URL path (/v1/)
- Pagination via cursor-based (preferred) or offset-based
- Field selection via ?fields=id,name,status
- Expansion via ?include=tools,versions

**Standard Response Envelope:**
`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-06-10T12:00:00Z",
    "page": { "cursor": "cursor_xyz", "has_more": true }
  }
}
`

**Standard Error Envelope:**
`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid agent configuration",
    "details": [{ "field": "tools[0]", "message": "Tool not found" }],
    "request_id": "req_abc123"
  }
}
`

### 5.2 Core API Endpoints (Summary)

| Service | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Auth | POST | /v1/auth/signup | Register user |
| Auth | POST | /v1/auth/login | Login |
| Auth | GET | /v1/auth/me | Current user |
| Auth | POST | /v1/auth/api-keys | Create API key |
| Auth | GET | /v1/auth/teams | List teams |
| Agents | GET | /v1/agents | List agents |
| Agents | POST | /v1/agents | Create agent |
| Agents | GET | /v1/agents/:id | Get agent |
| Agents | PUT | /v1/agents/:id | Update agent |
| Agents | DELETE | /v1/agents/:id | Delete agent |
| Agents | POST | /v1/agents/:id/clone | Clone agent |
| Agents | POST | /v1/agents/:id/deploy | Deploy agent |
| Execution | POST | /v1/agents/:id/execute | Execute agent |
| Execution | POST | /v1/agents/:id/execute-stream | Execute (SSE) |
| Execution | GET | /v1/executions/:id | Execution status |
| Execution | GET | /v1/executions/:id/logs | Execution logs |
| Tools | GET | /v1/tools | List tools |
| Tools | POST | /v1/tools | Register tool |
| Tools | POST | /v1/tools/:id/execute | Execute tool |
| Workflows | GET | /v1/workflows | List workflows |
| Workflows | POST | /v1/workflows | Create workflow |
| Workflows | POST | /v1/workflows/:id/execute | Execute workflow |
| Memory | POST | /v1/memory/agents/:id/store | Store memory |
| Memory | POST | /v1/memory/agents/:id/search | Search memory |
| Marketplace | GET | /v1/marketplace/listings | Browse listings |
| Marketplace | POST | /v1/marketplace/listings | Publish listing |
| Billing | GET | /v1/billing/plan | Current plan |
| Billing | GET | /v1/billing/usage | Usage details |

### 5.3 WebSocket API

**Connection:** wss://api.agentforge.ai/v1/ws?token=<jwt>

**Protocol:** Socket.IO with JSON messages

**Client â†’ Server Events:**
- gent:subscribe â€” Subscribe to agent execution events
- execution:start â€” Start agent execution
- execution:stop â€” Stop running execution
- gent:message â€” Send message to agent (human-in-loop)

**Server â†’ Client Events:**
- execution:started / execution:log / execution:tool:call / execution:tool:result
- execution:llm:request / execution:llm:response / execution:progress
- execution:complete / execution:error / execution:stopped
- gent:message / gent:status / 
otification

### 5.4 Rate Limiting

Three-layer rate limiting strategy:
1. **API Gateway (Global)**: 100 req/s per IP (unauthenticated), 1000 req/s per API key
2. **Per-Endpoint (Service)**: Agent execution (10 req/min per agent, 50 req/min per user), Tool execution (100 req/min per tool)
3. **Concurrent Limits**: Max 3 concurrent executions per agent, 20 per user, 10 WebSocket connections per user

Response: 429 Too Many Requests with headers X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After.

---

## 6. Database Schema

### 6.1 Entity Relationship Overview

The database contains the following core entity groups:
- **Users & Auth**: users, api_keys, teams, team_members
- **Agents**: agents, agent_versions, agent_tools
- **Execution**: executions, execution_logs
- **Memory**: agent_memory, agent_messages
- **Tools**: tools
- **Workflows**: workflows, workflow_runs
- **Marketplace**: marketplace_listings, marketplace_reviews
- **Billing**: billing_plans, usage_metering
- **Notifications**: notifications, webhook_endpoints

### 6.2 Key Table Schemas

**users** â€” Core user identity and preferences
- id (UUID PK), clerk_id (unique), email, username, display_name
- role (user/admin/superadmin), plan_id (free/pro/team/enterprise)
- credits_balance, credits_lifetime
- mfa_enabled, mfa_method
- preferences (JSONB), metadata (JSONB)
- last_login_at, created_at, updated_at, deleted_at (soft delete)

**api_keys** â€” Programmatic access keys
- id (UUID PK), user_id (FK), name
- key_prefix, key_hash (bcrypt), key_last_four
- permissions (JSONB array), allowed_ips (TEXT[])
- rate_limit_override, expires_at, revoked_at

**agents** â€” Agent configurations
- id (UUID PK), owner_id (FK), team_id (FK, nullable)
- name, slug, description, status (draft/active/paused/archived/deployed)
- visibility (private/team/public/unlisted)
- model_config (JSONB) â€” provider, model, temperature, max_tokens, etc.
- instructions (TEXT) â€” System prompt
- knowledge_config (JSONB) â€” RAG sources and retrieval settings
- memory_config (JSONB) â€” Memory type and context window settings
- tools_config (JSONB) â€” Tool calling behavior
- execution_config (JSONB) â€” Max iterations, timeouts, retries
- tags (TEXT[]), category
- total_executions, total_tokens_used
- current_version, rating_avg, rating_count

**agent_versions** â€” Immutable version snapshots
- id (UUID PK), agent_id (FK), version (INT)
- snapshot (JSONB) â€” Full config snapshot
- checksum (SHA-256), published_by (FK), is_deployed

**tools** â€” Tool registry entries
- id (UUID PK), owner_id (FK), name, slug
- tool_type (builtin/custom/marketplace/webhook)
- source_type (openapi/graphql/grpc/code/webhook)
- schema (JSONB) â€” Function definition with JSON Schema parameters
- code (TEXT) â€” For custom code tools (sandboxed)
- auth_type, auth_config (encrypted)
- cost_per_call, rate_limit_config
- status, tags, total_calls, total_errors

**agent_tools** â€” Many-to-many agent-to-tool binding
- agent_id (FK), tool_id (FK), config_override (JSONB)
- enabled, order_index

**executions** â€” Partitioned by month for performance
- id (UUID PK), agent_id (FK), agent_version
- status (queued/running/paused/completed/failed/stopped/timeout)
- input (JSONB), output (JSONB), metadata (JSONB)
- usage (JSONB) â€” tokens, tool_calls, cost
- duration_ms, started_at, completed_at

**execution_logs** â€” Partitioned by month
- execution_id (FK), level (debug/info/warn/error)
- source, message, metadata (JSONB), timestamp

**agent_memory** â€” Vector + relational memory store
- agent_id (FK), memory_type (working/episodic/semantic/procedural)
- role, content, embedding (VECTOR(1536))
- importance_score, expires_at
- IVFFlat index on embedding for similarity search

**agent_messages** â€” Multi-agent communication
- correlation_id, from_agent_id, to_agent_id
- message_type (request/response/broadcast/error/status)
- payload (JSONB), priority (1-10)
- status (sent/delivered/read/processed/failed)

**workflows** â€” DAG-based workflow definitions
- trigger_type (manual/cron/webhook/event)
- trigger_config (JSONB) â€” schedule, webhook secret, event filter
- dag_schema (JSONB) â€” nodes and edges with conditions

**marketplace_listings** â€” Published templates and plugins
- listing_type, price_credits, revenue_share_pct
- status (draft/pending_review/approved/rejected/published/archived)
- rating_avg, install_count, featured

**usage_metering** â€” Partitioned hourly for real-time billing
- user_id, team_id, agent_id (nullable)
- metric_type, metric_value, metadata (JSONB)

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

**Authentication Methods:**
- Clerk (Primary): OAuth (Google, GitHub, Microsoft, Apple), Email + Password (bcrypt), Magic Link, MFA (TOTP/SMS/Email)
- API Keys: Format sk_live_xxx / sk_test_xxx, stored as bcrypt hash, rotatable and revocable
- Webhook Signatures: HMAC-SHA256 for outgoing webhooks

**Session Management:**
- JWT with RS256 (Clerk-managed)
- Access token: 15 min TTL
- Refresh token: 7 day TTL (rotating)
- Redis-backed session blacklist for immediate revocation

**Authorization (RBAC):**
- Platform Roles: user, admin, superadmin
- Team Roles: owner, admin, member, viewer
- Resource-Level: creator, editor, viewer, executor

### 7.2 Encryption

**Data at Rest:**
- PostgreSQL TDE (AES-256 via cloud provider)
- Supabase/S3: Server-side encryption AES-256 (SSE-S3)
- Column-level encryption via pgcrypto for sensitive fields (api_keys, auth_config)
- Application-level encryption for agent instructions and marketplace content

**Data in Transit:**
- TLS 1.3 minimum (TLS 1.2 fallback with strict ciphers)
- HSTS (max-age=31536000)
- mTLS for inter-service communication in Kubernetes
- Perfect Forward Secrecy (ECDHE)

**Key Management:**
- Master Encryption Key: AWS KMS / Azure Key Vault (HSM-backed)
- Envelope encryption, rotated every 90 days
- CSPRNG for API key generation (crypto.randomBytes)

### 7.3 OWASP Top 10 Mitigations

| OWASP Category | Mitigation |
|---------------|------------|
| A01 Broken Access Control | RBAC at API Gateway + service level, RLS in PostgreSQL, audit logging |
| A02 Cryptographic Failures | AES-256 at rest, TLS 1.3 in transit, bcrypt for passwords/keys |
| A03 Injection | Parameterized queries, Zod validation, Deno sandbox, LLM prompt injection detection |
| A04 Insecure Design | Rate limiting, resource quotas, circuit breakers, timeouts |
| A05 Security Misconfiguration | IaC (Terraform/Helm), CIS benchmarks, Trivy/Snyk scans, distroless containers |
| A06 Vulnerable Components | Automated dependency scanning, weekly updates, SBOM generation (Syft) |
| A07 Authentication Failures | Account lockout (5 attempts), rate limiting, MFA enforcement, session rotation |
| A08 Data Integrity Failures | CI/CD signing (Cosign), npm lockfiles, HMAC webhooks, version checksums |
| A09 Security Monitoring | Centralized structured logging, SIEM integration, 90-day log retention |
| A10 SSRF | Allowlist for outbound targets, sandboxed network, blocked metadata endpoints |

### 7.4 Additional Security

- **LLM-Specific:** Prompt injection detection, output sanitization, token rate limits, jailbreak detection
- **Sandboxing:** Deno with --no-fs --no-net flags, CPU/memory limits via cgroups, execution timeouts
- **Secrets Management:** HashiCorp Vault / AWS Secrets Manager, automatic rotation, no env var secrets
- **Compliance:** SOC 2 Type II (in progress), GDPR, CCPA, data residency options (US, EU, APAC)

---

## 8. Scalability Strategy

### 8.1 Horizontal Scaling

All microservices are stateless and scale horizontally behind load balancers. The Agent Engine service is the primary scaling target due to LLM execution load.

**Auto-scaling Policies (Kubernetes HPA):**
| Service | Metric | Min | Max | Scale Up | Scale Down |
|---------|--------|-----|-----|----------|------------|
| Auth Service | CPU > 70% | 2 | 5 | +2/2min | -1/5min |
| Agent Manager | CPU > 70% | 3 | 10 | +2/2min | -1/5min |
| Agent Engine | Queue depth > 100 | 5 | 20 | +3/1min | -1/3min |
| Tool Registry | Req/s > 1000 | 3 | 10 | +2/2min | -1/5min |
| Memory Service | CPU > 70% | 2 | 5 | +1/3min | -1/5min |
| Workflow Engine | Queue depth > 50 | 2 | 5 | +1/2min | -1/5min |

Cooldown: 180 seconds between scaling events. Scale up fast, scale down slow.

### 8.2 Multi-Layer Caching

- **L1 (Browser/CDN):** Static assets (1 year immutable), API responses (5-60s), marketplace images (24h ISR)
- **L2 (In-Memory):** Per-service LRU cache (100MB per instance, TTL 1-60s)
- **L3 (Redis):** Distributed cache with allkeys-lru eviction, tiered TTLs (1s-24h)
- **L4 (Database):** PostgreSQL shared_buffers (25% RAM), PgBouncer pooling, materialized views

**Cache Invalidation:** Write-through pattern â€” update DB, invalidate Redis key via Pub/Sub event

### 8.3 Database Scaling

- **Vertical:** Start with db.r6g.large (2 vCPU, 16GB), scale to db.r6g.4xlarge (16 vCPU, 128GB)
- **Horizontal:** 3-5 read replicas with application-level read/write splitting
- **Partitioning:** executions (monthly), execution_logs (monthly), usage_metering (daily), agent_memory (hash by agent_id)
- **Connection Pooling:** PgBouncer in transaction mode

### 8.4 CDN & Edge Strategy

- **Provider:** Cloudflare / Vercel Edge Network
- **Edge Functions:** JWT validation, geo-routing, A/B testing, rate limiting at edge
- **Multi-Region:** Primary (US-East), Secondary (EU-West), Tertiary (AP-Southeast)
- **DNS:** Geo-aware routing via Cloudflare

---

## 9. Deployment Architecture

### 9.1 Container Strategy

All services are containerized using Docker with multi-stage builds:
- **Build stage:** Full Node.js image with dev dependencies
- **Production stage:** Distroless Node.js image (~150MB) for minimal attack surface
- **Base image:** node:22-alpine or gcr.io/distroless/nodejs22

### 9.2 Environment Breakdown

| Environment | Purpose | Infrastructure |
|------------|---------|---------------|
| Local | Development | Docker Compose, local PostgreSQL/Redis |
| Dev | Integration testing | Kubernetes namespace (2-3 pods), shared DB |
| Staging | Pre-production validation | Full K8s cluster (3-5 pods), staging DB |
| Production | Live traffic | Multi-region K8s (5-20 pods), HA DB |

### 9.3 Deployment Platforms

| Component | Platform | Justification |
|-----------|----------|---------------|
| Frontend (Next.js) | Vercel | Edge network, ISR, automatic SSL, preview deployments |
| Backend Services (Node.js) | Railway / Render | Managed Docker hosting, auto-scaling, private networking |
| Or Kubernetes | AWS EKS / GCP GKE | For enterprise: full control, custom auto-scaling policies |
| Database | AWS RDS / Render Managed PostgreSQL | Automated backups, Multi-AZ, read replicas |
| Redis | AWS ElastiCache / Railway Redis | Managed clustering, auto-failover |
| Object Storage | Supabase / AWS S3 | S3-compatible, CDN integration, RLS policies |
| Queue | BullMQ (backed by Redis) | Managed via Redis provider |
| Auth | Clerk | Managed auth, webhooks, MFA, social login |
| Monitoring | Grafana + Prometheus + Sentry | Self-hosted or Grafana Cloud |

### 9.4 CI/CD Pipeline

`
Code Push (Git) â†’ GitHub Actions â†’ Lint/TypeCheck â†’ Unit Tests â†’ Build Images â†’
Push to Registry (Docker Hub / GHCR) â†’ Deploy to Dev â†’ Integration Tests â†’
Deploy to Staging â†’ E2E Tests â†’ Deploy to Production (Canary 10% â†’ 50% â†’ 100%)
`

- **Branch Strategy:** main (production), staging, develop, feature/*
- **Preview Deployments:** Each PR gets a unique Vercel preview + Railway environment
- **Rollback:** Automated rollback on failed health checks (5 consecutive failures)

---

## 10. Monitoring and Observability

### 10.1 Logging Strategy

- **Format:** Structured JSON logs with standard fields: timestamp, level, service, request_id, trace_id, message
- **Collection:** Filebeat â†’ Logstash â†’ Elasticsearch (ELK Stack) or Grafana Loki
- **Retention:** 30 days hot (Elasticsearch), 90 days warm, 1 year cold (S3)
- **PII Redaction:** Automated redaction of emails, IPs, tokens, and keys at collection point
- **Correlation:** request_id passed across all service calls for end-to-end tracing

### 10.2 Metrics

**Infrastructure Metrics (Prometheus + Grafana):**
- CPU, memory, disk I/O, network per pod
- Container restart count, OOM kills
- Node-level metrics (Kubernetes)

**Application Metrics (Custom instrumentation):**
- Request rate, latency (p50/p95/p99), error rate per endpoint
- Queue depth, processing time, failure rate per queue
- LLM call volume, latency, token usage per model/provider
- Tool call volume, success rate, avg response time
- Active WebSocket connections, message throughput
- Database query performance (slow query log)

**Business Metrics (Grafana dashboards):**
- Active users, agents, executions per day
- Revenue metrics (MRR, ARPU, churn rate)
- Marketplace installs, publisher earnings
- Plan conversion rates

### 10.3 Distributed Tracing

- **Tool:** OpenTelemetry with Jaeger or Grafana Tempo
- **Sampling:** Head-based (10% for low-traffic services, 1% for high-traffic)
- **Key spans:** API request â†’ queue job â†’ LLM call â†’ tool execution â†’ memory store
- **Trace context:** Propagated via W3C Trace Context headers

### 10.4 Alerting

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| Service Down | Health check fails > 30s | Critical | PagerDuty + Slack |
| High Error Rate | 5xx > 5% over 5 min | Critical | PagerDuty + Slack |
| High Latency | p99 > 5s over 5 min | Warning | Slack |
| Queue Backlog | Queue depth > 1000 | Warning | Slack |
| LLM Token Spike | > 10x normal usage | Warning | Slack + Email |
| Rate Limit Hit | > 80% of limit | Info | Slack |
| Certificate Expiry | < 30 days remaining | Warning | Slack + Email |
| Disk Usage | > 85% | Warning | Slack |

### 10.5 Health Checks

Every service exposes at /health:
- **Liveness:** Is the process alive? (simple ping)
- **Readiness:** Is the service ready to accept traffic? (DB connection, Redis connection)
- **Startup:** Has the service finished initializing? (migrations complete, cache warm)

---

## 11. Disaster Recovery Plan

### 11.1 Backup Strategy

| Data Store | Backup Method | Frequency | Retention | RPO | RTO |
|-----------|---------------|-----------|-----------|-----|-----|
| PostgreSQL | pg_dump + WAL archiving | Continuous (WAL) + Daily (full) | 30 daily, 12 monthly, 7 yearly | 5 min | 1 hour |
| Redis | RDB snapshots + AOF | Every 5 min (AOF) | 7 days | 5 min | 15 min |
| Supabase/S3 | Cross-region replication | Real-time | 90 days with versioning | 1 min | 15 min |
| Application Config | Git (IaC) | Every commit | Full Git history | N/A | 30 min |

### 11.2 Failure Scenarios

| Scenario | Detection | Mitigation | Recovery Time |
|----------|-----------|------------|---------------|
| Single Pod Crash | Kubernetes liveness probe | Auto-restart by K8s | < 30 seconds |
| Node Failure | Node status = NotReady | Pod rescheduled to healthy node | < 2 minutes |
| Database Primary Failure | pg_auto_failover | Automatic replica promotion | < 5 minutes |
| Redis Cluster Failure | Redis Sentinel | Automatic failover to replica | < 1 minute |
| Azure/AWS Region Outage | Cloud provider status | DNS failover to secondary region | < 15 minutes |
| Data Corruption | pg_statistic alerts | Point-in-time recovery (PITR) | < 1 hour |
| Security Breach | SIEM alert | Isolate affected services, revoke keys, restore from pre-breach backup | < 4 hours |

### 11.3 DR Runbook

**Tier 1 (Critical â€” Revenue Impacting):**
1. Auto-failover for database (no human intervention required)
2. Auto-scaling for traffic spikes
3. Immediate notification to on-call engineer via PagerDuty

**Tier 2 (High â€” User Impacting):**
1. On-call engineer acknowledges within 5 minutes
2. Assess impact and declare severity
3. Execute incident response: isolate, mitigate, resolve, post-mortem

**Tier 3 (Medium â€” Degraded Experience):**
1. Alert sent to Slack #incidents channel
2. Engineering team triages during business hours
3. Fix deployed via standard CI/CD pipeline

### 11.4 Data Recovery Procedure

1. Identify the recovery point (timestamp or transaction ID)
2. Provision a new database instance from the latest backup
3. Apply WAL logs up to the recovery point (PITR)
4. Verify data integrity (row counts, checksums, application smoke tests)
5. Update DNS to point to the recovered database
6. Scale up application services to handle catch-up load
7. Monitor replication lag and application health

---

## 12. Cost Estimation

### 12.1 Monthly Infrastructure Costs (Production)

| Component | Specification | Quantity | Unit Cost | Monthly Cost |
|-----------|--------------|----------|-----------|-------------|
| **Compute (Kubernetes / Railway)** | | | | |
| Agent Engine | 4 vCPU, 16GB RAM | 10 pods | .15/hr | ,080 |
| Agent Manager | 2 vCPU, 8GB RAM | 4 pods | .08/hr |  |
| Auth Service | 1 vCPU, 4GB RAM | 3 pods | .04/hr |  |
| Tool Registry | 2 vCPU, 8GB RAM | 4 pods | .08/hr |  |
| Memory Service | 2 vCPU, 8GB RAM | 3 pods | .08/hr |  |
| Workflow Engine | 2 vCPU, 8GB RAM | 3 pods | .08/hr |  |
| Other Services | 1 vCPU, 4GB RAM | 8 pods | .04/hr |  |
| **Database** | | | | |
| PostgreSQL Primary | db.r6g.xlarge (4 vCPU, 32GB) | 1 | .48/hr |  |
| PostgreSQL Read Replica | db.r6g.large (2 vCPU, 16GB) | 3 | .24/hr |  |
| **Cache** | | | | |
| Redis Cluster | cache.r6g.large (2 vCPU, 13GB) | 3 nodes | .18/hr |  |
| **Storage** | | | | |
| Supabase Pro | 100GB database, 1TB bandwidth | 1 | /mo |  |
| S3 Object Storage | 500GB + 2TB transfer | 1 | /mo |  |
| **CDN & Edge** | | | | |
| Cloudflare Pro | CDN + WAF + DDoS | 1 | /mo |  |
| Vercel Pro | Edge network + Analytics | 1 | /mo |  |
| **Auth** | | | | |
| Clerk Pro | 10K MAU, unlimited SSO | 1 | /mo |  |
| **Monitoring** | | | | |
| Grafana Cloud | Metrics + Logs + Traces | 1 | /mo |  |
| Sentry | Error tracking (100K events) | 1 | /mo |  |
| **Third-Party Services** | | | | |
| Stripe | Payment processing (2.9% + .30) | â€” | Per transaction | ~ |
| OpenAI API | GPT-4o, embeddings | â€” | Usage-based | ~,000 |
| SendGrid | Email delivery (50K/mo) | 1 | .95/mo |  |
| **Total Base Infrastructure** | | | | **~,902/mo** |

### 12.2 Estimated Monthly Costs by Scale

| Scale | Active Users | Executions/Month | Estimated Cost |
|-------|-------------|-----------------|---------------|
| Launch | 1,000 | 50,000 | ,900/mo |
| Growth | 10,000 | 500,000 | ,000/mo |
| Scale | 50,000 | 2,500,000 | ,000/mo |
| Enterprise | 200,000+ | 10,000,000+ | ,000+/mo |

### 12.3 Cost Optimization Strategies

- **Reserved Instances:** Commit to 1-year or 3-year terms for 30-60% discount on compute
- **Spot Instances:** Use spot/preemptible VMs for batch processing, analytics, and non-critical workloads (60-90% discount)
- **LLM Caching:** Cache common LLM responses (semantic caching) to reduce API costs by up to 40%
- **Auto-scaling:** Scale down to minimum during off-peak hours (nights, weekends)
- **Log Retention:** Tiered log storage (hot/warm/cold) to reduce Elasticsearch costs
- **Connection Pooling:** PgBouncer to reduce database connection overhead
- **Image Optimization:** Compress Docker images, use layer caching to reduce ECR costs
- **CDN Caching:** Maximize cache hit ratio (>80%) to reduce origin server load

### 12.4 Revenue Model (Projected)

| Plan | Price | Features | Est. Conversion |
|------|-------|----------|----------------|
| Free |  | 1 agent, 5 tools, 10K tokens/mo | 80% of users |
| Pro | /mo | 10 agents, unlimited tools, 1M tokens/mo | 15% of users |
| Team | /mo | 50 agents, team collaboration, 10M tokens/mo | 4% of users |
| Enterprise | Custom | Unlimited, SSO, SLA, dedicated infra | 1% of users |

**Additional Revenue:**
- Marketplace commission: 15-30% on sales
- Credit top-ups: $10-$500 per purchase
- API access: $0.001 per API call beyond plan limits

**Break-Even Analysis:**
- At 1,000 users with 15% Pro, 4% Team conversion
- Monthly revenue: (150 × $29) + (40 × $99) = $4,350 + $3,960 = **$8,310/mo**
- Break-even achieved at approximately 1,000-1,500 active users

---

*This document is maintained by the Platform Architecture Team. For questions or suggestions, please submit a PR or open an issue in the AgentForge repository.*
