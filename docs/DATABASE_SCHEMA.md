# AgentForge Database Schema

> **Version:** 1.0.0  
> **Engine:** PostgreSQL 16+  
> **Extensions:** `pgcrypto`, `uuid-ossp`, `vector`, `pg_trgm`

---

## 1. Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

---

## 2. Complete Table Definitions

### 2.1 `users`

Core identity table. Each row maps to a Clerk authentication user.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `email` | `VARCHAR(320)` | `NOT NULL`, `UNIQUE` | — |
| `name` | `VARCHAR(255)` | `NOT NULL` | — |
| `avatar_url` | `TEXT` | — | `NULL` |
| `clerk_id` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(320) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    avatar_url  TEXT,
    clerk_id    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_clerk_id UNIQUE (clerk_id)
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_clerk_id ON users (clerk_id);
CREATE INDEX idx_users_created_at ON users (created_at);
```

---

### 2.2 `api_keys`

Scoped API keys for programmatic access (AgentForge SDK / API consumers).

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL`, `FK → users.id` | — |
| `name` | `VARCHAR(255)` | `NOT NULL` | — |
| `key_hash` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | — |
| `permissions` | `TEXT[]` | `NOT NULL` | `'{}'` |
| `last_used_at` | `TIMESTAMPTZ` | — | `NULL` |
| `expires_at` | `TIMESTAMPTZ` | — | `NULL` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE api_keys (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL,
    name         VARCHAR(255) NOT NULL,
    key_hash     VARCHAR(255) NOT NULL,
    permissions  TEXT[]       NOT NULL DEFAULT '{}',
    last_used_at TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_api_keys_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_api_keys_key_hash UNIQUE (key_hash)
);

CREATE INDEX idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX idx_api_keys_expires_at ON api_keys (expires_at);
```

---

### 2.3 `teams`

Collaboration groups that own agents and workflows.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `name` | `VARCHAR(255)` | `NOT NULL` | — |
| `description` | `TEXT` | — | — |
| `owner_id` | `UUID` | `NOT NULL`, `FK → users.id` | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE teams (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id    UUID         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_teams_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_teams_owner_id ON teams (owner_id);
```

---

### 2.4 `team_members`

Membership & role assignments within teams.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `team_id` | `UUID` | `NOT NULL`, `FK → teams.id` | — |
| `user_id` | `UUID` | `NOT NULL`, `FK → users.id` | — |
| `role` | `VARCHAR(20)` | `NOT NULL` | `'member'` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

`role` CHECK: `IN ('admin', 'member', 'viewer')`

```sql
CREATE TYPE team_role AS ENUM ('admin', 'member', 'viewer');

CREATE TABLE team_members (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id    UUID         NOT NULL,
    user_id    UUID         NOT NULL,
    role       team_role    NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_team_members UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members (team_id);
CREATE INDEX idx_team_members_user_id ON team_members (user_id);
```

---

### 2.5 `agents`

The core entity — an AI agent with its configuration, system prompt, and model settings.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `name` | `VARCHAR(255)` | `NOT NULL` | — |
| `description` | `TEXT` | — | — |
| `role` | `VARCHAR(100)` | `NOT NULL` | — |
| `goal` | `TEXT` | — | — |
| `system_prompt` | `TEXT` | — | — |
| `model_provider` | `VARCHAR(50)` | `NOT NULL` | `'openai'` |
| `model_name` | `VARCHAR(100)` | `NOT NULL` | — |
| `temperature` | `NUMERIC(3,2)` | — | `0.7` |
| `max_tokens` | `INTEGER` | — | `4096` |
| `memory_config` | `JSONB` | — | `'{}'` |
| `tools_config` | `JSONB` | — | `'{}'` |
| `status` | `VARCHAR(20)` | `NOT NULL` | `'draft'` |
| `user_id` | `UUID` | —, `FK → users.id` | — |
| `team_id` | `UUID` | —, `FK → teams.id` | — |
| `version` | `INTEGER` | `NOT NULL` | `1` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

`status` CHECK: `IN ('draft', 'active', 'paused', 'archived')`

