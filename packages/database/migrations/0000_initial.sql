-- AgentForge Database Schema v1.0.0
-- Initial migration: creates all tables, indexes, and constraints

-- ============================================================================
-- USERS
-- Core identity table. Each user maps to a Clerk authentication record.
-- ============================================================================
CREATE TABLE IF NOT EXISTS "users" (
    "id"          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "email"       text        NOT NULL,
    "name"        text        NOT NULL,
    "avatar_url"  text,
    "clerk_id"    text,
    "roles"       text[]      DEFAULT ARRAY['user'],
    "created_at"  timestamp   DEFAULT now() NOT NULL,
    "updated_at"  timestamp   DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email"       ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_clerk_id"    ON "users" ("clerk_id");

COMMENT ON TABLE  "users"      IS 'Platform users synced with Clerk authentication';
COMMENT ON COLUMN "users"."roles" IS 'User roles: user, admin, moderator';

-- ============================================================================
-- TEAMS
-- Groups of users that share agents, workflows, and resources.
-- ============================================================================
CREATE TABLE IF NOT EXISTS "teams" (
    "id"           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "name"         text        NOT NULL,
    "description"  text,
    "owner_id"     uuid        NOT NULL REFERENCES "users"("id"),
    "is_personal"  boolean     DEFAULT false,
    "max_members"  integer     DEFAULT 10,
    "metadata"     jsonb,
    "created_at"   timestamp   DEFAULT now() NOT NULL,
    "updated_at"   timestamp   DEFAULT now() NOT NULL,
    "deleted_at"   timestamp
);

CREATE INDEX IF NOT EXISTS "idx_teams_owner_id" ON "teams" ("owner_id");

COMMENT ON TABLE  "teams"               IS 'Teams/groups that own agents and workflows';
COMMENT ON COLUMN "teams"."is_personal"  IS 'Auto-created personal team for every user';
COMMENT ON COLUMN "teams"."deleted_at"   IS 'Soft-delete timestamp';

-- ============================================================================
-- AGENTS
-- AI agent configurations with model settings, tools, and memory.
-- ============================================================================
CREATE TABLE IF NOT EXISTS "agents" (
    "id"             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "name"           text        NOT NULL,
    "description"    text,
    "system_prompt"  text,
    "model"          text        NOT NULL,
    "provider"       text        NOT NULL DEFAULT 'openai',
    "temperature"    numeric     DEFAULT 0.7,
    "max_tokens"     integer     DEFAULT 2048,
    "memory_config"  jsonb,
    "tools"          text[],
    "role"           text        DEFAULT 'executor',
    "owner_id"       uuid        NOT NULL REFERENCES "users"("id"),
    "team_id"        uuid        REFERENCES "teams"("id"),
    "status"         text        DEFAULT 'idle',
    "version"        integer     DEFAULT 1,
    "metadata"       jsonb,
    "is_template"    boolean     DEFAULT false,
    "is_public"      boolean     DEFAULT false,
    "created_at"     timestamp   DEFAULT now() NOT NULL,
    "updated_at"     timestamp   DEFAULT now() NOT NULL,
    "deleted_at"     timestamp
);

CREATE INDEX IF NOT EXISTS "idx_agents_owner_id" ON "agents" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_agents_team_id"  ON "agents" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_agents_active"   ON "agents" ("deleted_at") WHERE "deleted_at" IS NULL;

COMMENT ON TABLE  "agents"                IS 'AI agent configurations with model, tools, and memory';
COMMENT ON COLUMN "agents"."role"         IS 'Agent role: executor, reviewer, orchestrator, observer';
COMMENT ON COLUMN "agents"."status"       IS 'Agent status: idle, running, paused, error';
COMMENT ON COLUMN "agents"."is_template"  IS 'Can be used as a template for new agents';
COMMENT ON COLUMN "agents"."deleted_at"   IS 'Soft-delete timestamp';

-- ============================================================================
-- WORKFLOWS
-- Visual DAG workflows connecting agents with triggers and steps.
-- ============================================================================
CREATE TABLE IF NOT EXISTS "workflows" (
    "id"              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "name"            text        NOT NULL,
    "description"     text,
    "trigger_type"    text        DEFAULT 'manual',
    "trigger_config"  jsonb,
    "status"          text        DEFAULT 'draft',
    "owner_id"        uuid        NOT NULL REFERENCES "users"("id"),
    "team_id"         uuid        REFERENCES "teams"("id"),
    "nodes"           jsonb,
    "edges"           jsonb,
    "version"         integer     DEFAULT 1,
    "metadata"        jsonb,
    "created_at"      timestamp   DEFAULT now() NOT NULL,
    "updated_at"      timestamp   DEFAULT now() NOT NULL,
    "deleted_at"      timestamp
);

CREATE INDEX IF NOT EXISTS "idx_workflows_owner_id" ON "workflows" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_workflows_team_id"  ON "workflows" ("team_id");

COMMENT ON TABLE  "workflows"                 IS 'Visual DAG workflow definitions connecting agents';
COMMENT ON COLUMN "workflows"."trigger_type"  IS 'Trigger: manual, schedule, webhook, event';
COMMENT ON COLUMN "workflows"."status"        IS 'Status: draft, active, paused, archived';
COMMENT ON COLUMN "workflows"."nodes"         IS 'Workflow nodes (agents, gates, transforms)';
COMMENT ON COLUMN "workflows"."edges"         IS 'Workflow connections between nodes';
COMMENT ON COLUMN "workflows"."deleted_at"    IS 'Soft-delete timestamp';

-- ============================================================================
-- EXECUTIONS
-- Records of every agent or workflow run with inputs, outputs, and metrics.
-- ============================================================================
CREATE TABLE IF NOT EXISTS "executions" (
    "id"            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "type"          text        NOT NULL,
    "status"        text        DEFAULT 'pending',
    "trigger"       text        DEFAULT 'manual',
    "input"         jsonb,
    "output"        jsonb,
    "error"         text,
    "duration"      integer,
    "token_usage"   jsonb,
    "cost"          numeric,
    "owner_id"      uuid        NOT NULL REFERENCES "users"("id"),
    "agent_id"      uuid        REFERENCES "agents"("id"),
    "workflow_id"   uuid        REFERENCES "workflows"("id"),
    "steps"         jsonb,
    "started_at"    timestamp,
    "completed_at"  timestamp,
    "created_at"    timestamp   DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_executions_owner_id"    ON "executions" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_executions_agent_id"    ON "executions" ("agent_id");
CREATE INDEX IF NOT EXISTS "idx_executions_workflow_id" ON "executions" ("workflow_id");
CREATE INDEX IF NOT EXISTS "idx_executions_status"      ON "executions" ("status");

COMMENT ON TABLE  "executions"                 IS 'Execution records for agent and workflow runs';
COMMENT ON COLUMN "executions"."type"          IS 'Execution type: agent, workflow, tool';
COMMENT ON COLUMN "executions"."status"        IS 'Status: pending, running, success, failed, cancelled';
COMMENT ON COLUMN "executions"."steps"         IS 'Array of execution step objects with timings';

-- ============================================================================
-- TOOL REGISTRY
-- Registry of available tools that agents can use.
-- ============================================================================
CREATE TABLE IF NOT EXISTS "tool_registry" (
    "id"          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "name"        text        NOT NULL,
    "description" text,
    "type"        text        NOT NULL,
    "category"    text        DEFAULT 'general',
    "config"      jsonb,
    "schema"      jsonb,
    "owner_id"    uuid        REFERENCES "users"("id"),
    "is_builtin"  boolean     DEFAULT false,
    "is_public"   boolean     DEFAULT false,
    "version"     integer     DEFAULT 1,
    "metadata"    jsonb,
    "created_at"  timestamp   DEFAULT now() NOT NULL,
    "updated_at"  timestamp   DEFAULT now() NOT NULL,
    "deleted_at"  timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tool_registry_name"       ON "tool_registry" ("name");
CREATE INDEX IF NOT EXISTS        "idx_tool_registry_owner_id"   ON "tool_registry" ("owner_id");
CREATE INDEX IF NOT EXISTS        "idx_tool_registry_category"   ON "tool_registry" ("category");

COMMENT ON TABLE  "tool_registry"              IS 'Registry of tools that agents can invoke';
COMMENT ON COLUMN "tool_registry"."config"     IS 'Tool-specific configuration (API keys, endpoints, etc.)';
COMMENT ON COLUMN "tool_registry"."schema"     IS 'JSON Schema defining the tool input/output contract';
COMMENT ON COLUMN "tool_registry"."deleted_at" IS 'Soft-delete timestamp';

-- ============================================================================
-- MARKETPLACE LISTINGS
-- Published agents, workflows, and tools available in the marketplace.
-- ============================================================================
CREATE TABLE IF NOT EXISTS "marketplace_listings" (
    "id"                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "name"                text        NOT NULL,
    "description"         text,
    "short_description"   text,
    "type"                text        NOT NULL,
    "status"              text        DEFAULT 'draft',
    "price"               numeric     DEFAULT 0,
    "currency"            text        DEFAULT 'USD',
    "author_id"           uuid        NOT NULL REFERENCES "users"("id"),
    "source_id"           text,
    "source_type"         text,
    "category"            text,
    "tags"                text[],
    "media_urls"          text[],
    "documentation_url"   text,
    "version"             text        DEFAULT '1.0.0',
    "downloads"           integer     DEFAULT 0,
    "rating"              numeric     DEFAULT 0,
    "review_count"        integer     DEFAULT 0,
    "metadata"            jsonb,
    "created_at"          timestamp   DEFAULT now() NOT NULL,
    "updated_at"          timestamp   DEFAULT now() NOT NULL,
    "published_at"        timestamp
);

CREATE INDEX IF NOT EXISTS "idx_marketplace_author_id"  ON "marketplace_listings" ("author_id");
CREATE INDEX IF NOT EXISTS "idx_marketplace_status"     ON "marketplace_listings" ("status");
CREATE INDEX IF NOT EXISTS "idx_marketplace_category"   ON "marketplace_listings" ("category");

COMMENT ON TABLE  "marketplace_listings"              IS 'Published marketplace items (agents, workflows, tools)';
COMMENT ON COLUMN "marketplace_listings"."type"       IS 'Item type: agent, workflow, tool, template';
COMMENT ON COLUMN "marketplace_listings"."status"     IS 'Listing status: draft, published, archived, rejected';
COMMENT ON COLUMN "marketplace_listings"."source_id"  IS 'ID of the source item being listed';
COMMENT ON COLUMN "marketplace_listings"."source_type" IS 'Type of the source item';

-- ============================================================================
-- MARKETPLACE REVIEWS
-- User reviews and ratings for marketplace listings.
-- ============================================================================
CREATE TABLE IF NOT EXISTS "marketplace_reviews" (
    "id"           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    "listing_id"   uuid        NOT NULL REFERENCES "marketplace_listings"("id"),
    "user_id"      uuid        NOT NULL REFERENCES "users"("id"),
    "rating"       integer     NOT NULL,
    "title"        text,
    "content"      text,
    "pros"         text[],
    "cons"         text[],
    "created_at"   timestamp   DEFAULT now() NOT NULL,
    "updated_at"   timestamp   DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_reviews_listing_id" ON "marketplace_reviews" ("listing_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_user_id"    ON "marketplace_reviews" ("user_id");

COMMENT ON TABLE  "marketplace_reviews"    IS 'User reviews for marketplace listings';
COMMENT ON COLUMN "marketplace_reviews"."rating" IS 'Rating 1-5';
