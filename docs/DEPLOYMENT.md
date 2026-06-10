# Deployment Guide

## Prerequisites

Ensure the following are installed and configured:

- **Node.js** 20.x or later
- **Docker** & **Docker Compose** (v2+)
- **PostgreSQL** 15+ (or use the Docker service)
- **Redis** 7+ (or use the Docker service)
- **Clerk Account** — for authentication (create at https://clerk.com)
- **OpenAI API Key** — for LLM features (https://platform.openai.com)
- **Anthropic API Key** — optional, for Claude models (https://console.anthropic.com)
- **Git** — for version control
- **pnpm** — package manager (install via `npm install -g pnpm`)

---

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-org/agentforge.git
cd agentforge

# 2. Install all dependencies
pnpm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your keys and configuration

# 4. Start infrastructure services (PostgreSQL & Redis)
docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis

# 5. Run database migrations
pnpm run db:migrate

# 6. Seed the database (optional, for demo data)
pnpm run db:seed

# 7. Start the development servers
pnpm run dev
# Web: http://localhost:3000
# API: http://localhost:4000
```

### Environment Configuration

Create a `.env` file in the project root with the following:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentforge

# Redis
REDIS_URL=redis://localhost:6379

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# API
PORT=4000
JWT_SECRET=your-secret-key

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## Docker Deployment

### Development

```bash
# Start all services with hot reload
docker compose -f infra/docker/docker-compose.dev.yml up -d

# View logs
docker compose -f infra/docker/docker-compose.dev.yml logs -f

# Stop services
docker compose -f infra/docker/docker-compose.dev.yml down

# Rebuild after dependency changes
docker compose -f infra/docker/docker-compose.dev.yml build
```

Services spin up with volume mounts for live code reload. Changes to `apps/` and `packages/` are reflected immediately.

### Production

```bash
# Build and start production services
docker compose -f infra/docker/docker-compose.prod.yml up -d --build

# Scale workers (multiple instances)
docker compose -f infra/docker/docker-compose.prod.yml up -d --scale worker=3

# Check service health
docker compose -f infra/docker/docker-compose.prod.yml ps
```

Production images use multi-stage builds for minimal size. Resource limits and restart policies are pre-configured.

---

## Production Deployment Options

### Vercel (Frontend)

1. Push your repository to GitHub.
2. Import the project at https://vercel.com/import.
3. Set the root directory to `apps/web`.
4. Configure Build Settings:
   - Framework Preset: **Next.js**
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`
5. Add Environment Variables (all `NEXT_PUBLIC_*` vars and `CLERK_SECRET_KEY`).
6. Deploy. Vercel automatically detects PR previews and production branches.
7. **Custom Domain:** Add your domain in Vercel Dashboard > Project > Domains. Configure DNS with the provided CNAME record.

### Railway (Backend API)

1. Push to GitHub and connect at https://railway.app.
2. Create a new project → Deploy from GitHub repo.
3. Add two services:
   - **api** — Start command: `pnpm run start -w apps/api`
   - **worker** — Start command: `pnpm run start -w apps/worker`
4. Attach **PostgreSQL** plugin (Railway provides connection string automatically).
5. Attach **Redis** plugin (Railway provides `REDIS_URL` automatically).
6. Set Environment Variables in Railway Dashboard → Variables.
7. Use `RAILWAY_PUBLIC_DOMAIN` for the API URL in web app env vars.

### Render (Worker)

1. Create a new **Web Service** at https://render.com.
2. Connect your GitHub repository.
3. Configure:
   - Name: `agentforge-worker`
   - Root Directory: (leave blank)
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm run start -w apps/worker`
4. Select a plan (Starter or higher for background workers).
5. Add environment variables (same as Railway worker config).
6. Set up health check path: `/health`.
7. For scaling, adjust the instance count in Render Dashboard.

### Supabase (Database)

1. Create a new project at https://supabase.com.
2. Go to **Project Settings → Database → Connection string**.
3. Copy the `URI` connection string (with password).
4. Update your `DATABASE_URL` environment variable.
5. Enable **Connection Pooling** via Supabase Dashboard (recommended for serverless).
6. Run migrations against the Supabase database:
   ```bash
   DATABASE_URL="your-supabase-connection-string" pnpm run db:migrate
   ```
7. Enable **PgBouncer** for transaction mode pooling in Supabase settings.

---

## CI/CD Pipeline

### GitHub Actions Workflow

The repository includes `.github/workflows/ci.yml` with the following stages:

```yaml
name: CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

**Pipeline Stages:**

1. **Lint** — ESLint check across all packages (`pnpm run lint`).
2. **Type Check** — TypeScript compilation check (`pnpm run typecheck`).
3. **Unit Tests** — Jest/Vitest test suite (`pnpm run test`).
4. **Build** — Production build verification (`pnpm run build`).
5. **Integration Tests** — API endpoint tests against a test database.
6. **Docker Build** — Build and verify Docker images.
7. **Deploy (main only)** — Automatic deployment to production.

**Branch Strategy:**

| Branch   | Environment | Auto-Deploy |
|----------|------------|-------------|
| `main`   | Production | Yes         |
| `develop`| Staging    | Yes         |
| `feature/*` | Preview | Via Vercel  |

### Database Migrations in CI

Migrations run as part of the deploy step. Use `prisma migrate deploy` (not `dev`) in CI:

```bash
pnpm run db:migrate:deploy
```

This ensures only applied migrations run without generating new ones.

---

## Monitoring

### Logging

- **Application logs** are output to stdout/stderr via Pino logger.
- **Structured JSON logging** is enabled in production for log aggregation.
- **Log shipping:** Configure your provider (Datadog, Logtail, Axiom) via environment variables.

Recommended log levels: `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

```env
LOG_LEVEL=info
```

### Error Tracking

- **Sentry** is integrated for error monitoring.
- Set `SENTRY_DSN` environment variable to enable.
- Source maps are uploaded on build for readable stack traces.
- Performance tracing is available for API endpoints.

```env
SENTRY_DSN=https://xxx@o123456.ingest.sentry.io/1234567
SENTRY_ENVIRONMENT=production
```

### Performance Monitoring

- **OpenTelemetry** is configured for distributed tracing.
- Export traces to Jaeger, Grafana Tempo, or your APM provider.
- Key metrics: request latency, database query times, LLM response times, queue depths.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (frontend) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (backend) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for LLM features |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (Claude models) |
| `JWT_SECRET` | Yes | Secret for signing internal JWT tokens |
| `NEXT_PUBLIC_API_URL` | Yes | Public API base URL |
| `NEXT_PUBLIC_WS_URL` | Yes | WebSocket server URL |
| `PORT` | No | API server port (default: 4000) |
| `NODE_ENV` | Yes | Application environment |
| `LOG_LEVEL` | No | Logger verbosity (default: info) |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `SENTRY_ENVIRONMENT` | No | Sentry environment tag |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OpenTelemetry collector endpoint |
| `REDIS_QUEUE_CONCURRENCY` | No | Worker concurrent job count (default: 5) |
| `UPLOAD_DIR` | No | File upload directory path |
| `MAX_FILE_SIZE_MB` | No | Max upload size in MB (default: 50) |

---

## Troubleshooting

### Database connection refused

- Ensure PostgreSQL is running: `docker ps | grep postgres`.
- Verify `DATABASE_URL` has correct host, port, and credentials.
- Check that the database exists: `createdb agentforge` if missing.
- For Supabase, enable connection pooling and use the pooler URL.

### Redis connection error

- Ensure Redis is running: `docker ps | grep redis`.
- Verify `REDIS_URL` format: `redis://host:6379`.
- Check Redis ACL if authentication is enabled.

### Next.js build fails on Vercel

- Ensure all `NEXT_PUBLIC_*` env vars are set in Vercel dashboard.
- Check that `output: 'standalone'` is configured in `next.config.js`.
- Verify `pnpm-lock.yaml` is committed to the repository.
- Ensure Node.js version is set to 20.x in Vercel project settings.

### Worker not processing jobs

- Verify worker is running: `docker logs agentforge-worker`.
- Check Redis connection from the worker container.
- Ensure queue names match between API and worker.
- Increase `REDIS_QUEUE_CONCURRENCY` if jobs are backing up.

### Docker build fails

- Ensure Docker BuildKit is enabled: `DOCKER_BUILDKIT=1`.
- Check that `.dockerignore` excludes `node_modules` and `.next`.
- Verify that all `COPY` paths in Dockerfile are correct relative to build context.
- Run `docker compose build --no-cache` to clear cached layers.

### Migration errors

- Run `pnpm run db:generate` to update Prisma client after schema changes.
- Verify the database URL points to the correct target database.
- For production, use `prisma migrate deploy`, never `prisma migrate dev`.
- To reset: `pnpm run db:reset` (drops and recreates all tables).

### CORS errors in browser

- Ensure `NEXT_PUBLIC_API_URL` matches the actual API origin.
- Check that CORS middleware allows the web app origin.
- For local development, verify ports match (3000 for web, 4000 for API).
- In production, ensure the API domain is included in CORS allowlist.