```sql
CREATE TYPE agent_status AS ENUM ('draft', 'active', 'paused', 'archived');

CREATE TABLE agents (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    role            VARCHAR(100) NOT NULL,
    goal            TEXT,
    system_prompt   TEXT,
    model_provider  VARCHAR(50)  NOT NULL DEFAULT 'openai',
    model_name      VARCHAR(100) NOT NULL,
    temperature     NUMERIC(3,2)           DEFAULT 0.70,
    max_tokens      INTEGER                DEFAULT 4096,
    memory_config   JSONB                  DEFAULT '{}'::jsonb,
    tools_config    JSONB                  DEFAULT '{}'::jsonb,
    status          agent_status  NOT NULL DEFAULT 'draft',
    user_id         UUID,
    team_id         UUID,
    version         INTEGER      NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_agents_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    CONSTRAINT chk_agents_temperature CHECK (temperature >= 0 AND temperature <= 2),
    CONSTRAINT chk_agents_max_tokens CHECK (max_tokens > 0)
);

CREATE INDEX idx_agents_user_id ON agents (user_id);
CREATE INDEX idx_agents_team_id ON agents (team_id);
CREATE INDEX idx_agents_status ON agents (status);
CREATE INDEX idx_agents_model ON agents (model_provider, model_name);
CREATE INDEX idx_agents_created_at ON agents (created_at);

-- Full-text search support
ALTER TABLE agents ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(role, ''))) STORED;

CREATE INDEX idx_agents_search ON agents USING GIN (search_vector);
```

---

### 2.6 `agent_versions`

Immutable history of agent configuration snapshots.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `agent_id` | `UUID` | `NOT NULL`, `FK → agents.id` | — |
| `version` | `INTEGER` | `NOT NULL` | — |
| `config` | `JSONB` | `NOT NULL` | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE agent_versions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id   UUID        NOT NULL,
    version    INTEGER     NOT NULL,
    config     JSONB       NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_agent_versions_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    CONSTRAINT uq_agent_version UNIQUE (agent_id, version)
);

CREATE INDEX idx_agent_versions_agent_id ON agent_versions (agent_id);
```

---

### 2.7 `tools`

Registry of capability plugins available to agents.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `name` | `VARCHAR(255)` | `NOT NULL` | — |
| `description` | `TEXT` | — | — |
| `type` | `VARCHAR(50)` | `NOT NULL` | — |
| `config` | `JSONB` | — | `'{}'` |
| `schema` | `JSONB` | — | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

`type` CHECK: `IN ('file_system', 'github', 'terminal', 'browser', 'search', 'database', 'custom')`

```sql
CREATE TYPE tool_type AS ENUM (
    'file_system', 'github', 'terminal', 'browser', 'search', 'database', 'custom'
);

CREATE TABLE tools (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    type        tool_type    NOT NULL,
    config      JSONB        DEFAULT '{}'::jsonb,
    schema      JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tools_name UNIQUE (name)
);

CREATE INDEX idx_tools_type ON tools (type);
```

---

### 2.8 `agent_tools`

Many-to-many join between agents and tools with per-association overrides.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `agent_id` | `UUID` | `NOT NULL`, `FK → agents.id` | — |
| `tool_id` | `UUID` | `NOT NULL`, `FK → tools.id` | — |
| `config` | `JSONB` | — | `'{}'` |
| `enabled` | `BOOLEAN` | `NOT NULL` | `true` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE agent_tools (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id   UUID        NOT NULL,
    tool_id    UUID        NOT NULL,
    config     JSONB       DEFAULT '{}'::jsonb,
    enabled    BOOLEAN     NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_agent_tools_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    CONSTRAINT fk_agent_tools_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    CONSTRAINT uq_agent_tool UNIQUE (agent_id, tool_id)
);

CREATE INDEX idx_agent_tools_agent_id ON agent_tools (agent_id);
CREATE INDEX idx_agent_tools_tool_id ON agent_tools (tool_id);
```

---

### 2.9 `conversations`

Session containers for message exchanges with agents.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `agent_id` | `UUID` | `NOT NULL`, `FK → agents.id` | — |
| `user_id` | `UUID` | —, `FK → users.id` | — |
| `session_id` | `VARCHAR(255)` | —, `UNIQUE` | — |
| `title` | `VARCHAR(500)` | — | — |
| `metadata` | `JSONB` | — | `'{}'` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE conversations (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id   UUID         NOT NULL,
    user_id    UUID,
    session_id VARCHAR(255),
    title      VARCHAR(500),
    metadata   JSONB        DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_conversations_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_conversations_session UNIQUE (session_id)
);

