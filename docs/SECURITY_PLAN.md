# Security Plan — AgentForge

> **Version:** 1.0  
> **Scope:** AgentForge platform — including API, SDK, LLM gateway, dashboard, and supporting infrastructure.  
> **Classification:** Internal — Not for external distribution.

---

## 1. Security Principles

| Principle                   | Application                                                                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Least Privilege**         | Every service, container, and human actor receives only the permissions required to perform its function. No standing admin access to production.   |
| **Defense in Depth**        | Multiple overlapping security controls at every layer: network, application, data, and identity. Failure of one control does not expose the system. |
| **Secure by Default**       | All features ship with the most restrictive posture. Opt-in for less secure configurations. No secrets in code.                                     |
| **Fail Secure**             | If a component fails (auth service, rate limiter, database), the system denies access by default rather than allowing unauthenticated passthrough.  |
| **Separation of Duties**    | No single person can deploy code, approve a change, and access production data. Code review + deploy approval required.                             |
| **Zero Trust**              | No implicit trust for any request, regardless of network origin. Every request is authenticated, authorized, and validated.                         |
| **Continuous Verification** | Security controls are validated in CI/CD pipelines and monitored at runtime. Compliance is automated where possible.                                |

---

## 2. Authentication & Authorization

### 2.1 Clerk / Auth.js Integration

- AgentForge uses **Clerk** as the primary authentication provider for the dashboard, with **Auth.js** as a secondary provider for self-hosted deployments.
- All authentication flows occur over HTTPS-only endpoints.
- Session tokens are short-lived (15 minutes for access, 7 days for refresh) and rotated on privilege escalation.
- Webhook endpoints from Clerk are verified using `svix` signature verification before processing.

### 2.2 JWT Tokens

- Tokens are signed with RS256 (asymmetric) using a key pair generated at deployment time.
- The public key is exposed via a well-known JWKS endpoint; the private key is stored in the secrets manager and **never** logged.
- Token payload includes:
  - `sub` — user or agent ID
  - `org_id` —tentant/workspace scope
  - `roles` —array of assigned roles
  - `iat` / `exp` —issued-at and expiry
- Token validation rejects expired tokens, malformed signatures, and tokens without a valid issuer (`iss`) claim.

### 2.3 API Key Management

| Concern    | Mechanism                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| Generation | `crypto.randomBytes(32)` → base64url-encoded, prefixed with `af_`             |
| Storage    | bcrypt hash (cost factor 12) — only the hash is stored                        |
| Rotation   | Keys expire every 90 days; a 7-day grace period allows overlapping keys       |
| Revocation | Immediate invalidation via a deny-list in Redis with 5-second TTL propagation |
| Scoping    | Each key is bound to exactly one organization and one role set                |

### 2.4 Role-Based Access Control (RBAC)

| Role        | Scope        | Permissions                                                           |
| ----------- | ------------ | --------------------------------------------------------------------- |
| `admin`     | Organization | Full CRUD on agents, API keys, billing, team members                  |
| `developer` | Organization | Create/edit agents, view logs, manage own keys                        |
| `viewer`    | Organization | Read-only access to agents, dashboards, and logs                      |
| `agent`     | Agent-level  | Execute the assigned agent's workflow (used for agent-to-agent calls) |

- RBAC is enforced at the API gateway via a middleware that decodes the JWT, resolves the role, and checks the requested resource against a Casbin policy file.
- Deny rules override allow rules.
- All RBAC decisions are logged to the audit trail.

---

## 3. Data Security

### 3.1 Encryption at Rest (AES-256)

- All persistent volumes use **AES-256-XTS** block-level encryption.
- Database tables containing PII or credentials are additionally encrypted at the column level using **AES-256-GCM** with a per-row nonce.
- Encryption keys are stored in the secrets manager (HashiCorp Vault or AWS KMS), separate from the data.

### 3.2 Encryption in Transit (TLS 1.3)

- All external and inter-service communication enforces **TLS 1.3** with a minimum cipher suite of `TLS_AES_256_GCM_SHA384`.
- mTLS is used for service-to-service communication within the mesh.
- Certificates are auto-issued by a private CA (cert-manager) and rotated every 30 days.
- HTTP Strict Transport Security (HSTS) is enabled with `max-age=63072000; includeSubDomains; preload`.

