# AgentForge API Design Document

> **Version:** 1.0.0  
> **Last Updated:** 2026-06-10  
> **Base URL:** `https://api.agentforge.io/v1`

---

## Table of Contents

1. [Authentication API](#1-authentication-api)
2. [Agents API](#2-agents-api)
3. [Memory API](#3-memory-api)
4. [Teams API](#4-teams-api)
5. [Tools API](#5-tools-api)
6. [GitHub Integration API](#6-github-integration-api)
7. [Workflows API](#7-workflows-api)
8. [Marketplace API](#8-marketplace-api)
9. [Analytics API](#9-analytics-api)
10. [WebSocket Events](#10-websocket-events)
11. [Common Patterns](#11-common-patterns)

---

## Common Patterns

### Authentication
All endpoints except auth signup, signin, and forgot-password require a bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### Rate Limiting
| Tier        | Requests/min | Burst | Endpoint Group          |
|-------------|-------------|-------|-------------------------|
| Free        | 60          | 10    | All                     |
| Pro         | 300         | 50    | All                     |
| Enterprise  | 1000        | 200   | All                     |
| Auth        | 10          | 5     | `/api/auth/*`           |
| Execution   | 20          | 5     | `/api/agents/*/execute` |

Headers returned:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1623456789
```

### Error Response Schema
```typescript
interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, string[]>; // field-level validation errors
  requestId: string;
  timestamp: string; // ISO 8601
}
```

### Pagination
List endpoints accept `?page=1&limit=20` (default page=1, limit=20, max=100).

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### Common HTTP Status Codes
| Code | Meaning                          |
|------|----------------------------------|
| 200  | OK                               |
| 201  | Created                          |
| 204  | No Content (successful delete)   |
| 400  | Bad Request / Validation Error   |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (insufficient role)    |
| 404  | Not Found                        |
| 409  | Conflict (duplicate resource)    |
| 422  | Unprocessable Entity             |
| 429  | Too Many Requests (rate limit)   |
| 500  | Internal Server Error            |

---

## 1. Authentication API

### POST /api/auth/signup

Register a new user account.

**Authentication:** None  
**Rate Limit:** 10 req/min

#### Request Body
```typescript
interface SignupRequest {
  email: string;           // valid email, max 255 chars
  password: string;        // min 8, max 128, at least 1 upper + 1 special
  name: string;            // min 2, max 100 chars
  organization?: string;   // optional, max 200 chars
  acceptTerms: boolean;    // must be true
}
```

#### Response (201 Created)
```typescript
interface SignupResponse {
  user: {
    id: string;            // uuid
    email: string;
    name: string;
    organization?: string;
    roles: string[];       // default: ["user"]
    emailVerified: boolean;
    createdAt: string;     // ISO 8601
  };
  tokens: {
    accessToken: string;   // JWT, expires in 15 min
    refreshToken: string;  // JWT, expires in 7 days
    expiresAt: number;     // unix timestamp (access token expiry)
  };
}
```

#### Error Codes
| Code | Condition                        |
|------|----------------------------------|
| 400  | Invalid email or weak password   |
| 409  | Email already registered         |
| 422  | Terms not accepted               |

---

### POST /api/auth/signin

Authenticate a user and issue tokens.

**Authentication:** None  
**Rate Limit:** 10 req/min

#### Request Body
```typescript
interface SigninRequest {
  email: string;
  password: string;
  rememberMe?: boolean;  // if true, refresh token lasts 30 days
}
```

#### Response (200 OK)
```typescript
interface SigninResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    roles: string[];
    emailVerified: boolean;
    lastSignInAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}
```

#### Error Codes
| Code | Condition                     |
|------|-------------------------------|
| 400  | Missing email or password     |
| 401  | Invalid credentials           |
| 429  | Too many failed attempts      |

---

### POST /api/auth/signout

Invalidate the current session/refresh token.

**Authentication:** Required  
**Rate Limit:** 10 req/min

#### Request Body
```typescript
interface SignoutRequest {
  refreshToken?: string; // optional — if omitted, all sessions are revoked
}
```

#### Response (200 OK)
```typescript
interface SignoutResponse {
  message: "Signed out successfully";
  invalidatedTokens: number; // count of tokens revoked
}
```

#### Error Codes
| Code | Condition                |
|------|--------------------------|
| 401  | Missing/invalid token    |

---

### GET /api/auth/session

Get the current authenticated session and user profile.

**Authentication:** Required  
**Rate Limit:** 10 req/min

#### Response (200 OK)
```typescript
interface SessionResponse {
  authenticated: true;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    roles: string[];
    emailVerified: boolean;
    organization?: string;
    preferences: {
      theme: "light" | "dark" | "system";
      language: string;       // BCP 47 tag, default "en-US"
      timezone: string;       // IANA timezone, e.g. "America/New_York"
      notifications: {
        email: boolean;
        inApp: boolean;
        digest: "never" | "daily" | "weekly";
      };
    };
    usage: {
      totalExecutions: number;
      totalTokensUsed: number;
      plan: "free" | "pro" | "enterprise";
    };
    createdAt: string;
  };
}
```

#### Error Codes
| Code | Condition             |
|------|-----------------------|
| 401  | Invalid/expired token |

---

### POST /api/auth/forgot-password

Send a password reset email.

**Authentication:** None  
**Rate Limit:** 3 req/min per email

#### Request Body
```typescript
interface ForgotPasswordRequest {
  email: string;
  redirectUrl?: string; // URL to include in reset email, must be on allowlist
}
```

#### Response (200 OK)
```typescript
interface ForgotPasswordResponse {
  message: "If the account exists, a reset email has been sent";
  // Always return success to prevent email enumeration
}
```

#### Error Codes
| Code | Condition             |
|------|-----------------------|
| 429  | Rate limit exceeded   |

---

## 2. Agents API

### GET /api/agents

List all agents belonging to the authenticated user.

**Authentication:** Required  
**Rate Limit:** 60 req/min  
**Query Parameters:**

| Param     | Type    | Default | Description                          |
|-----------|---------|---------|--------------------------------------|
| page      | number  | 1       | Page number                          |
| limit     | number  | 20      | Items per page (max 100)             |
| sort      | string  | `-createdAt` | Field to sort by, prefix `-` for desc |
| status    | string  | —       | Filter by status (`active`, `archived`, `draft`) |
| search    | string  | —       | Full-text search on name/description |
| tags      | string  | —       | Comma-separated tag filter           |

#### Response (200 OK)
```typescript
interface AgentSummary {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  status: "active" | "archived" | "draft";
  tags: string[];
  model: string;           // e.g. "gpt-4o", "claude-3-opus"
  version: number;         // current version number
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type ListAgentsResponse = PaginatedResponse<AgentSummary>;
```

#### Error Codes
| Code | Condition          |
|------|--------------------|
| 401  | Unauthorized       |
| 422  | Invalid query params |

---

### POST /api/agents

Create a new agent.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Request Body
```typescript
interface CreateAgentRequest {
  name: string;                    // min 2, max 100 chars
  description: string;             // max 2000 chars
  avatarUrl?: string;              // valid URL
  tags?: string[];
  model: string;                   // must be from supported models list
  systemPrompt?: string;           // max 32,000 chars
  temperature?: number;            // 0.0 – 2.0, default 0.7
  maxTokens?: number;              // 1 – 128,000, default 4096
  topP?: number;                   // 0.0 – 1.0, default 1.0
  frequencyPenalty?: number;       // -2.0 – 2.0, default 0.0
  presencePenalty?: number;        // -2.0 – 2.0, default 0.0
  stopSequences?: string[];        // max 4 sequences, each max 100 chars
  tools?: string[];                // array of tool IDs to attach
  memory?: {
    enabled: boolean;
    type: "conversation" | "vector" | "hybrid";
    maxMessages?: number;          // for conversation memory, default 50
  };
  variables?: Record<string, string>; // template variables
  metadata?: Record<string, unknown>; // arbitrary user metadata
}
```

#### Response (201 Created)
```typescript
interface CreateAgentResponse {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  tags: string[];
  status: "draft";
  version: 1;
  model: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  tools: ToolSummary[];
  memory: {
    enabled: boolean;
    type: "conversation" | "vector" | "hybrid";
    maxMessages: number;
  };
  variables: Record<string, string>;
  metadata: Record<string, unknown>;
  createdBy: string;          // user ID
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition                        |
|------|----------------------------------|
| 400  | Validation error                 |
| 401  | Unauthorized                     |
| 402  | Payment required (plan limit)    |
| 422  | Unsupported model or tool        |

---

### GET /api/agents/:id

Get full details of a single agent.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Response (200 OK)
```typescript
interface GetAgentResponse {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  tags: string[];
  status: "active" | "archived" | "draft";
  version: number;
  model: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  tools: ToolSummary[];
  memory: {
    enabled: boolean;
    type: "conversation" | "vector" | "hybrid";
    maxMessages: number;
  };
  variables: Record<string, string>;
  metadata: Record<string, unknown>;
  executionStats: {
    total: number;
    succeeded: number;
    failed: number;
    avgDurationMs: number;
    avgTokensPerExecution: number;
    lastExecution?: {
      id: string;
      status: string;
      durationMs: number;
      tokensUsed: number;
      timestamp: string;
    };
  };
  createdBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition       |
|------|-----------------|
| 401  | Unauthorized    |
| 404  | Agent not found |
| 403  | No access       |

---

### PUT /api/agents/:id

Update an existing agent. Supports partial updates.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Request Body
```typescript
interface UpdateAgentRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
  tags?: string[];
  status?: "active" | "archived" | "draft";
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  tools?: string[];         // full replacement of tool list
  memory?: {
    enabled?: boolean;
    type?: "conversation" | "vector" | "hybrid";
    maxMessages?: number;
  };
  variables?: Record<string, string>;
  metadata?: Record<string, unknown>;
}
```

#### Response (200 OK)
```typescript
// Same schema as CreateAgentResponse
interface UpdateAgentResponse {
  id: string;
  // ... all agent fields
  version: number; // incremented on every update
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition                        |
|------|----------------------------------|
| 400  | Validation error                 |
| 401  | Unauthorized                     |
| 404  | Agent not found                  |
| 409  | Version conflict (stale update)  |
| 422  | Unsupported model or tool        |

---

### DELETE /api/agents/:id

Delete an agent permanently.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Query Parameters

| Param   | Type    | Default | Description                          |
|---------|---------|---------|--------------------------------------|
| force   | boolean | false   | Delete even if referenced by workflows |

#### Response (200 OK)
```typescript
interface DeleteAgentResponse {
  message: "Agent deleted successfully";
  id: string;
  deletedMemoryCount: number;
  deletedVersionCount: number;
}
```

#### Error Codes
| Code | Condition                          |
|------|------------------------------------|
| 401  | Unauthorized                       |
| 404  | Agent not found                    |
| 409  | Agent referenced by active workflow (use `?force=true`) |

---

### POST /api/agents/:id/execute

Execute an agent with a given input. This is a long-running operation.

**Authentication:** Required  
**Rate Limit:** 20 req/min; concurrent: 5 per agent

#### Request Body
```typescript
interface ExecuteAgentRequest {
  input: string | ChatMessage[];    // plain text or structured messages
  sessionId?: string;               // resume existing conversation session
  stream?: boolean;                 // enable SSE streaming (see WebSocket)
  variables?: Record<string, string>; // override agent template variables
  tools?: {
    override?: boolean;             // replace agent tools instead of extending
    toolIds?: string[];
  };
  maxWaitMs?: number;               // max time to wait for sync response (default 30000)
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
  attachments?: Array<{
    type: "image" | "file" | "code";
    url: string;
    mimeType: string;
  }>;
}
```

#### Response (200 OK — synchronous; 202 Accepted — async/streaming)
```typescript
interface ExecuteAgentResponse {
  executionId: string;
  status: "pending" | "running" | "completed" | "failed" | "stopped";
  output: {
    type: "text" | "json" | "markdown" | "error";
    content: string;
  };
  messages: ChatMessage[];         // full conversation messages
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  durationMs: number;
  toolsCalled: Array<{
    toolId: string;
    toolName: string;
    input: unknown;
    output: unknown;
    durationMs: number;
  }>;
  agentVersion: number;
  sessionId?: string;              // provided if session was created/continued
}
```

#### Error Codes
| Code | Condition                        |
|------|----------------------------------|
| 400  | Invalid input                    |
| 401  | Unauthorized                     |
| 402  | Insufficient credits/tokens      |
| 404  | Agent not found                  |
| 408  | Execution timed out              |
| 429  | Too many concurrent executions   |
| 500  | LLM provider error               |

---

### POST /api/agents/:id/clone

Create a deep copy of an agent.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface CloneAgentRequest {
  name?: string;     // if omitted, "Copy of <original name>" is used
  deep?: boolean;    // clone memory and execution history too (default false)
}
```

#### Response (201 Created)
```typescript
interface CloneAgentResponse {
  id: string;          // new agent ID
  name: string;
  sourceAgentId: string;
  version: 1;
  clonedMemory: boolean;
  clonedExecutions: boolean;
  createdAt: string;
}
```

#### Error Codes
| Code | Condition        |
|------|------------------|
| 401  | Unauthorized     |
| 404  | Agent not found  |

---

### GET /api/agents/:id/versions

List all historical versions of an agent.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Query Parameters

| Param | Type   | Default | Description       |
|-------|--------|---------|-------------------|
| page  | number | 1       | Page number       |
| limit | number | 20      | Items per page    |

#### Response (200 OK)
```typescript
interface AgentVersion {
  version: number;
  snapshot: {
    name: string;
    description: string;
    model: string;
    systemPrompt?: string;
    temperature: number;
    maxTokens: number;
    // ... all configuration fields at that point in time
  };
  changeLog?: string;
  createdBy: string;
  createdAt: string;
}

type ListAgentVersionsResponse = PaginatedResponse<AgentVersion>;
```

#### Error Codes
| Code | Condition        |
|------|------------------|
| 401  | Unauthorized     |
| 404  | Agent not found  |

---

### POST /api/agents/:id/versions

Create a new version snapshot manually.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface CreateAgentVersionRequest {
  changeLog?: string;  // description of changes in this version
}
```

#### Response (201 Created)
```typescript
interface CreateAgentVersionResponse {
  version: number;
  createdAt: string;
}
```

#### Error Codes
| Code | Condition        |
|------|------------------|
| 401  | Unauthorized     |
| 404  | Agent not found  |
| 409  | No changes since last version |

---

## 3. Memory API

### GET /api/agents/:id/memory

Retrieve memory entries for an agent's session.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Query Parameters

| Param      | Type   | Default | Description                          |
|------------|--------|---------|--------------------------------------|
| sessionId  | string | —       | Filter by session (required if conversation memory) |
| limit      | number | 50      | Max entries (max 200)                |
| type       | string | —       | Filter by type: `message`, `summary`, `vector`, `document` |
| before     | string | —       | Return entries before this ISO timestamp |

#### Response (200 OK)
```typescript
interface MemoryEntry {
  id: string;
  agentId: string;
  sessionId: string;
  type: "message" | "summary" | "vector" | "document";
  role?: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];   // vector embedding, included if type=vector
  tokenCount: number;
  createdAt: string;
}

interface GetMemoryResponse {
  entries: MemoryEntry[];
  total: number;
  sessionSummary?: string;  // AI-generated session summary if available
}
```

#### Error Codes
| Code | Condition        |
|------|------------------|
| 401  | Unauthorized     |
| 404  | Agent not found  |

---

### POST /api/agents/:id/memory

Add a memory entry to an agent's session.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Request Body
```typescript
interface CreateMemoryRequest {
  sessionId: string;
  type: "message" | "summary" | "document";
  role?: "user" | "assistant" | "system" | "tool";
  content: string;             // max 100,000 chars
  metadata?: Record<string, unknown>;
}
```

#### Response (201 Created)
```typescript
interface CreateMemoryResponse {
  id: string;
  agentId: string;
  sessionId: string;
  type: string;
  role?: string;
  content: string;
  tokenCount: number;
  createdAt: string;
}
```

#### Error Codes
| Code | Condition              |
|------|------------------------|
| 400  | Invalid input          |
| 401  | Unauthorized           |
| 404  | Agent not found        |

---

### DELETE /api/agents/:id/memory/:memoryId

Delete a specific memory entry.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Response (200 OK)
```typescript
interface DeleteMemoryResponse {
  message: "Memory entry deleted";
  id: string;
}
```

#### Error Codes
| Code | Condition          |
|------|--------------------|
| 401  | Unauthorized       |
| 404  | Memory not found   |

---

### POST /api/agents/:id/memory/search

Semantic/vector search across an agent's memory.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface MemorySearchRequest {
  query: string;                   // natural language query
  sessionId?: string;              // scope search to a session
  limit?: number;                  // max results, default 10, max 50
  minScore?: number;               // minimum similarity score 0.0–1.0, default 0.7
  filter?: {
    types?: ("message" | "summary" | "vector" | "document")[];
    dateFrom?: string;             // ISO date
    dateTo?: string;
    metadata?: Record<string, unknown>; // match against metadata fields
  };
}
```

#### Response (200 OK)
```typescript
interface MemorySearchResult {
  id: string;
  sessionId: string;
  type: string;
  role?: string;
  content: string;
  metadata?: Record<string, unknown>;
  score: number;             // cosine similarity 0.0–1.0
  createdAt: string;
}

interface MemorySearchResponse {
  results: MemorySearchResult[];
  query: string;
  totalResults: number;
  searchDurationMs: number;
}
```

#### Error Codes
| Code | Condition               |
|------|-------------------------|
| 400  | Missing query           |
| 401  | Unauthorized            |
| 402  | Vector search not on plan |
| 404  | Agent not found         |

---

## 4. Teams API

### GET /api/teams

List teams the user belongs to or owns.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Query Parameters

| Param | Type   | Default | Description |
|-------|--------|---------|-------------|
| page  | number | 1       | Page number |
| limit | number | 20      | Max 100     |

#### Response (200 OK)
```typescript
interface TeamSummary {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  memberCount: number;
  ownerId: string;
  role: "owner" | "admin" | "member" | "viewer";
  createdAt: string;
  updatedAt: string;
}

type ListTeamsResponse = PaginatedResponse<TeamSummary>;
```

#### Error Codes
| Code | Condition    |
|------|--------------|
| 401  | Unauthorized |

---

### POST /api/teams

Create a new team.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface CreateTeamRequest {
  name: string;               // min 2, max 100 chars
  description?: string;       // max 2000 chars
  avatarUrl?: string;
  isPublic?: boolean;         // default false — visible in discovery
  allowedDomains?: string[];  // email domains auto-approved to join
  settings?: {
    memberCanInvite?: boolean;
    memberCanCreateAgents?: boolean;
    memberCanCreateWorkflows?: boolean;
  };
}
```

#### Response (201 Created)
```typescript
interface CreateTeamResponse {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  isPublic: boolean;
  ownerId: string;
  role: "owner";
  settings: {
    memberCanInvite: boolean;
    memberCanCreateAgents: boolean;
    memberCanCreateWorkflows: boolean;
  };
  memberCount: 1;
  createdAt: string;
}
```

#### Error Codes
| Code | Condition                |
|------|--------------------------|
| 400  | Validation error         |
| 401  | Unauthorized             |
| 409  | Team name already exists |

---

### GET /api/teams/:id

Get full team details with member list.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Response (200 OK)
```typescript
interface GetTeamResponse {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  isPublic: boolean;
  ownerId: string;
  role: "owner" | "admin" | "member" | "viewer";
  settings: {
    memberCanInvite: boolean;
    memberCanCreateAgents: boolean;
    memberCanCreateWorkflows: boolean;
  };
  members: Array<{
    userId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: "owner" | "admin" | "member" | "viewer";
    joinedAt: string;
    lastActiveAt?: string;
  }>;
  agentCount: number;
  workflowCount: number;
  totalExecutions: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition      |
|------|----------------|
| 401  | Unauthorized   |
| 403  | No access      |
| 404  | Team not found |

---

### PUT /api/teams/:id

Update team properties.

**Authentication:** Required (owner or admin)  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface UpdateTeamRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  allowedDomains?: string[];
  settings?: {
    memberCanInvite?: boolean;
    memberCanCreateAgents?: boolean;
    memberCanCreateWorkflows?: boolean;
  };
}
```

#### Response (200 OK)
```typescript
// Same schema as CreateTeamResponse with updated values
```

#### Error Codes
| Code | Condition       |
|------|-----------------|
| 400  | Validation error|
| 401  | Unauthorized    |
| 403  | Insufficient role |
| 404  | Team not found  |

---

### DELETE /api/teams/:id

Permanently delete a team. All team agents and workflows are unassigned.

**Authentication:** Required (owner only)  
**Rate Limit:** 10 req/min

#### Response (200 OK)
```typescript
interface DeleteTeamResponse {
  message: "Team deleted successfully";
  id: string;
  unassignedAgentCount: number;
  unassignedWorkflowCount: number;
}
```

#### Error Codes
| Code | Condition           |
|------|---------------------|
| 401  | Unauthorized        |
| 403  | Owner only          |
| 404  | Team not found      |

---

### POST /api/teams/:id/members

Add a member to a team.

**Authentication:** Required (owner, admin, or member with invite permission)  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface AddMemberRequest {
  email: string;                       // user email to invite
  role: "admin" | "member" | "viewer"; // default "member"
  message?: string;                    // optional invitation message
}
```

#### Response (201 Created)
```typescript
interface AddMemberResponse {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "member" | "viewer";
  status: "active" | "pending";   // "pending" if user hasn't accepted
  joinedAt?: string;
  invitationId?: string;           // if status is pending
}
```

#### Error Codes
| Code | Condition                      |
|------|--------------------------------|
| 400  | Invalid email                  |
| 401  | Unauthorized                   |
| 403  | Insufficient permissions       |
| 404  | Team not found                 |
| 409  | User is already a member       |

---

### DELETE /api/teams/:id/members/:userId

Remove a member from a team.

**Authentication:** Required (owner, admin, or self)
**Rate Limit:** 30 req/min

#### Response (200 OK)
```typescript
interface RemoveMemberResponse {
  message: "Member removed successfully";
  userId: string;
}
```

#### Error Codes
| Code | Condition                    |
|------|------------------------------|
| 401  | Unauthorized                 |
| 403  | Cannot remove owner; insufficient permissions |
| 404  | Team or member not found     |

---

### POST /api/teams/:id/execute

Execute a team of agents in sequence, parallel, or hybrid mode.

**Authentication:** Required  
**Rate Limit:** 10 req/min; concurrent: 3 per team

#### Request Body
```typescript
interface ExecuteTeamRequest {
  mode: "sequential" | "parallel" | "hybrid";
  input: string | Record<string, unknown>;  // initial input
  agents: Array<{
    agentId: string;
    inputTransform?: string;    // JS expression to transform input for this agent
    outputKey?: string;         // key to store output under in shared context
    dependsOn?: string[];       // agent output keys this agent depends on (for hybrid)
    tools?: string[];           // tool overrides for this agent
    config?: {
      temperature?: number;
      maxTokens?: number;
    };
  }>;
  sharedContext?: Record<string, unknown>; // initial shared state
  maxRounds?: number;           // max interaction rounds for sequential/hybrid (default 10)
  stream?: boolean;
}
```

#### Response (200 OK — synchronous; 202 Accepted — async)
```typescript
interface ExecuteTeamResponse {
  executionId: string;
  status: "running" | "completed" | "failed" | "stopped";
  mode: "sequential" | "parallel" | "hybrid";
  results: Array<{
    agentId: string;
    agentName: string;
    outputKey: string;
    output: {
      type: "text" | "json" | "error";
      content: string;
    };
    tokensUsed: number;
    durationMs: number;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    error?: string;
  }>;
  sharedContext: Record<string, unknown>;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  totalDurationMs: number;
  startedAt: string;
  completedAt?: string;
}
```

#### Error Codes
| Code | Condition                      |
|------|--------------------------------|
| 400  | Invalid agent configuration    |
| 401  | Unauthorized                   |
| 402  | Insufficient credits           |
| 404  | Team or agent not found        |
| 409  | Circular dependency in agents  |

---

## 5. Tools API

### GET /api/tools

List available tools. Returns both built-in and custom tools the user has access to.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Query Parameters

| Param | Type   | Default | Description                                  |
|-------|--------|---------|----------------------------------------------|
| page  | number | 1       | Page number                                  |
| limit | number | 20      | Max 100                                      |
| type  | string | —       | Filter: `builtin`, `custom`, `integration`   |
| search| string | —       | Search by name or description                |

#### Response (200 OK)
```typescript
interface ToolSummary {
  id: string;
  name: string;
  description: string;
  type: "builtin" | "custom" | "integration";
  category: string;
  icon?: string;
  version: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

type ListToolsResponse = PaginatedResponse<ToolSummary>;
```

#### Error Codes
| Code | Condition    |
|------|--------------|
| 401  | Unauthorized |

---

### POST /api/tools

Create a custom tool.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface CreateToolRequest {
  name: string;                  // min 2, max 100 chars, kebab-case
  description: string;           // max 2000 chars
  type: "custom" | "integration";
  icon?: string;
  category?: string;             // default "custom"
  config: {
    schema: {                    // JSON Schema for tool input
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
    handler: {
      type: "code" | "http" | "graphql" | "grpc";
      source: string;            // inline code or URL endpoint
      runtime?: "javascript" | "python" | "typescript";
      code?: string;             // inline handler code (for type=code)
      url?: string;              // endpoint URL (for http/graphql/grpc)
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      headers?: Record<string, string>;
      authentication?: {
        type: "none" | "apiKey" | "bearer" | "basic" | "oauth2";
        credentials?: Record<string, string>;
      };
      timeout?: number;          // ms, default 30000, max 120000
    };
    output: {                    // JSON Schema for tool output
      type: "object";
      properties: Record<string, unknown>;
    };
  };
}
```

#### Response (201 Created)
```typescript
interface CreateToolResponse {
  id: string;
  name: string;
  description: string;
  type: "custom" | "integration";
  icon?: string;
  category: string;
  config: {
    schema: Record<string, unknown>;
    handler: {
      type: string;
      source: string;
      timeout: number;
    };
    output: Record<string, unknown>;
  };
  isEnabled: true;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition                         |
|------|-----------------------------------|
| 400  | Validation error                  |
| 401  | Unauthorized                      |
| 409  | Tool name already exists          |
| 422  | Invalid JSON Schema or handler    |

---

### GET /api/tools/:id

Get full tool details, including handler configuration.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Response (200 OK)
```typescript
interface GetToolResponse {
  id: string;
  name: string;
  description: string;
  type: "builtin" | "custom" | "integration";
  category: string;
  icon?: string;
  version: string;
  isEnabled: boolean;
  config: {
    schema: Record<string, unknown>;
    handler: {
      type: string;
      source: string;
      runtime?: string;
      code?: string;         // only included if user owns the tool
      url?: string;
      method?: string;
      timeout: number;
      authentication?: {
        type: string;
        // credentials are NEVER returned in responses
      };
    };
    output: Record<string, unknown>;
  };
  usageStats: {
    totalCalls: number;
    totalErrors: number;
    lastCalledAt?: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition      |
|------|----------------|
| 401  | Unauthorized   |
| 404  | Tool not found |

---

### PUT /api/tools/:id

Update a custom tool.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface UpdateToolRequest {
  name?: string;
  description?: string;
  icon?: string;
  category?: string;
  isEnabled?: boolean;
  config?: {
    schema?: Record<string, unknown>;
    handler?: {
      type?: "code" | "http" | "graphql" | "grpc";
      source?: string;
      runtime?: "javascript" | "python" | "typescript";
      code?: string;
      url?: string;
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      headers?: Record<string, string>;
      authentication?: {
        type?: "none" | "apiKey" | "bearer" | "basic" | "oauth2";
        credentials?: Record<string, string>;
      };
      timeout?: number;
    };
    output?: Record<string, unknown>;
  };
}
```

#### Response (200 OK)
```typescript
// Same schema as CreateToolResponse with updated values
```

#### Error Codes
| Code | Condition                |
|------|--------------------------|
| 400  | Validation error         |
| 401  | Unauthorized             |
| 403  | Cannot edit built-in     |
| 404  | Tool not found           |

---

### DELETE /api/tools/:id

Delete a custom tool.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Response (200 OK)
```typescript
interface DeleteToolResponse {
  message: "Tool deleted successfully";
  id: string;
  referencedByAgents: number;  // agents that will lose access
  referencedByWorkflows: number;
}
```

#### Error Codes
| Code | Condition                   |
|------|-----------------------------|
| 401  | Unauthorized                |
| 403  | Cannot delete built-in tool |
| 404  | Tool not found              |
| 409  | Tool in use by active exec  |

---

### POST /api/tools/:id/test

Execute a dry run of a tool with given input for testing purposes.

**Authentication:** Required  
**Rate Limit:** 20 req/min

#### Request Body
```typescript
interface TestToolRequest {
  input: Record<string, unknown>;  // must match tool's JSON Schema
  context?: Record<string, unknown>; // optional execution context
}
```

#### Response (200 OK)
```typescript
interface TestToolResponse {
  success: boolean;
  output: unknown;             // tool output matching tool's output schema
  error?: string;              // error message if failed
  durationMs: number;
  logs: string[];              // execution logs for debugging
  timestamp: string;
}
```

#### Error Codes
| Code | Condition              |
|------|------------------------|
| 400  | Invalid input schema   |
| 401  | Unauthorized           |
| 404  | Tool not found         |
| 500  | Handler execution error|

---

## 6. GitHub Integration API

### GET /api/integrations/github/authorize

Initiate OAuth flow — returns the GitHub OAuth authorization URL.

**Authentication:** Required  
**Rate Limit:** 10 req/min

#### Query Parameters

| Param  | Type   | Default | Description                              |
|--------|--------|---------|------------------------------------------|
| state  | string | —       | CSRF token (required, generated by client)|
| redirect| string| —       | Post-auth redirect URL (must be allowlisted)|

#### Response (200 OK)
```typescript
interface GitHubAuthorizeResponse {
  authorizationUrl: string;  // full GitHub OAuth URL
  state: string;             // same state passed in or generated
  expiresAt: string;         // state token expiry
}
```

#### Error Codes
| Code | Condition                |
|------|--------------------------|
| 401  | Unauthorized             |
| 400  | Missing state or redirect|

---

### POST /api/integrations/github/callback

Exchange OAuth code for tokens and store integration credentials.

**Authentication:** Required  
**Rate Limit:** 10 req/min

#### Request Body
```typescript
interface GitHubCallbackRequest {
  code: string;          // OAuth code from GitHub
  state: string;         // state param to verify CSRF
}
```

#### Response (200 OK)
```typescript
interface GitHubCallbackResponse {
  integrationId: string;
  githubUsername: string;
  githubUserId: number;
  scopes: string[];          // granted OAuth scopes
  reposAccess: "public_only" | "selected" | "all";
  connectedAt: string;
}
```

#### Error Codes
| Code | Condition                   |
|------|-----------------------------|
| 400  | Invalid code or state mismatch|
| 401  | Unauthorized                |
| 409  | GitHub account already linked to another user|

---

### GET /api/integrations/github/repos

List repositories accessible via the linked GitHub account.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Query Parameters

| Param  | Type   | Default | Description                      |
|--------|--------|---------|----------------------------------|
| page   | number | 1       | Page number                      |
| limit  | number | 30      | Per page (max 100)               |
| search | string | —       | Filter repos by name             |
| role   | string | —       | `owner`, `collaborator`, `member`|
| type   | string | all     | `all`, `public`, `private`       |

#### Response (200 OK)
```typescript
interface GitHubRepo {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  defaultBranch: string;
  language?: string;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
  updatedAt: string;
}

type ListGitHubReposResponse = PaginatedResponse<GitHubRepo>;
```

#### Error Codes
| Code | Condition                      |
|------|--------------------------------|
| 401  | Unauthorized                   |
| 401  | GitHub not connected           |
| 502  | GitHub API error               |

---

### GET /api/integrations/github/repos/:owner/:repo/analyze

Analyze a GitHub repository and return insights for agent configuration.

**Authentication:** Required  
**Rate Limit:** 10 req/min

#### Response (200 OK)
```typescript
interface GitHubRepoAnalysis {
  repo: {
    owner: string;
    name: string;
    defaultBranch: string;
  };
  summary: {
    totalFiles: number;
    totalLines: number;
    languages: Array<{ name: string; percentage: number; lines: number }>;
    topFiles: Array<{ path: string; lines: number; type: string }>;
  };
  structure: {
    root: string[];
    directories: string[];
    entryPoints?: string[];       // detected entry files
    configFiles?: string[];       // detected config files
  };
  dependencies: {
    packageManagers: string[];    // e.g. ["npm", "pip", "cargo"]
    totalDependencies: number;
    vulnerabilities?: number;     // if analysis includes security scan
  };
  documentation: {
    readme?: string;
    contributing?: string;
    hasWiki: boolean;
    hasPages: boolean;
  };
  suggestedTools: Array<{
    toolId: string;
    toolName: string;
    relevance: number;             // 0.0–1.0
    reason: string;
  }>;
  cachedAt: string;
}
```

#### Error Codes
| Code | Condition                      |
|------|--------------------------------|
| 401  | Unauthorized                   |
| 403  | No access to repo              |
| 404  | Repo not found                 |
| 502  | GitHub API error               |

---

### POST /api/integrations/github/repos/:owner/:repo/issues

Create a GitHub issue via the integration.

**Authentication:** Required  
**Rate Limit:** 20 req/min

#### Request Body
```typescript
interface CreateGitHubIssueRequest {
  title: string;              // max 256 chars
  body?: string;              // markdown, max 65536 chars
  assignees?: string[];       // GitHub usernames
  labels?: string[];
  milestone?: number;
}
```

#### Response (201 Created)
```typescript
interface CreateGitHubIssueResponse {
  issueNumber: number;
  title: string;
  state: "open" | "closed";
  url: string;               // GitHub issue URL
  htmlUrl: string;
  createdAt: string;
}
```

#### Error Codes
| Code | Condition                      |
|------|--------------------------------|
| 400  | Validation error               |
| 401  | Unauthorized                   |
| 403  | No push permission on repo     |
| 404  | Repo not found                 |

---

### POST /api/integrations/github/repos/:owner/:repo/pulls

Create a pull request on GitHub.

**Authentication:** Required  
**Rate Limit:** 10 req/min

#### Request Body
```typescript
interface CreateGitHubPullRequestRequest {
  title: string;               // max 256 chars
  body?: string;               // markdown, max 65536 chars
  head: string;                // source branch name
  base: string;                // target branch name (default: default branch)
  draft?: boolean;             // create as draft PR
  maintainerCanModify?: boolean; // default true
  labels?: string[];
  reviewers?: string[];        // GitHub usernames to request review
}
```

#### Response (201 Created)
```typescript
interface CreateGitHubPullRequestResponse {
  prNumber: number;
  title: string;
  state: "open" | "closed" | "merged";
  url: string;
  htmlUrl: string;
  head: string;
  base: string;
  mergeable: boolean | null;    // null if not yet computed
  createdAt: string;
}
```

#### Error Codes
| Code | Condition                      |
|------|--------------------------------|
| 400  | Validation error               |
| 401  | Unauthorized                   |
| 403  | No push permission             |
| 404  | Repo or branch not found       |
| 409  | No changes between branches    |

---

## 7. Workflows API

### GET /api/workflows

List workflows.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Query Parameters

| Param | Type   | Default | Description           |
|-------|--------|---------|-----------------------|
| page  | number | 1       | Page number           |
| limit | number | 20      | Max 100               |
| status| string | —       | `active`, `paused`, `archived` |
| search| string | —       | Name search           |

#### Response (200 OK)
```typescript
interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "archived";
  version: number;
  trigger: "manual" | "schedule" | "event" | "webhook";
  executionCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

type ListWorkflowsResponse = PaginatedResponse<WorkflowSummary>;
```

#### Error Codes
| Code | Condition    |
|------|--------------|
| 401  | Unauthorized |

---

### POST /api/workflows

Create a new workflow.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface CreateWorkflowRequest {
  name: string;                 // min 2, max 100 chars
  description?: string;         // max 2000 chars
  status?: "active" | "paused";
  trigger: {
    type: "manual" | "schedule" | "event" | "webhook";
    config?: {
      // For schedule trigger
      cron?: string;                            // cron expression
      timezone?: string;                        // IANA timezone
      // For event trigger
      eventType?: string;                       // e.g. "agent:completed"
      eventFilter?: Record<string, unknown>;    // filter conditions
      // For webhook trigger
      webhookUrl?: string;                      // auto-generated if not specified
      allowedIps?: string[];                    // IP allowlist
      secret?: string;                          // HMAC secret for verification
    };
  };
  steps: Array<{
    id: string;                 // unique step ID within workflow
    name: string;
    type: "agent" | "tool" | "condition" | "loop" | "transform" | "subworkflow";
    config: {
      // For agent type
      agentId?: string;
      agentInput?: string;                      // template with step references
      // For tool type
      toolId?: string;
      toolInput?: Record<string, unknown>;
      // For condition type
      condition?: string;                       // JS expression evaluating to boolean
      trueStep?: string;                        // step ID to jump to if true
      falseStep?: string;                       // step ID to jump to if false
      // For loop type
      iterateOver?: string;                     // expression resolving to array
      loopStep?: string;                        // step ID to repeat
      maxIterations?: number;                   // default 100
      // For transform type
      transform?: string;                       // JS expression
      outputKey?: string;                       // key to store result in context
      // For subworkflow type
      workflowId?: string;
    };
    dependsOn?: string[];                       // step IDs that must complete first
    onSuccess?: string;                         // step ID to jump to on success
    onFailure?: string;                         // step ID to jump to on failure
    retry?: {
      maxAttempts: number;                      // default 3
      delayMs: number;                          // default 1000
      backoff: "linear" | "exponential";        // default exponential
    };
    timeout?: number;                           // ms, default 300000 (5 min)
  }>;
  variables?: Record<string, string>;          // workflow template variables
  errorHandling?: {
    onFirstFailure: "stop" | "continue" | "jump";
    jumpToStep?: string;
    notification?: boolean;
  };
  metadata?: Record<string, unknown>;
}
```

#### Response (201 Created)
```typescript
interface CreateWorkflowResponse {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused";
  version: 1;
  trigger: {
    type: string;
    config?: Record<string, unknown>;
  };
  steps: Array<{
    id: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
    dependsOn?: string[];
    retry?: Record<string, unknown>;
    timeout: number;
  }>;
  variables: Record<string, string>;
  errorHandling: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition                          |
|------|------------------------------------|
| 400  | Validation error                   |
| 401  | Unauthorized                       |
| 422  | Invalid step references or cycles  |

---

### GET /api/workflows/:id

Get full workflow details.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Response (200 OK)
```typescript
interface GetWorkflowResponse {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "archived";
  version: number;
  trigger: {
    type: string;
    config?: Record<string, unknown>;
    webhookUrl?: string;           // only if trigger is webhook
  };
  steps: Array<{
    id: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
    dependsOn?: string[];
    retry?: Record<string, unknown>;
    timeout: number;
  }>;
  variables: Record<string, string>;
  errorHandling: Record<string, unknown>;
  executionStats: {
    total: number;
    succeeded: number;
    failed: number;
    avgDurationMs: number;
    successRate: number;            // 0.0–1.0
  };
  lastRun?: {
    id: string;
    status: string;
    startedAt: string;
    completedAt?: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition       |
|------|-----------------|
| 401  | Unauthorized    |
| 404  | Workflow not found |
| 403  | No access       |

---

### PUT /api/workflows/:id

Update an existing workflow.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Request Body
```typescript
interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  status?: "active" | "paused" | "archived";
  trigger?: {
    type?: "manual" | "schedule" | "event" | "webhook";
    config?: Record<string, unknown>;
  };
  steps?: Array<{
    id: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
    dependsOn?: string[];
    onSuccess?: string;
    onFailure?: string;
    retry?: Record<string, unknown>;
    timeout?: number;
  }>;
  variables?: Record<string, string>;
  errorHandling?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

#### Response (200 OK)
```typescript
// Same as CreateWorkflowResponse with incremented version
```

#### Error Codes
| Code | Condition              |
|------|------------------------|
| 400  | Validation error       |
| 401  | Unauthorized           |
| 404  | Workflow not found     |
| 409  | Version conflict       |

---

### DELETE /api/workflows/:id

Delete a workflow.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Response (200 OK)
```typescript
interface DeleteWorkflowResponse {
  message: "Workflow deleted successfully";
  id: string;
  deletedRunCount: number;
}
```

#### Error Codes
| Code | Condition        |
|------|------------------|
| 401  | Unauthorized     |
| 404  | Workflow not found|

---

### POST /api/workflows/:id/execute

Execute a workflow.

**Authentication:** Required  
**Rate Limit:** 10 req/min; concurrent: 3 per workflow

#### Request Body
```typescript
interface ExecuteWorkflowRequest {
  input?: Record<string, unknown>;          // initial context
  variables?: Record<string, string>;       // override template vars
  webhookToken?: string;                    // for webhook-triggered workflows
  notifyOnComplete?: boolean;               // send notification when done
}
```

#### Response (202 Accepted)
```typescript
interface ExecuteWorkflowResponse {
  runId: string;
  status: "pending" | "running";
  workflowId: string;
  workflowVersion: number;
  startedAt: string;
  estimatedDurationMs?: number;
}
```

#### Error Codes
| Code | Condition                    |
|------|------------------------------|
| 400  | Invalid input                |
| 401  | Unauthorized                 |
| 402  | Insufficient credits         |
| 404  | Workflow not found           |
| 409  | Workflow is paused/archived  |
| 429  | Too many concurrent executions|

---

### GET /api/workflows/:id/runs

List execution runs for a workflow.

**Authentication:** Required  
**Rate Limit:** 60 req/min

#### Query Parameters

| Param  | Type   | Default | Description              |
|--------|--------|---------|--------------------------|
| page   | number | 1       | Page number              |
| limit  | number | 20      | Max 100                  |
| status | string | —       | Filter: `running`, `completed`, `failed`, `stopped` |
| from   | string | —       | ISO date range start     |
| to     | string | —       | ISO date range end       |

#### Response (200 OK)
```typescript
interface WorkflowRun {
  id: string;                    // runId
  workflowId: string;
  workflowVersion: number;
  status: "pending" | "running" | "completed" | "failed" | "stopped" | "timed_out";
  trigger: "manual" | "schedule" | "event" | "webhook";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  steps: Array<{
    stepId: string;
    name: string;
    type: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped" | "timed_out";
    input?: unknown;
    output?: unknown;
    error?: string;
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    retryAttempt?: number;
  }>;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  durationMs: number;
  startedAt: string;
  completedAt?: string;
  triggeredBy?: string;          // user ID or "system" or webhook ID
}

type ListWorkflowRunsResponse = PaginatedResponse<WorkflowRun>;
```

#### Error Codes
| Code | Condition          |
|------|--------------------|
| 401  | Unauthorized       |
| 404  | Workflow not found |

---

## 8. Marketplace API

### GET /api/marketplace

Browse the agent/tool marketplace.

**Authentication:** Optional (recommended for personalized results)  
**Rate Limit:** 60 req/min

#### Query Parameters

| Param     | Type   | Default | Description                              |
|-----------|--------|---------|------------------------------------------|
| page      | number | 1       | Page number                              |
| limit     | number | 20      | Max 100                                  |
| category  | string | —       | Category slug                            |
| search    | string | —       | Full-text search                         |
| sort      | string | `-downloads` | `-downloads`, `-rating`, `-createdAt`, `name` |
| type      | string | —       | `agent`, `tool`, `workflow`, `template`  |
| tags      | string | —       | Comma-separated tags                     |
| minRating | number | —       | Minimum rating filter (1–5)              |
| free      | boolean| —       | Filter free listings only                |

#### Response (200 OK)
```typescript
interface MarketplaceListingSummary {
  id: string;
  name: string;
  description: string;
  type: "agent" | "tool" | "workflow" | "template";
  category: string;
  author: {
    name: string;
    avatarUrl?: string;
    verified: boolean;
  };
  thumbnailUrl?: string;
  tags: string[];
  pricing: {
    model: "free" | "paid" | "subscription";
    price?: number;              // in USD cents
    subscriptionInterval?: "month" | "year";
  };
  rating: number;                // 1.0–5.0
  reviewCount: number;
  downloadCount: number;
  version: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

type BrowseMarketplaceResponse = PaginatedResponse<MarketplaceListingSummary>;
```

#### Error Codes
| Code | Condition    |
|------|--------------|
| 422  | Invalid query params |

---

### POST /api/marketplace/listings

Publish a new listing to the marketplace.

**Authentication:** Required  
**Rate Limit:** 10 req/min

#### Request Body
```typescript
interface CreateMarketplaceListingRequest {
  type: "agent" | "tool" | "workflow" | "template";
  sourceId: string;             // agentId, toolId, or workflowId
  name: string;                 // min 2, max 100
  description: string;          // min 20, max 5000
  category: string;             // must be a valid category slug
  thumbnailUrl?: string;
  tags?: string[];              // max 10
  pricing: {
    model: "free" | "paid" | "subscription";
    price?: number;             // in USD cents (required if paid/subscription)
    subscriptionInterval?: "month" | "year"; // required if subscription
  };
  screenshots?: string[];       // array of image URLs, max 5
  demoUrl?: string;             // URL to live demo
  readme?: string;              // markdown, max 50000 chars
  compatibility?: {
    minAgentForgeVersion?: string;
    platforms?: string[];
  };
}
```

#### Response (201 Created)
```typescript
interface CreateMarketplaceListingResponse {
  id: string;
  type: string;
  sourceId: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  tags: string[];
  pricing: {
    model: string;
    price?: number;
    subscriptionInterval?: string;
  };
  status: "pending_review" | "published" | "rejected";
  version: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition                      |
|------|--------------------------------|
| 400  | Validation error               |
| 401  | Unauthorized                   |
| 402  | Payment required (listing fee) |
| 409  | Already have a listing for this source |
| 422  | Unsupported category           |

---

### GET /api/marketplace/listings/:id

Get full marketplace listing details.

**Authentication:** Optional  
**Rate Limit:** 60 req/min

#### Response (200 OK)
```typescript
interface GetMarketplaceListingResponse {
  id: string;
  type: "agent" | "tool" | "workflow" | "template";
  sourceId: string;
  name: string;
  description: string;
  category: string;
  categoryInfo: {
    slug: string;
    name: string;
    icon?: string;
  };
  thumbnailUrl?: string;
  tags: string[];
  pricing: {
    model: "free" | "paid" | "subscription";
    price?: number;
    subscriptionInterval?: string;
  };
  screenshots: string[];
  demoUrl?: string;
  readme: string;               // rendered markdown or raw
  compatibility: {
    minAgentForgeVersion?: string;
    platforms?: string[];
  };
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    bio?: string;
    verified: boolean;
    totalListings: number;
  };
  stats: {
    rating: number;
    reviewCount: number;
    downloadCount: number;
    recentDownloads: number;     // last 30 days
  };
  reviews: Array<{
    id: string;
    userId: string;
    userName: string;
    avatarUrl?: string;
    rating: number;
    title?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  version: string;
  status: "pending_review" | "published" | "rejected";
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Error Codes
| Code | Condition          |
|------|--------------------|
| 404  | Listing not found  |

---

### PUT /api/marketplace/listings/:id

Update a marketplace listing.

**Authentication:** Required (author only)  
**Rate Limit:** 10 req/min

#### Request Body
```typescript
interface UpdateMarketplaceListingRequest {
  name?: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  tags?: string[];
  pricing?: {
    model?: "free" | "paid" | "subscription";
    price?: number;
    subscriptionInterval?: "month" | "year";
  };
  screenshots?: string[];
  demoUrl?: string;
  readme?: string;
  compatibility?: {
    minAgentForgeVersion?: string;
    platforms?: string[];
  };
}
```

#### Response (200 OK)
```typescript
// Same schema as CreateMarketplaceListingResponse with updated values
// Note: update may reset status to "pending_review"
```

#### Error Codes
| Code | Condition              |
|------|------------------------|
| 400  | Validation error       |
| 401  | Unauthorized           |
| 403  | Not the author         |
| 404  | Listing not found      |

---

### POST /api/marketplace/listings/:id/download

Download/purchase a marketplace listing. On success, the resource is imported into the user's account.

**Authentication:** Required  
**Rate Limit:** 20 req/min

#### Request Body
```typescript
interface DownloadMarketplaceListingRequest {
  targetTeamId?: string;     // import into specific team (default: personal)
  name?: string;             // rename on import (default: listing name)
}
```

#### Response (200 OK)
```typescript
interface DownloadMarketplaceListingResponse {
  message: "Imported successfully";
  listingId: string;
  importedResource: {
    type: "agent" | "tool" | "workflow";
    id: string;              // new resource ID in user's account
    name: string;
  };
  license: {
    type: "mit" | "apache" | "gpl" | "proprietary" | "custom";
    acceptedAt: string;
  };
}
```

#### Error Codes
| Code | Condition                      |
|------|--------------------------------|
| 401  | Unauthorized                   |
| 402  | Payment required               |
| 403  | License not accepted           |
| 404  | Listing not found              |
| 409  | Already downloaded this version|

---

### POST /api/marketplace/listings/:id/reviews

Submit a review for a marketplace listing.

**Authentication:** Required (must have downloaded)  
**Rate Limit:** 5 req/min

#### Request Body
```typescript
interface CreateMarketplaceReviewRequest {
  rating: number;            // 1–5 (integer)
  title?: string;            // max 200 chars
  content: string;           // min 10, max 5000 chars
}
```

#### Response (201 Created)
```typescript
interface CreateMarketplaceReviewResponse {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
}
```

#### Error Codes
| Code | Condition                        |
|------|----------------------------------|
| 400  | Validation error                 |
| 401  | Unauthorized                     |
| 403  | Must download before reviewing   |
| 404  | Listing not found                |
| 409  | Already reviewed this version    |

---

### GET /api/marketplace/categories

List all marketplace categories.

**Authentication:** Optional  
**Rate Limit:** 60 req/min

#### Response (200 OK)
```typescript
interface MarketplaceCategory {
  slug: string;              // URL-friendly identifier
  name: string;              // Display name
  description: string;
  icon?: string;
  parentSlug?: string;       // for subcategories
  listingCount: number;
  order: number;             // display sort order
}

type ListCategoriesResponse = MarketplaceCategory[];
```

#### Error Codes
None (always returns, possibly empty)

---

## 9. Analytics API

### GET /api/analytics/agents/:id

Get detailed analytics for a specific agent.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Query Parameters

| Param   | Type   | Default | Description                    |
|---------|--------|---------|--------------------------------|
| period  | string | `7d`    | `24h`, `7d`, `30d`, `90d`, `1y`|
| from    | string | —       | Custom start date (ISO 8601)   |
| to      | string | —       | Custom end date (ISO 8601)     |
| groupBy | string | `day`   | `hour`, `day`, `week`, `month` |

#### Response (200 OK)
```typescript
interface AgentAnalyticsResponse {
  agentId: string;
  agentName: string;
  period: {
    from: string;
    to: string;
    groupBy: string;
  };
  summary: {
    totalExecutions: number;
    totalTokensUsed: number;
    avgTokensPerExecution: number;
    avgDurationMs: number;
    p50DurationMs: number;
    p95DurationMs: number;
    p99DurationMs: number;
    successRate: number;            // 0.0–1.0
    totalCost: number;              // in USD cents
    avgCostPerExecution: number;
  };
  timeSeries: Array<{
    timestamp: string;
    executions: number;
    tokensUsed: number;
    avgDurationMs: number;
    errors: number;
    cost: number;
  }>;
  toolsUsage: Array<{
    toolId: string;
    toolName: string;
    callCount: number;
    avgDurationMs: number;
    errorRate: number;
  }>;
  errors: Array<{
    errorType: string;
    count: number;
    percentage: number;
    lastOccurrence: string;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    executionCount: number;
  }>;
  feedback?: {
    positiveCount: number;
    negativeCount: number;
    totalFeedback: number;
    recentComments: Array<{
      rating: "positive" | "negative";
      comment?: string;
      timestamp: string;
    }>;
  };
}
```

#### Error Codes
| Code | Condition        |
|------|------------------|
| 401  | Unauthorized     |
| 404  | Agent not found  |

---

### GET /api/analytics/overview

Get high-level platform analytics for the authenticated user.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Query Parameters

| Param  | Type   | Default | Description                  |
|--------|--------|---------|------------------------------|
| period | string | `30d`   | `7d`, `30d`, `90d`, `1y`    |

#### Response (200 OK)
```typescript
interface AnalyticsOverviewResponse {
  period: {
    from: string;
    to: string;
  };
  agents: {
    total: number;
    active: number;
    createdThisPeriod: number;
    mostUsed: Array<{ id: string; name: string; executions: number }>;
  };
  teams: {
    total: number;
    activeMembers: number;
  };
  workflows: {
    total: number;
    runsThisPeriod: number;
    successRate: number;
  };
  executionMetrics: {
    totalExecutions: number;
    totalTokensUsed: number;
    totalDurationMs: number;
    totalCost: number;
    avgExecutionsPerDay: number;
    peakExecutionsDay: { date: string; count: number };
  };
  usageByModel: Array<{
    model: string;
    executions: number;
    tokensUsed: number;
    cost: number;
  }>;
  usageByHour: Array<{
    hour: number;          // 0–23
    avgExecutions: number;
  }>;
  tokensTrend: Array<{
    date: string;
    promptTokens: number;
    completionTokens: number;
  }>;
  activeUsers: number;
  plan: "free" | "pro" | "enterprise";
}
```

#### Error Codes
| Code | Condition    |
|------|--------------|
| 401  | Unauthorized |

---

### GET /api/analytics/usage

Get granular usage data with filtering.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Query Parameters

| Param    | Type   | Default | Description                       |
|----------|--------|---------|-----------------------------------|
| from     | string | —       | Start date (ISO) (required)       |
| to       | string | —       | End date (ISO) (required)         |
| groupBy  | string | `day`   | `hour`, `day`, `week`, `month`    |
| agentId  | string | —       | Filter to specific agent          |
| model    | string | —       | Filter to specific model          |
| status   | string | —       | `completed`, `failed`, `all`      |
| format   | string | `json`  | `json`, `csv`                     |

#### Response (200 OK)
```typescript
interface UsageAnalyticsResponse {
  query: {
    from: string;
    to: string;
    groupBy: string;
    filters?: Record<string, string>;
  };
  data: Array<{
    timestamp: string;
    executions: number;
    succeeded: number;
    failed: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    durationMs: number;
    cost: number;
    models?: Record<string, { executions: number; tokens: number; cost: number }>;
    agents?: Record<string, { executions: number; tokens: number }>;
  }>;
  totals: {
    executions: number;
    succeeded: number;
    failed: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    durationMs: number;
    cost: number;
  };
}
```

#### Error Codes
| Code | Condition              |
|------|------------------------|
| 400  | Missing from/to dates  |
| 401  | Unauthorized           |
| 422  | Invalid date range     |

---

### GET /api/analytics/errors

Get error analytics and breakdown.

**Authentication:** Required  
**Rate Limit:** 30 req/min

#### Query Parameters

| Param   | Type   | Default | Description                      |
|---------|--------|---------|----------------------------------|
| from    | string | —       | Start date (ISO)                 |
| to      | string | —       | End date (ISO)                   |
| agentId | string | —       | Filter by agent                  |
| type    | string | —       | `llm`, `tool`, `timeout`, `rate_limit`, `auth`, `internal` |
| page    | number | 1       | Page number                      |
| limit   | number | 20      | Max 100                          |

#### Response (200 OK)
```typescript
interface ErrorAnalyticsResponse {
  query: {
    from: string;
    to: string;
    filters?: Record<string, string>;
  };
  summary: {
    totalErrors: number;
    errorRate: number;          // percentage of total executions
    mostCommonError: string;
    errorsByCategory: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    errorsByAgent: Array<{
      agentId: string;
      agentName: string;
      count: number;
    }>;
  };
  timeSeries: Array<{
    timestamp: string;
    total: number;
    llm: number;
    tool: number;
    timeout: number;
    rateLimit: number;
    auth: number;
    internal: number;
  }>;
  recentErrors: Array<{
    id: string;
    executionId: string;
    agentId?: string;
    agentName?: string;
    workflowId?: string;
    type: string;
    code: string;
    message: string;
    stackTrace?: string;       // truncated, only for internal errors
    timestamp: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Error Codes
| Code | Condition    |
|------|--------------|
| 401  | Unauthorized |

---

## 10. WebSocket Events

**Connection Endpoint:** `wss://api.agentforge.io/v1/ws`

**Authentication:** Pass JWT as query parameter:
```
wss://api.agentforge.io/v1/ws?token=<jwt_access_token>
```

### Event Types

#### `agent:execution:{id}`

Real-time updates for agent execution.

**Subscribe:** Client sends:
```typescript
interface SubscribeAgentExecution {
  type: "subscribe";
  channel: "agent:execution:{executionId}";
}
```

**Events received:**
```typescript
interface AgentExecutionEvent {
  channel: "agent:execution:{executionId}";
  event: "status" | "token" | "tool_call" | "tool_result" | "message" | "error" | "complete";
  data: {
    executionId: string;
    // For "status" events
    status?: "pending" | "running" | "completed" | "failed" | "stopped";
    // For "token" events (streaming)
    token?: string;
    index?: number;
    // For "tool_call" events
    toolCall?: {
      toolId: string;
      toolName: string;
      input: unknown;
      callId: string;
    };
    // For "tool_result" events
    toolResult?: {
      callId: string;
      output: unknown;
      durationMs: number;
    };
    // For "message" events
    message?: ChatMessage;
    // For "error" events
    error?: {
      code: string;
      message: string;
      recoverable?: boolean;
    };
    // For "complete" events
    finalOutput?: {
      output: unknown;
      tokensUsed: { prompt: number; completion: number; total: number };
      durationMs: number;
    };
  };
  timestamp: string;
}
```

**Rate limit:** 1 connection per execution; max 5 concurrent streams per user.

---

#### `agent:message:{id}`

Receive agent messages (non-streaming, final delivery).

**Subscribe:**
```typescript
interface SubscribeAgentMessage {
  type: "subscribe";
  channel: "agent:message:{agentId}";
}
```

**Events received:**
```typescript
interface AgentMessageEvent {
  channel: "agent:message:{agentId}";
  event: "new_message" | "execution_started" | "execution_completed";
  data: {
    agentId: string;
    executionId: string;
    sessionId?: string;
    message?: ChatMessage;
    status?: string;
    timestamp: string;
  };
}
```

---

#### `team:execution:{id}`

Real-time updates for team (multi-agent) executions.

**Subscribe:**
```typescript
interface SubscribeTeamExecution {
  type: "subscribe";
  channel: "team:execution:{executionId}";
}
```

**Events received:**
```typescript
interface TeamExecutionEvent {
  channel: "team:execution:{executionId}";
  event: "agent_started" | "agent_completed" | "agent_failed" | "token" | "phase_change" | "complete";
  data: {
    teamExecutionId: string;
    // For agent-level events
    agentId?: string;
    agentName?: string;
    outputKey?: string;
    agentStatus?: string;
    // For streaming tokens
    token?: string;
    agentId?: string;
    // For phase changes
    phase?: string;          // e.g. "Planning", "Executing:Agent1", "Synthesizing"
    progress?: number;       // 0.0–1.0
    // For complete
    finalResults?: unknown;
    totalTokensUsed?: number;
    totalDurationMs?: number;
    // For errors
    error?: {
      agentId?: string;
      message: string;
    };
  };
  timestamp: string;
}
```

---

#### `notification:{userId}`

User-specific notifications.

**Subscribe:**
```typescript
interface SubscribeNotifications {
  type: "subscribe";
  channel: "notification:{userId}";
}
```

**Events received:**
```typescript
interface NotificationEvent {
  channel: "notification:{userId}";
  event: "notification";
  data: {
    id: string;            // notification ID
    type: "execution_complete" | "execution_failed" | "team_invitation"
        | "workflow_complete" | "workflow_failed" | "marketplace_review"
        | "billing" | "system" | "mention";
    title: string;
    body: string;
    actionUrl?: string;    // deep link to relevant resource
    severity: "info" | "warning" | "error";
    read: boolean;
    metadata?: Record<string, unknown>;
    createdAt: string;
  };
}
```

### WebSocket Lifecycle

| Event                | Direction   | Description                          |
|----------------------|-------------|--------------------------------------|
| `connection:established` | Server→Client | Confirms connection with `{ connectionId, userId }` |
| `subscribe`          | Client→Server | Subscribe to a channel              |
| `unsubscribe`        | Client→Server | Unsubscribe from a channel          |
| `ping`               | Client→Server | Keep-alive ping                     |
| `pong`               | Server→Client | Keep-alive pong                     |
| `error`              | Server→Client | Error notification                  |

**Heartbeat:** Client must send `ping` every 30 seconds; server disconnects after 45 seconds of inactivity.

---

## 11. Common Patterns

### Idempotency

For mutation endpoints (especially executions), clients may send an `Idempotency-Key` header:
```
Idempotency-Key: <uuid-v4>
```
The server deduplicates requests with the same key within 24 hours. Returns the original response with status code from the first request.

### Soft Deletes

Resources (agents, workflows, tools) support soft delete. They remain recoverable for 30 days via `PATCH /api/:resource/:id/restore`. After 30 days, they are permanently purged.

### Expansion

List endpoints support `?include=` to embed related resources:
```
GET /api/agents?include=tools,creator
GET /api/teams/:id?include=agents,workflows
```

### Field Selection

All GET endpoints support sparse field sets:
```
GET /api/agents/:id?fields=id,name,model,status
```

### Bulk Operations

Bulk endpoints available at:
- `POST /api/agents/batch/delete` — `{ ids: string[] }`
- `POST /api/agents/batch/update` — `{ ids: string[], data: Partial<UpdateAgentRequest> }`
- `POST /api/teams/:id/members/batch` — `{ members: Array<{ email: string; role: string }> }`

### Audit Logging

All state-changing operations are logged with:
- Actor (user ID or API key)
- Action (create, update, delete, execute)
- Resource type and ID
- Before/after state snapshots
- IP address and user-agent
- ISO timestamp

Audit logs are accessible at `GET /api/audit-logs` (Enterprise plan).

### API Versioning

The API is versioned via URL prefix: `/v1/...`.  
The version header `Accept: application/vnd.agentforge.v1+json` may be used as an alternative.  
Deprecated versions are sunset with 6 months' notice.

---

*End of API Design Document — AgentForge v1.0.0*