CREATE INDEX idx_conversations_agent_id ON conversations (agent_id);
CREATE INDEX idx_conversations_user_id ON conversations (user_id);
CREATE INDEX idx_conversations_updated_at ON conversations (updated_at DESC);
```

---

### 2.10 `messages`

Individual turns within a conversation.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `conversation_id` | `UUID` | `NOT NULL`, `FK → conversations.id` | — |
| `role` | `VARCHAR(20)` | `NOT NULL` | — |
| `content` | `TEXT` | — | — |
| `tool_calls` | `JSONB` | — | — |
| `tool_results` | `JSONB` | — | — |
| `tokens_used` | `INTEGER` | — | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

`role` CHECK: `IN ('user', 'assistant', 'system', 'tool')`

```sql
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system', 'tool');

CREATE TABLE messages (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID           NOT NULL,
    role            message_role   NOT NULL,
    content         TEXT,
    tool_calls      JSONB,
    tool_results    JSONB,
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT chk_messages_tokens CHECK (tokens_used IS NULL OR tokens_used >= 0)
);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_created_at ON messages (conversation_id, created_at);
```

---

### 2.11 `agent_memory`

Vector-optimised memory store for agents (short-term, long-term, episodic, semantic).

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `agent_id` | `UUID` | `NOT NULL`, `FK → agents.id` | — |
| `type` | `VARCHAR(20)` | `NOT NULL` | — |
| `key` | `VARCHAR(500)` | `NOT NULL` | — |
| `value` | `TEXT` | `NOT NULL` | — |
| `embedding` | `VECTOR(1536)` | — | — |
| `metadata` | `JSONB` | — | `'{}'` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |
| `expires_at` | `TIMESTAMPTZ` | — | — |

`type` CHECK: `IN ('short_term', 'long_term', 'episodic', 'semantic')`

```sql
CREATE TYPE memory_type AS ENUM ('short_term', 'long_term', 'episodic', 'semantic');

CREATE TABLE agent_memory (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id   UUID           NOT NULL,
    type       memory_type    NOT NULL,
    key        VARCHAR(500)   NOT NULL,
    value      TEXT           NOT NULL,
    embedding  VECTOR(1536),
    metadata   JSONB          DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT fk_agent_memory_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_memory_agent_id ON agent_memory (agent_id);
CREATE INDEX idx_agent_memory_type ON agent_memory (agent_id, type);
CREATE INDEX idx_agent_memory_key ON agent_memory (agent_id, key);
CREATE INDEX idx_agent_memory_expires ON agent_memory (expires_at) WHERE expires_at IS NOT NULL;

-- IVFFlat index for approximate nearest-neighbour search on embeddings
CREATE INDEX idx_agent_memory_embedding ON agent_memory USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

---

### 2.12 `executions`

Records of agent execution runs (invocations).

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `agent_id` | `UUID` | `NOT NULL`, `FK → agents.id` | — |
| `user_id` | `UUID` | —, `FK → users.id` | — |
| `status` | `VARCHAR(20)` | `NOT NULL` | `'pending'` |
| `input` | `JSONB` | — | — |
| `output` | `TEXT` | — | — |
| `tokens_used` | `INTEGER` | — | — |
| `duration_ms` | `INTEGER` | — | — |
| `error` | `TEXT` | — | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |
| `completed_at` | `TIMESTAMPTZ` | — | — |

`status` CHECK: `IN ('pending', 'running', 'completed', 'failed')`

```sql
CREATE TYPE execution_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TABLE executions (
    id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id     UUID              NOT NULL,
    user_id      UUID,
    status       execution_status  NOT NULL DEFAULT 'pending',
    input        JSONB,
    output       TEXT,
    tokens_used  INTEGER,
    duration_ms  INTEGER,
    error        TEXT,
    created_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT fk_executions_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    CONSTRAINT fk_executions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_executions_tokens CHECK (tokens_used IS NULL OR tokens_used >= 0),
    CONSTRAINT chk_executions_duration CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

CREATE INDEX idx_executions_agent_id ON executions (agent_id);
CREATE INDEX idx_executions_user_id ON executions (user_id);
CREATE INDEX idx_executions_status ON executions (status);
CREATE INDEX idx_executions_created_at ON executions (created_at DESC);
```

---

### 2.13 `execution_logs`

Detailed step-by-step logs for each execution.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `execution_id` | `UUID` | `NOT NULL`, `FK → executions.id` | — |
| `step` | `INTEGER` | `NOT NULL` | — |
| `action` | `VARCHAR(255)` | `NOT NULL` | — |
| `input` | `JSONB` | — | — |
| `output` | `TEXT` | — | — |
| `duration_ms` | `INTEGER` | — | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE execution_logs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID         NOT NULL,
    step         INTEGER      NOT NULL,
    action       VARCHAR(255) NOT NULL,
    input        JSONB,
    output       TEXT,
    duration_ms  INTEGER,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_execution_logs_execution FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE,
    CONSTRAINT uq_execution_log_step UNIQUE (execution_id, step)
);

