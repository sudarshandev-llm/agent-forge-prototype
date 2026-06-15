import 'dotenv/config';
import { getDb, closeDb } from './connection';
import { users } from './schema/users';
import { agents } from './schema/agents';
import { teams } from './schema/teams';
import { workflows } from './schema/workflows';
import { executions } from './schema/executions';
import { tools } from './schema/tool-registry';
import { marketplaceListings } from './schema/marketplace';

async function seed() {
  const db = getDb();

  // Clean existing data
  await db.delete(marketplaceListings);
  await db.delete(executions);
  await db.delete(tools);
  await db.delete(workflows);
  await db.delete(agents);
  await db.delete(teams);
  await db.delete(users);

  // ── Users ────────────────────────────────────────────────────────────────
  const [alice] = await db
    .insert(users)
    .values({
      email: 'alice@agentforge.ai',
      name: 'Alice Chen',
      clerkId: 'clerk_alice_001',
      roles: ['user', 'admin'],
    })
    .returning();

  const [bob] = await db
    .insert(users)
    .values({
      email: 'bob@agentforge.ai',
      name: 'Bob Martinez',
      clerkId: 'clerk_bob_002',
      roles: ['user'],
    })
    .returning();

  console.log(`Created users: ${alice.name}, ${bob.name}`);

  // ── Team ─────────────────────────────────────────────────────────────────
  const [devTeam] = await db
    .insert(teams)
    .values({
      name: 'Dev Team',
      description: 'Core development team building AI-powered tools',
      ownerId: alice.id,
      maxMembers: 10,
    })
    .returning();

  console.log(`Created team: ${devTeam.name}`);

  // ── Agents ───────────────────────────────────────────────────────────────
  const [codeReviewer] = await db
    .insert(agents)
    .values({
      name: 'Code Reviewer',
      description: 'Reviews pull requests for code quality, security, and best practices',
      systemPrompt:
        'You are an expert code reviewer. Analyze pull requests for bugs, security vulnerabilities, style issues, and performance problems. Provide actionable feedback.',
      model: 'gpt-4',
      provider: 'openai',
      temperature: '0.3',
      maxTokens: 4096,
      tools: ['web_search', 'code_runner'],
      role: 'reviewer',
      ownerId: alice.id,
      teamId: devTeam.id,
    })
    .returning();

  const [researchAssistant] = await db
    .insert(agents)
    .values({
      name: 'Research Assistant',
      description: 'Conducts web research and summarizes findings',
      systemPrompt:
        'You are a research assistant. Search the web, gather information, and produce comprehensive summaries with citations.',
      model: 'gpt-4',
      provider: 'openai',
      temperature: '0.7',
      maxTokens: 2048,
      tools: ['web_search'],
      role: 'executor',
      ownerId: bob.id,
    })
    .returning();

  const [bugHunter] = await db
    .insert(agents)
    .values({
      name: 'Bug Hunter',
      description: 'Automated bug detection and reproduction',
      systemPrompt:
        'You are a bug hunting specialist. Analyze code and logs to identify, reproduce, and suggest fixes for bugs.',
      model: 'claude-3-opus',
      provider: 'anthropic',
      temperature: '0.2',
      maxTokens: 8192,
      tools: ['web_search', 'code_runner', 'http_request'],
      role: 'executor',
      ownerId: alice.id,
      teamId: devTeam.id,
      isTemplate: true,
    })
    .returning();

  console.log(`Created agents: ${codeReviewer.name}, ${researchAssistant.name}, ${bugHunter.name}`);

  // ── Workflow ─────────────────────────────────────────────────────────────
  const [reviewWorkflow] = await db
    .insert(workflows)
    .values({
      name: 'PR Review Pipeline',
      description: 'Automated PR review workflow: lint → test → review → report',
      triggerType: 'webhook',
      triggerConfig: { event: 'pull_request.opened', providers: ['github'] },
      status: 'active',
      ownerId: alice.id,
      teamId: devTeam.id,
      nodes: [
        { id: 'start', type: 'trigger', label: 'PR Opened' },
        { id: 'lint', type: 'agent', agentId: codeReviewer.id, label: 'Lint Check' },
        { id: 'test', type: 'agent', agentId: bugHunter.id, label: 'Run Tests' },
        { id: 'review', type: 'agent', agentId: codeReviewer.id, label: 'Code Review' },
        { id: 'report', type: 'output', label: 'Generate Report' },
      ],
      edges: [
        { from: 'start', to: 'lint' },
        { from: 'lint', to: 'test' },
        { from: 'test', to: 'review' },
        { from: 'review', to: 'report' },
      ],
    })
    .returning();

  console.log(`Created workflow: ${reviewWorkflow.name}`);

  // ── Tools ────────────────────────────────────────────────────────────────
  const [webSearchTool] = await db
    .insert(tools)
    .values({
      name: 'web_search',
      description: 'Search the web for information using SerpAPI or similar',
      type: 'api',
      category: 'search',
      config: { provider: 'serpapi', maxResults: 10 },
      schema: {
        input: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
        output: { type: 'array', items: { type: 'object' } },
      },
      isBuiltin: true,
      isPublic: true,
    })
    .returning();

  const [codeRunnerTool] = await db
    .insert(tools)
    .values({
      name: 'code_runner',
      description: 'Execute code in a sandboxed environment',
      type: 'execution',
      category: 'development',
      config: { runtime: 'sandbox', timeout: 30000 },
      schema: {
        input: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              enum: ['python', 'javascript', 'typescript', 'go', 'rust'],
            },
            code: { type: 'string' },
          },
          required: ['language', 'code'],
        },
        output: {
          type: 'object',
          properties: {
            stdout: { type: 'string' },
            stderr: { type: 'string' },
            exitCode: { type: 'integer' },
          },
        },
      },
      isBuiltin: true,
      isPublic: true,
    })
    .returning();

  const [httpRequestTool] = await db
    .insert(tools)
    .values({
      name: 'http_request',
      description: 'Make HTTP requests to external APIs',
      type: 'api',
      category: 'general',
      config: { timeout: 10000, followRedirects: true },
      schema: {
        input: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
            url: { type: 'string' },
            headers: { type: 'object' },
            body: { type: 'string' },
          },
          required: ['method', 'url'],
        },
        output: {
          type: 'object',
          properties: {
            status: { type: 'integer' },
            body: { type: 'string' },
            headers: { type: 'object' },
          },
        },
      },
      isBuiltin: true,
      isPublic: true,
    })
    .returning();

  console.log(
    `Created tools: ${webSearchTool.name}, ${codeRunnerTool.name}, ${httpRequestTool.name}`,
  );

  // ── Marketplace ──────────────────────────────────────────────────────────
  const [listing1] = await db
    .insert(marketplaceListings)
    .values({
      name: 'Code Reviewer Pro',
      description:
        'An advanced code review agent that integrates with GitHub, GitLab, and Bitbucket. Supports 15+ programming languages with custom rule sets.',
      shortDescription: 'AI-powered code review agent with multi-platform Git integration',
      type: 'agent',
      status: 'published',
      price: '29.99',
      currency: 'USD',
      authorId: alice.id,
      sourceId: codeReviewer.id,
      sourceType: 'agent',
      category: 'development',
      tags: ['code-review', 'github', 'gitlab', 'productivity'],
      mediaUrls: ['https://marketplace.agentforge.ai/screenshots/code-reviewer-1.png'],
      documentationUrl: 'https://docs.agentforge.ai/agents/code-reviewer',
      version: '2.1.0',
      downloads: 1542,
      rating: '4.7',
      reviewCount: 89,
      publishedAt: new Date(),
    })
    .returning();

  const [listing2] = await db
    .insert(marketplaceListings)
    .values({
      name: 'PR Review Pipeline',
      description:
        'Complete automated PR review workflow that lints, tests, reviews code, and generates comprehensive reports.',
      shortDescription: 'Automated PR review pipeline with multi-stage validation',
      type: 'workflow',
      status: 'published',
      price: '0',
      currency: 'USD',
      authorId: alice.id,
      sourceId: reviewWorkflow.id,
      sourceType: 'workflow',
      category: 'ci-cd',
      tags: ['ci-cd', 'pr-review', 'automation', 'free'],
      version: '1.0.0',
      downloads: 876,
      rating: '4.5',
      reviewCount: 34,
      publishedAt: new Date(),
    })
    .returning();

  console.log(`Created marketplace listings: ${listing1.name}, ${listing2.name}`);

  // ── Executions ───────────────────────────────────────────────────────────
  const [exec1] = await db
    .insert(executions)
    .values({
      type: 'agent',
      status: 'success',
      trigger: 'manual',
      input: { repo: 'agentforge/agentforge', pr: 42, files: ['src/core/runner.ts'] },
      output: {
        summary: 'Found 3 minor issues, 1 security concern',
        issues: [
          {
            severity: 'high',
            file: 'src/core/runner.ts',
            line: 156,
            message: 'SQL injection vulnerability',
          },
          { severity: 'low', file: 'src/core/runner.ts', line: 89, message: 'Unused import' },
        ],
      },
      duration: 12450,
      tokenUsage: { prompt: 4521, completion: 1234, total: 5755 },
      cost: '0.115',
      ownerId: alice.id,
      agentId: codeReviewer.id,
      steps: [
        { name: 'fetch_pr', status: 'success', duration: 1200 },
        { name: 'analyze_code', status: 'success', duration: 8900 },
        { name: 'generate_report', status: 'success', duration: 2350 },
      ],
      startedAt: new Date(Date.now() - 12000),
      completedAt: new Date(),
    })
    .returning();

  const [exec2] = await db
    .insert(executions)
    .values({
      type: 'agent',
      status: 'failed',
      trigger: 'webhook',
      input: { repo: 'agentforge/cli', pr: 7, files: ['src/commands/deploy.ts'] },
      output: null,
      error: 'Rate limit exceeded when calling GitHub API. Retry after 60 seconds.',
      duration: 3200,
      tokenUsage: { prompt: 890, completion: 234, total: 1124 },
      cost: '0.022',
      ownerId: alice.id,
      agentId: codeReviewer.id,
      steps: [
        { name: 'fetch_pr', status: 'success', duration: 800 },
        { name: 'analyze_code', status: 'failed', duration: 2400, error: 'Rate limit exceeded' },
      ],
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(Date.now() - 56800),
    })
    .returning();

  const [exec3] = await db
    .insert(executions)
    .values({
      type: 'workflow',
      status: 'running',
      trigger: 'webhook',
      input: {
        repo: 'agentforge/agentforge',
        pr: 43,
        event: 'pull_request.synchronize',
      },
      output: null,
      ownerId: alice.id,
      workflowId: reviewWorkflow.id,
      steps: [{ name: 'lint', status: 'running', duration: 1500 }],
      startedAt: new Date(Date.now() - 1500),
    })
    .returning();

  console.log(
    `Created executions: ${exec1.id.slice(0, 8)}..., ${exec2.id.slice(0, 8)}..., ${exec3.id.slice(0, 8)}...`,
  );

  console.log('\n✅ Seed complete!');
  await closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
