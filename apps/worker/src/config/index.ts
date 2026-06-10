export const config = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/agentforge",
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  port: parseInt(process.env.PORT || "4000", 10),
  env: process.env.NODE_ENV || "development",
  agentQueueName: process.env.AGENT_QUEUE || "agent:executions",
  workflowQueueName: process.env.WORKFLOW_QUEUE || "workflow:executions",
};