CREATE INDEX idx_execution_logs_execution_id ON execution_logs (execution_id);
```

---

### 2.14 `workflows`

Directed-graph workflows composed of agent nodes and edges.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `name` | `VARCHAR(255)` | `NOT NULL` | — |
| `description` | `TEXT` | — | — |
| `nodes` | `JSONB` | `NOT NULL` | — |
| `edges` | `JSONB` | `NOT NULL` | — |
| `user_id` | `UUID` | —, `FK → users.id` | — |
| `team_id` | `UUID` | —, `FK → teams.id` | — |
| `status` | `VARCHAR(20)` | `NOT NULL` | `'draft'` |
| `version` | `INTEGER` | `NOT NULL` | `1` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

`status` CHECK: `IN ('draft', 'active', 'paused', 'archived')`

```sql
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'archived');

CREATE TABLE workflows (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255)    NOT NULL,
    description TEXT,
    nodes       JSONB           NOT NULL,
    edges       JSONB           NOT NULL,
    user_id     UUID,
    team_id     UUID,
    status      workflow_status NOT NULL DEFAULT 'draft',
    version     INTEGER         NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT fk_workflows_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_workflows_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE INDEX idx_workflows_user_id ON workflows (user_id);
CREATE INDEX idx_workflows_team_id ON workflows (team_id);
CREATE INDEX idx_workflows_status ON workflows (status);
```

---

### 2.15 `workflow_runs`

Execution records of published workflows.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `workflow_id` | `UUID` | `NOT NULL`, `FK → workflows.id` | — |
| `status` | `VARCHAR(20)` | `NOT NULL` | `'pending'` |
| `trigger` | `JSONB` | — | — |
| `results` | `JSONB` | — | — |
| `started_at` | `TIMESTAMPTZ` | — | — |
| `completed_at` | `TIMESTAMPTZ` | — | — |

`status` CHECK: `IN ('pending', 'running', 'completed', 'failed', 'cancelled')`

```sql
CREATE TYPE workflow_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