### 3.3 Database Encryption (pgcrypto)

- PostgreSQL extensions `pgcrypto` and `pgsodium` are enabled.
- Sensitive columns (email, API key hashes, PII) use `pgp_sym_encrypt` / `pgp_sym_decrypt` with a key stored in Vault and pulled at connection time.
- The database cluster uses **TDE (Transparent Data Encryption)** at the filesystem level as a second layer.
- All backups are encrypted with a separate backup key before leaving the storage volume.

### 3.4 PII Handling

| Data Type             | Classification   | Treatment                                                                 |
| --------------------- | ---------------- | ------------------------------------------------------------------------- |
| Email address         | PII              | Encrypted at rest, masked in logs, never exposed in API responses         |
| IP address            | PII              | Anonymised after 30 days (last octet zeroed)                              |
| API Keys              | Secret           | Hashed before storage, masked in UI (`af_•••••abc`)                       |
| Agent prompts/outputs | Customer Content | Encrypted at rest, never used for model training, deleted on org deletion |
| Billing info          | PCI (via Stripe) | Never touches our servers — tokenized client-side by Stripe               |

- Data Retention Policy: Logs containing PII are purged after 90 days. Customer content is retained until org deletion or a maximum of 365 days after last activity.
- Data Subject Access Requests (DSARs) can be fulfilled via an admin API endpoint within 30 days.

---

## 4. API Security

### 4.1 Rate Limiting

| Layer                       | Limit              | Backend                |
| --------------------------- | ------------------ | ---------------------- |
| Global (per IP)             | 100 req/s          | Envoy + Redis          |
| Authenticated (per API key) | 1 000 req/min      | Envoy + Redis          |
| Agent execution (per agent) | 10 concurrent runs | Application middleware |
| LLM inference (per key)     | 50 req/min         | Application middleware |
| Auth endpoints (per IP)     | 10 req/min         | Cloudflare WAF         |

- Rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) are returned on every response.
- Burst allowance of 20 % above the limit before hard rejection with `429 Too Many Requests`.

### 4.2 CORS Configuration

- Allowed origins are explicitly whitelisted per environment (no `*` in production).
- Preflight requests (`OPTIONS`) are cached for 10 minutes.
- Credentials are only sent to origins matching the deployed dashboard domain.
- Custom headers are restricted to `Content-Type`, `Authorization`, and `X-Request-Id`.

### 4.3 Input Validation

- Every API endpoint validates input against a **JSON Schema** (using `ajv`) before the request reaches business logic.
- String length limits: 5 000 characters for prompt fields, 255 for names, 2 000 for descriptions.
- Numeric fields are range-checked.
- Unknown/additional properties are rejected by default (`additionalProperties: false`).
- File uploads are restricted to 10 MB, scanned for malware, and only accepted for allowed MIME types.

### 4.4 SQL Injection Prevention

- All database queries use parameterised statements via Drizzle ORM. Raw SQL is prohibited in application code.
- The ORM's query builder auto-escapes parameters.
- Database users have the minimum required privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE` on specific tables) — no `DROP` or `CREATE` from the application user.
- A pre-commit hook runs `sqlmap`-style static analysis on any `.sql` files.

### 4.5 XSS Prevention

- All user-generated content is sanitised with DOMPurify (or equivalent server-side sanitizer) before storage.
- The API returns `Content-Type: application/json` — no HTML is ever served from API endpoints.
- CSP headers are set on the dashboard:
  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  object-src 'none'; frame-ancestors 'none'
  ```
- Output encoding is handled by the front-end framework (React/Next.js) — dangerouslySetInnerHTML is banned via ESLint.

### 4.6 CSRF Protection

- Dashboard endpoints use **SameSite=Strict** cookies for session tokens.
- State-changing API requests require a CSRF token delivered via a separate `X-CSRF-Token` header.
- Cookie-based authentication is available only from the first-party dashboard domain.

---

## 5. LLM Security

### 5.1 Prompt Injection Prevention

- User-provided prompts are wrapped in a **system prompt delimiter** that is resistant to injection:

  ```
  === SYSTEM BOUNDARY — DO NOT MODIFY ===
  [system instructions]
  === USER INPUT START ===
  {user_prompt}
  === USER INPUT END ===
  ```

