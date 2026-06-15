# Changelog

## [1.0.0] - 2026-06-10

### Added

- Initial release of AgentForge AI Agent Development Platform
- Core Agent Engine with ReAct loop (think → act → observe), streaming, retry logic
- Multi-LLM provider support (OpenAI, Anthropic, Google, Groq)
- Agent memory system (conversation sliding window + pgvector long-term)
- Tool registry with built-in tools (web_search, code_runner, http_request)
- Agent teams with leader/researcher/executor/reviewer roles
- Visual workflow builder
- Agent marketplace
- Next.js 15 web application with 18 pages
- Express API with 7 controllers and 12 services
- BullMQ worker for async processing
- PostgreSQL database with Drizzle ORM (13 tables)
- tRPC API layer with Zod validation
- Docker development and production setup
- GitHub Actions CI/CD pipeline
- Comprehensive test suite (vitest + Playwright)
- Architecture diagrams and branding assets
- Open source documentation (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