CREATE TABLE workflow_runs (
    id           UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id  UUID                NOT NULL,
    status       workflow_run_status NOT NULL DEFAULT 'pending',
    trigger      JSONB,
    results      JSONB,
    started_at   TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT fk_workflow_runs_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs (workflow_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs (status);
CREATE INDEX idx_workflow_runs_started_at ON workflow_runs (started_at DESC);
```

---

### 2.16 `marketplace_listings`

Published agent listings in the AgentForge marketplace.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `agent_id` | `UUID` | `NOT NULL`, `FK → agents.id` | — |
| `user_id` | `UUID` | `NOT NULL`, `FK → users.id` | — |
| `name` | `VARCHAR(255)` | `NOT NULL` | — |
| `description` | `TEXT` | — | — |
| `price` | `NUMERIC(10,2)` | `NOT NULL` | `0.00` |
| `category` | `VARCHAR(100)` | — | — |
| `tags` | `TEXT[]` | — | `'{}'` |
| `rating_avg` | `NUMERIC(3,2)` | — | `0.00` |
| `rating_count` | `INTEGER` | `NOT NULL` | `0` |
| `download_count` | `INTEGER` | `NOT NULL` | `0` |
| `published` | `BOOLEAN` | `NOT NULL` | `false` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE marketplace_listings (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id       UUID           NOT NULL,
    user_id        UUID           NOT NULL,
    name           VARCHAR(255)   NOT NULL,
    description    TEXT,
    price          NUMERIC(10,2)  NOT NULL DEFAULT 0.00,
    category       VARCHAR(100),
    tags           TEXT[]         DEFAULT '{}',
    rating_avg     NUMERIC(3,2)             DEFAULT 0.00,
    rating_count   INTEGER        NOT NULL DEFAULT 0,
    download_count INTEGER        NOT NULL DEFAULT 0,
    published      BOOLEAN        NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_marketplace_listings_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    CONSTRAINT fk_marketplace_listings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_marketplace_listings_agent UNIQUE (agent_id),
    CONSTRAINT chk_marketplace_price CHECK (price >= 0),
    CONSTRAINT chk_marketplace_rating CHECK (rating_avg >= 0 AND rating_avg <= 5),
    CONSTRAINT chk_marketplace_rating_count CHECK (rating_count >= 0),
    CONSTRAINT chk_marketplace_download_count CHECK (download_count >= 0)
);

CREATE INDEX idx_marketplace_listings_user_id ON marketplace_listings (user_id);
CREATE INDEX idx_marketplace_listings_category ON marketplace_listings (category);
CREATE INDEX idx_marketplace_listings_published ON marketplace_listings (published) WHERE published = true;
CREATE INDEX idx_marketplace_listings_rating_avg ON marketplace_listings (rating_avg DESC);
CREATE INDEX idx_marketplace_listings_download_count ON marketplace_listings (download_count DESC);
CREATE INDEX idx_marketplace_listings_tags ON marketplace_listings USING GIN (tags);
CREATE INDEX idx_marketplace_listings_search ON marketplace_listings USING GIN (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);
```

---

### 2.17 `marketplace_reviews`

User-submitted reviews for marketplace listings.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `listing_id` | `UUID` | `NOT NULL`, `FK → marketplace_listings.id` | — |
| `user_id` | `UUID` | `NOT NULL`, `FK → users.id` | — |
| `rating` | `INTEGER` | `NOT NULL` | — |
| `review` | `TEXT` | — | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE marketplace_reviews (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID        NOT NULL,
    user_id    UUID        NOT NULL,
    rating     INTEGER     NOT NULL,
    review     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_marketplace_reviews_listing FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_marketplace_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_marketplace_review UNIQUE (listing_id, user_id),
    CONSTRAINT chk_marketplace_review_rating CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_marketplace_reviews_listing_id ON marketplace_reviews (listing_id);
CREATE INDEX idx_marketplace_reviews_user_id ON marketplace_reviews (user_id);
```

---

### 2.18 `notifications`

In-app notification delivery.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL`, `FK → users.id` | — |
| `type` | `VARCHAR(50)` | `NOT NULL` | — |
| `title` | `VARCHAR(500)` | `NOT NULL` | — |
| `message` | `TEXT` | — | — |
| `data` | `JSONB` | — | `'{}'` |
| `read` | `BOOLEAN` | `NOT NULL` | `false` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE notifications (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    title      VARCHAR(500) NOT NULL,
    message    TEXT,
    data       JSONB        DEFAULT '{}'::jsonb,
    read       BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_unread ON notifications (user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications (user_id, created_at DESC);
```

---

### 2.19 `audit_logs`

Immutable audit trail for compliance and security investigations.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` |
| `user_id` | `UUID` | —, `FK → users.id` | — |
| `action` | `VARCHAR(100)` | `NOT NULL` | — |
| `resource_type` | `VARCHAR(50)` | `NOT NULL` | — |
| `resource_id` | `VARCHAR(255)` | — | — |
| `details` | `JSONB` | — | — |
| `ip_address` | `INET` | — | — |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` |

```sql
CREATE TABLE audit_logs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID,
    action        VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50)  NOT NULL,
    resource_id   VARCHAR(255),
    details       JSONB,
    ip_address    INET,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
-- Partition-ready: created_at is the partitioning key candidate for time-based partitions
```

---

## 3. Indexing Strategy

### 3.1 Performance Indexes

| Table | Index | Type | Rationale |
|---|---|---|---|
| `users` | `email`, `clerk_id` | B-tree (unique) | Auth lookups |
| `api_keys` | `user_id` | B-tree | List keys by user |
| `api_keys` | `key_hash` | B-tree (unique) | API key authentication |
| `agents` | `user_id`, `team_id` | B-tree | Ownership queries |
| `agents` | `status` | B-tree | Filter by status |
| `agents` | `search_vector` | GIN | Full-text search |
| `conversations` | `(agent_id, updated_at DESC)` | Composite B-tree | Feed queries |
| `messages` | `(conversation_id, created_at)` | Composite B-tree | Chat history order |
| `executions` | `(agent_id, created_at DESC)` | Composite B-tree | Recent runs |
| `executions` | `status` | B-tree | Queue polling |
| `marketplace_listings` | `published` WHERE `published = true` | Partial B-tree | Public listings |
| `marketplace_listings` | `tags` | GIN | Array containment |
| `notifications` | `(user_id, read)` WHERE `read = false` | Partial B-tree | Unread badge |

### 3.2 Vector Indexes

| Table | Column | Index Type | Distance |
|---|---|---|---|
| `agent_memory` | `embedding` | IVFFlat (lists=100) | `vector_cosine_ops` |

### 3.3 Text Search Indexes

| Table | Expression |
|---|---|
| `agents` | `to_tsvector('english', name \|\| ' ' \|\| description \|\| ' ' \|\| role)` |
| `marketplace_listings` | `to_tsvector('english', name \|\| ' ' \|\| description)` |

---

## 4. Row-Level Security (RLS) Policies

```sql
-- ============================================================
-- Enable RLS on all tenant-aware tables
-- ============================================================
ALTER TABLE api_keys                ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_versions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tools             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory            ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows               ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: current user UUID (populated by application
-- from Clerk JWT sub claim)
-- ============================================================
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
    SELECT NULLIF(
        current_setting('app.current_user_id', true),
        ''
    )::UUID;
$$;

-- ============================================================
-- Helper: check if user is team admin
-- ============================================================
CREATE OR REPLACE FUNCTION auth.is_team_admin(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM team_members
        WHERE team_id = p_team_id
          AND user_id = auth.user_id()
          AND role = 'admin'
    );
$$;

-- ============================================================
-- api_keys: owners only
-- ============================================================
CREATE POLICY api_keys_owner_select ON api_keys
    FOR SELECT USING (user_id = auth.user_id());
CREATE POLICY api_keys_owner_insert ON api_keys
    FOR INSERT WITH CHECK (user_id = auth.user_id());
CREATE POLICY api_keys_owner_update ON api_keys
    FOR UPDATE USING (user_id = auth.user_id());
CREATE POLICY api_keys_owner_delete ON api_keys
    FOR DELETE USING (user_id = auth.user_id());

-- ============================================================
-- agents: owner, team-admin, or team-member (viewer+)
-- ============================================================
CREATE POLICY agents_select ON agents
    FOR SELECT USING (
        user_id = auth.user_id()
        OR (team_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = agents.team_id
              AND team_members.user_id = auth.user_id()
        ))
    );
CREATE POLICY agents_insert ON agents
    FOR INSERT WITH CHECK (
        user_id = auth.user_id()
        OR (team_id IS NOT NULL AND auth.is_team_admin(team_id))
    );
CREATE POLICY agents_update ON agents
    FOR UPDATE USING (
        user_id = auth.user_id()
        OR (team_id IS NOT NULL AND auth.is_team_admin(team_id))
    );
CREATE POLICY agents_delete ON agents
    FOR DELETE USING (
        user_id = auth.user_id()
        OR (team_id IS NOT NULL AND auth.is_team_admin(team_id))
    );

-- ============================================================
-- agent_memory: access via parent agent policy
-- ============================================================
CREATE POLICY agent_memory_select ON agent_memory
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_memory.agent_id)
    );
CREATE POLICY agent_memory_insert ON agent_memory
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_memory.agent_id)
    );