- Input is scanned against a blocklist of known injection patterns (e.g., "ignore previous instructions", "DAN", "you are now").
- The LLM gateway runs a **classifier model** (fine-tuned for injection detection) on every user prompt before forwarding to the model. High-confidence injections are rejected with a `400` response.
- Agent output is never directly concatenated into a system prompt of another agent without sanitization.

### 5.2 Output Sanitization

- Model outputs are scanned for:
  - **Prompts leaking** — regular expressions matching prompt structure
  - **PII exfiltration** — email, phone, SSN patterns (redacted with `[REDACTED]`)
  - **Code execution commands** — shell syntax, SQL statements
  - **Excessive verbosity** — outputs over 100 000 characters are truncated
- Sanitized outputs are logged for post-hoc analysis but **not** stored long-term.

### 5.3 Content Filtering

- All model inputs and outputs are passed through a **content moderation API** (OpenAI Moderation or Azure Content Safety).
- Categories monitored: hate, harassment, self-harm, sexual, violence.
- Violating content is blocked, logged, and optionally reported to the org admin.
- Self-hosted deployments may configure custom blocklist categories.

### 5.4 Rate Limiting for LLM Calls

| Dimension          | Limit                     | Granularity            |
| ------------------ | ------------------------- | ---------------------- |
| Per agent          | 50 calls / min            | Rolling window         |
| Per organization   | 5 000 calls / hour        | Rolling window         |
| Per model (pooled) | Configurable by plan tier | Static quota per month |
| Concurrent         | 20 per deployment         | Application + DB lock  |

- Exceeded limits return `429 Too Many Requests` with a `Retry-After` header.
- Limits are enforced at the API gateway before the request reaches the LLM provider.

---

## 6. Infrastructure Security

### 6.1 Docker Container Security

- Base images are **distroless** (Google distroless or Chainguard) — no shell, no package manager, no `apt`.
- Images are scanned by **Trivy** in CI — any `CRITICAL` or `HIGH` severity CVE blocks the build.
- Containers run as **non-root** user (`uid: 10001`) with `readOnlyRootFilesystem: true`.
- `RUN --no-cache` is used for all package installs; no layer leaks secrets.
- Images are signed with **cosign** and verified at deploy time.

### 6.2 Kubernetes Pod Security

- **Pod Security Admission** (PSA) enforces the `restricted` profile cluster-wide.
- `securityContext` is mandatory on every pod:
  ```yaml
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    capabilities:
      drop: ['ALL']
    allowPrivilegeEscalation: false
    seccompProfile:
      type: RuntimeDefault
  ```
- `NetworkPolicy` resources enforce a default-deny ingress/egress model.
- `PodDisruptionBudget` ensures at least 2 replicas are always available.
- Resource limits (`requests`/`limits`) are required to prevent noisy-neighbour issues.

### 6.3 Network Policies

| Rule                          | Policy                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| Default ingress               | Deny all                                                       |
| Default egress                | Deny all (except DNS on UDP 53)                                |
| Allow from ingress controller | Port 8080, namespace `ingress-nginx`                           |
| Allow to database             | Only from `api` and `migration` pods, port 5432, TCP           |
| Allow to Redis                | Only from `api` and `worker` pods, port 6379, TCP              |
| Allow to LLM providers        | Egress to known provider CIDR ranges (OpenAI, Anthropic, etc.) |
| Allow metrics scrape          | Port 9090 from `monitoring` namespace                          |

- All policies are stored in Git and applied via CI/CD — no ad-hoc changes.

### 6.4 Secrets Management

- Secrets are stored in **HashiCorp Vault** (cloud) or **Kubernetes External Secrets Operator** + AWS Secrets Manager (self-hosted).
- Secrets are injected as volume mounts or environment variables — never in the image.
- Secret rotation is automated:
  - Database passwords: every 90 days
  - JWT signing keys: every 30 days (with overlap)
  - LLM API keys: every 90 days
- Access to Vault/Secrets Manager is audited and requires MFA.

---

## 7. Compliance

### 7.1 SOC 2 Considerations

- AgentForge is designed to meet SOC 2 Type II criteria for **Security**, **Availability**, and **Confidentiality**.
- Controls mapped to SOC 2 criteria:
  - **CC6.1** — Logical and physical access controls
  - **CC6.6** — Encryption of data in transit
  - **CC6.7** — Encryption of data at rest
  - **CC7.1** — Monitoring of security events
  - **CC7.2** — Incident response procedures