CREATE POLICY agent_memory_delete ON agent_memory
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_memory.agent_id)
    );

-- ============================================================
-- conversations: owner or participant via agent access
-- ============================================================
CREATE POLICY conversations_select ON conversations
    FOR SELECT USING (
        user_id = auth.user_id()
        OR EXISTS (SELECT 1 FROM agents WHERE agents.id = conversations.agent_id)
    );
CREATE POLICY conversations_insert ON conversations
    FOR INSERT WITH CHECK (user_id = auth.user_id());
CREATE POLICY conversations_update ON conversations
    FOR UPDATE USING (user_id = auth.user_id());

-- ============================================================
-- messages: via parent conversation
-- ============================================================
CREATE POLICY messages_select ON messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id)
    );
CREATE POLICY messages_insert ON messages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id)
    );

-- ============================================================
-- notifications: target user only
-- ============================================================
CREATE POLICY notifications_select ON notifications
    FOR SELECT USING (user_id = auth.user_id());
CREATE POLICY notifications_update ON notifications
    FOR UPDATE USING (user_id = auth.user_id());

-- ============================================================
-- audit_logs: admin / team-owner read-only
-- ============================================================
CREATE POLICY audit_logs_select ON audit_logs
    FOR SELECT USING (
        auth.user_id() IS NOT NULL
        AND (
            EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.user_id() AND role = 'admin')
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.user_id())
        )
    );

-- ============================================================
-- marketplace_listings: published visible to all; unpublished
-- visible to owner
-- ============================================================
CREATE POLICY marketplace_listings_select ON marketplace_listings
    FOR SELECT USING (
        published = true
        OR user_id = auth.user_id()
    );
CREATE POLICY marketplace_listings_insert ON marketplace_listings
    FOR INSERT WITH CHECK (user_id = auth.user_id());
CREATE POLICY marketplace_listings_update ON marketplace_listings
    FOR UPDATE USING (user_id = auth.user_id());
CREATE POLICY marketplace_listings_delete ON marketplace_listings
    FOR DELETE USING (user_id = auth.user_id());
```

---

## 5. Seed Data Script

```sql
-- ============================================================
-- Seed: Demo User
-- ============================================================
INSERT INTO users (id, email, name, avatar_url, clerk_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@agentforge.ai',
    'Demo User',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    'clerk_demo_001'
) ON CONFLICT (clerk_id) DO NOTHING;

-- ============================================================
-- Seed: System Tools
-- ============================================================
INSERT INTO tools (id, name, description, type, config, schema)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'File System',
    'Read, write, and manage files on the local filesystem',
    'file_system',
    '{"allowed_paths": ["/home/agentforge/data", "/tmp/agentforge"], "max_file_size_mb": 10}'::jsonb,
    '{
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ["read", "write", "list", "delete"]},
            "path": {"type": "string"},
            "content": {"type": "string"}
        },
        "required": ["action", "path"]
    }'::jsonb
),
(
    'a0000000-0000-0000-0000-000000000002',
    'GitHub',
    'Interact with GitHub repositories, issues, and pull requests',
    'github',
    '{"api_version": "2022-11-28"}'::jsonb,
    '{
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ["list_repos", "create_issue", "get_pr", "search_code"]},
            "owner": {"type": "string"},
            "repo": {"type": "string"}
        },
        "required": ["action"]
    }'::jsonb
),
(
    'a0000000-0000-0000-0000-000000000003',
    'Web Search',
    'Search the web for up-to-date information',
    'search',
    '{"provider": "tavily", "max_results": 5}'::jsonb,
    '{
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "max_results": {"type": "integer"}
        },
        "required": ["query"]
    }'::jsonb
),
(
    'a0000000-0000-0000-0000-000000000004',
    'Terminal',
    'Execute shell commands in a sandboxed environment',
    'terminal',
    '{"timeout_seconds": 30, "allowed_commands": ["python3", "node", "ls", "cat", "grep"]}'::jsonb,
    '{
        "type": "object",
        "properties": {
            "command": {"type": "string"},
            "args": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["command"]
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Seed: Demo Agent
-- ============================================================
INSERT INTO agents (id, name, description, role, goal, system_prompt, model_provider, model_name, temperature, max_tokens, memory_config, tools_config, status, user_id, version)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Code Assistant',
    'A general-purpose coding assistant that can read files, search the web, and execute code.',
    'Senior Software Engineer',
    'Help users write, debug, and understand code efficiently.',
    'You are a senior software engineer. You write clean, idiomatic, and well-structured code. You prefer simple solutions over complex ones. You always explain your reasoning concisely.',
    'openai',
    'gpt-4o',
    0.3,
    8192,
    '{"short_term": {"enabled": true, "ttl_minutes": 60}, "long_term": {"enabled": true, "max_entries": 500}}'::jsonb,
    '{"max_tool_calls_per_step": 5, "parallel_tool_calls": true}'::jsonb,
    'active',
    '00000000-0000-0000-0000-000000000001',
    1
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed: Link Agent to Tools
-- ============================================================
INSERT INTO agent_tools (agent_id, tool_id, enabled)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', true),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', true),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', true)
ON CONFLICT (agent_id, tool_id) DO NOTHING;

-- ============================================================
-- Seed: Demo Conversation
-- ============================================================
INSERT INTO conversations (id, agent_id, user_id, session_id, title)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'sess_demo_001',
    'Welcome to AgentForge'
) ON CONFLICT (session_id) DO NOTHING;