- A SOC 2 audit is conducted annually by an independent CPA firm.

### 7.2 GDPR Compliance

- Data Processing Agreement (DPA) is signed with all customers processing EU resident data.
- Data is stored in **eu-central-1** (Frankfurt) for EU customers by default.
- Data Subject Rights:
  - **Right to Access** — Self-service export in dashboard
  - **Right to Erasure** — Org deletion or DSAR API endpoint
  - **Right to Data Portability** — JSON export available
  - **Right to Object** — Opt-out of analytics and model training
- Data Protection Impact Assessment (DPIA) is performed before any new data-processing feature is released.
- A Data Protection Officer (DPO) is appointed and reachable at dpo@agentforge.io.

### 7.3 Data Retention Policies

| Data Type                 | Retention                          | Deletion Method                         |
| ------------------------- | ---------------------------------- | --------------------------------------- |
| Application logs          | 90 days                            | Automated purge (CronJob)               |
| Audit logs                | 365 days                           | Cold storage (S3 Glacier) then deletion |
| Agent execution history   | 90 days (extendable per org)       | Soft delete → hard delete after 30 days |
| User accounts             | Until org deletion + 30 days grace | Hard delete                             |
| LLM prompt/output content | 30 days                            | Hard delete                             |
| Billing records           | 7 years (legal requirement)        | Encrypted archive                       |

### 7.4 Audit Logging

- Every state-changing operation is logged to the audit trail:
  - Who (user ID, API key ID, agent ID)
  - What (action, resource, payload hash)
  - When (RFC 3339 timestamp)
  - Where (source IP, user-agent)
  - Result (success / failure + error code)
- Audit logs are append-only, written to a separate database instance, and can only be queried (not modified or deleted) by the `admin` role.
- Logs are shipped to **Splunk** or **Grafana Loki** for real-time alerting.

---

## 8. Incident Response Plan

### 8.1 Detection

| Source                 | Tools                                               |
| ---------------------- | --------------------------------------------------- |
| Application errors     | Sentry + PagerDuty alerts; error rate spikes > 5 %  |
| Security events        | Falco (runtime security) + OSSEC (host IDS)         |
| Anomalous API usage    | Custom Prometheus rules (e.g., 10× normal 401 rate) |
| Infrastructure metrics | Grafana on-call; CPU/memory/disk anomalies          |
| External reports       | security@agentforge.io inbox; Bug Bounty platform   |

### 8.2 Containment

| Triage Severity                                    | Response Time | Actions                                                                  |
| -------------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| **SEV-1** (data breach, service down)              | ≤ 15 minutes  | Isolate affected service, revoke keys, rotate secrets, block IPs via WAF |
| **SEV-2** (degradation, suspicious activity)       | ≤ 1 hour      | Throttle endpoint, increase logging, engage on-call engineer             |
| **SEV-3** (minor vulnerability, best practice gap) | ≤ 1 week      | Patch in next release cycle                                              |

1. Identify the affected component and disconnect it from the mesh (Kubernetes network policy deny-all).
2. Snapshot logs, traffic captures, and pod state.
3. Communicate status to stakeholders (status page + internal slack).
4. Escalate to DPO if PII is involved.

### 8.3 Eradication

1. Root cause analysis (RCA) is performed within 72 hours.
2. AWS/GitHub/Cloudflare keys are rotated immediately.
3. A hotfix or patch is deployed following the standard CI/CD pipeline (with expedited review).
4. Affected users are notified per the SLA (SEV-1: within 24 hours).

### 8.4 Recovery

1. Service is restored from the last known-good backup (verified backup restore test run weekly).
2. Traffic is gradually ramped (10 % → 50 % → 100 %) over 10 minutes while monitoring error rates.
3. Post-mortem is published internally within 5 business days.
4. Action items from the post-mortem are tracked as GitHub issues with assigned owners and due dates.

---

## 9. Security Checklist — Deployment Readiness

Before promoting any build to production, verify all items:

### Application

- [ ] No secrets, API keys, or tokens in the codebase (confirmed by `git secrets` / truffleHog scan)
- [ ] Dependency scan (npm audit / pip-audit / trivy fs) passes with zero CRITICAL/HIGH
- [ ] Static analysis (ESLint security plugin, Semgrep rules) passes
- [ ] Unit + integration tests pass (including security regression tests)
- [ ] Input validation schemas are present for every new endpoint
- [ ] CSP headers are correctly set
- [ ] CSRF protection enabled on all state-changing dashboard endpoints