-- ============================================================
-- Seed: Demo Messages
-- ============================================================
INSERT INTO messages (conversation_id, role, content, tokens_used)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'system',
        'You are a senior software engineer. You write clean, idiomatic, and well-structured code.',
        15
    ),
    (
        'c0000000-0000-0000-0000-000000000001',
        'user',
        'Hello! What can you help me with today?',
        8
    ),
    (
        'c0000000-0000-0000-0000-000000000001',
        'assistant',
        'I can help you write code, debug issues, search documentation, manage files, and more. What would you like to work on?',
        22
    );

-- ============================================================
-- Seed: Marketplace Listing for Demo Agent
-- ============================================================
INSERT INTO marketplace_listings (agent_id, user_id, name, description, category, tags, price, published)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Code Assistant Pro',
    'A powerful coding assistant agent that helps with software development tasks across any language.',
    'developer-tools',
    ARRAY['coding', 'debugging', 'python', 'javascript', 'code-review'],
    9.99,
    true
) ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================
-- Seed: Demo Workflow
-- ============================================================
INSERT INTO workflows (id, name, description, nodes, edges, user_id, status)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'Code Review Pipeline',
    'Automated code review workflow: fetch PR → analyze → post comments',
    '[
        {
            "id": "node_1",
            "type": "trigger",
            "label": "PR Webhook"
        },
        {
            "id": "node_2",
            "type": "agent",
            "label": "Code Analyzer",
            "agent_id": "b0000000-0000-0000-0000-000000000001"
        },
        {
            "id": "node_3",
            "type": "output",
            "label": "Post Review"
        }
    ]'::jsonb,
    '[
        {"id": "edge_1", "source": "node_1", "target": "node_2"},
        {"id": "edge_2", "source": "node_2", "target": "node_3"}
    ]'::jsonb,
    '00000000-0000-0000-0000-000000000001',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed: Sample Notification
-- ============================================================
INSERT INTO notifications (user_id, type, title, message, data)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'welcome',
    'Welcome to AgentForge!',
    'Your account has been created. Start by creating your first agent.',
    '{"onboarding_step": "create_agent"}'::jsonb
);

-- ============================================================
-- Verify seed data
-- ============================================================
DO $$
DECLARE
    user_count    INT;
    agent_count   INT;
    tool_count    INT;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO agent_count FROM agents;
    SELECT COUNT(*) INTO tool_count FROM tools;

    RAISE NOTICE 'Seed complete — Users: %, Agents: %, Tools: %', user_count, agent_count, tool_count;
END;
$$;
```

---

## 6. Entity Relationship Summary

```
users ──1:N── api_keys
users ──1:N── agents (owner)
users ──1:N── conversations
users ──1:N── executions
users ──1:N── workflows
users ──1:N── notifications
users ──1:N── audit_logs
users ──1:N── marketplace_listings
users ──1:N── marketplace_reviews
teams ──1:N── team_members ──N:1── users
teams ──1:N── agents
teams ──1:N── workflows
agents ──1:N── agent_versions
agents ──1:N── agent_tools ──N:1── tools
agents ──1:N── conversations ──1:N── messages
agents ──1:N── agent_memory
agents ──1:N── executions ──1:N── execution_logs
agents ──1:1── marketplace_listings (optional)
marketplace_listings ──1:N── marketplace_reviews
workflows ──1:N── workflow_runs
```

---

## 7. Migration Execution Order

When applying fresh to an empty database, run migrations in this exact order:

1. `CREATE EXTENSION` block
2. `CREATE TYPE` statements (enums)
3. `CREATE TABLE` in dependency order:
   - `users`, `teams`
   - `api_keys`, `team_members`
   - `agents`, `tools`
   - `agent_versions`, `agent_tools`
   - `conversations`
   - `messages`
   - `agent_memory`
   - `executions`
   - `execution_logs`
   - `workflows`
   - `workflow_runs`
   - `marketplace_listings`
   - `marketplace_reviews`
   - `notifications`
   - `audit_logs`
4. `CREATE INDEX` statements
5. RLS functions & policies
6. Seed data

```sql
-- One-shot migration wrapper (PostgreSQL 16+)
BEGIN;

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Enums (dropped in reverse order if re-running)
--    DROP TYPE IF EXISTS ... CASCADE;

-- 3. All CREATE TABLE statements go here (order as above)

-- 4. All CREATE INDEX statements go here

-- 5. RLS — all ALTER, CREATE FUNCTION, CREATE POLICY statements

-- 6. Seed data — all INSERT statements

COMMIT;
```