### Infrastructure

- [ ] Docker image scan (Trivy) passes
- [ ] Kubernetes manifests pass `kube-score` and `polaris` audits
- [ ] Network policies are updated to include any new service
- [ ] Secrets are in Vault / Secrets Manager (not ConfigMaps or env vars)
- [ ] Pod security contexts are correctly set
- [ ] Resource limits are configured
- [ ] Backup retention policy is applied to new volumes

### Network

- [ ] TLS 1.3 enforced; TLS 1.0/1.1 disabled
- [ ] CORS restricted to known origins
- [ ] Rate limiting configured and tested with `k6` load test
- [ ] WAF rules are active (Cloudflare / AWS WAF)
- [ ] DDoS protection enabled

### Monitoring

- [ ] New endpoints are instrumented with metrics (request rate, error rate, latency)
- [ ] Audit logging is confirmed for new resources
- [ ] Alert thresholds are configured in PagerDuty / Grafana
- [ ] Dashboard has a working health-check endpoint (`/healthz`, `/readyz`)

### People

- [ ] Code reviewed and approved by a different team member
- [ ] Deploy approved by the security lead (for production)
- [ ] Release notes published with a security-relevant changes section

---

## 10. Bug Bounty Program

AgentForge runs a **paid bug bounty program** to encourage responsible disclosure.

### Scope

- The main AgentForge web application (app.agentforge.io)
- Public API endpoints (api.agentforge.io)
- The LLM Gateway service
- Supported SDKs and CLI tools
- `opencode.json` configuration processing

**Out of scope:** Third-party services (Clerk, Stripe, OpenAI), physical security, social engineering, denial-of-service attacks, self-hosted instances.

### Rewards

| Severity                                         | Reward           |
| ------------------------------------------------ | ---------------- |
| Critical (RCE, auth bypass, data exfiltration)   | $5 000 – $15 000 |
| High (SQL injection, privilege escalation)       | $2 000 – $5 000  |
| Medium (XSS, CSRF on sensitive actions)          | $500 – $2 000    |
| Low (info leak, missing headers, fingerprinting) | $100 – $500      |

- Rewards are paid in USD via Stripe or bank transfer.
- Duplicate reports are not rewarded (first reporter receives the bounty).

### Rules

- **No testing on production without prior written consent.** A staging environment is provided.
- Do not modify or destroy production data.
- Do not use automated vulnerability scanners without permission.
- Provide a clear, reproducible proof of concept.
- Disclosure embargo: 90 days from the date of fix.

### Disclosure Process

1. Report to **security@agentforge.io** with the subject line `[BUG BOUNTY] <summary>`.
2. Use the provided PGP key (`FINGERPRINT: A1B2 C3D4 E5F6 7890`) to encrypt the report.
3. Expect an acknowledgement within **24 hours** and a triage result within **72 hours**.
4. Once fixed, the reporter is credited in the release notes (if desired) and the bounty is paid.

---

## Appendix A — Security Contacts

| Role                    | Contact                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| Security Team           | security@agentforge.io                                               |
| Data Protection Officer | dpo@agentforge.io                                                    |
| Bug Bounty              | Same as security@ — prefix subject with `[BUG BOUNTY]`               |
| Emergency (SEV-1)       | On-call rotation via PagerDuty (contact from security@agentforge.io) |

---

## Appendix B — Review Cadence

| Document               | Owner                | Review Cycle                                   |
| ---------------------- | -------------------- | ---------------------------------------------- |
| Security Plan          | CISO / Security Lead | Quarterly                                      |
| Incident Response Plan | Security Team        | Quarterly + after every drill or real incident |
| Data Retention Policy  | DPO                  | Annually                                       |
| SOC 2 Controls         | Compliance Team      | Annually (during audit)                        |
| Bug Bounty Tiers       | Product + Security   | Bi-annually                                    |
| Dependency whitelist   | Engineering          | Monthly (automated via Renovate + advisory DB) |

---

_This document is maintained by the AgentForge Security Team. Suggestions and improvements are welcome via pull request or email to security@agentforge.io._
