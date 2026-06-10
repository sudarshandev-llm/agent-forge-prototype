import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  database: { url: process.env.DATABASE_URL || '' },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  queue: { prefix: process.env.QUEUE_PREFIX || 'agentforge' },
  logging: { level: process.env.LOG_LEVEL || 'info' },
  llm: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    ollama: { baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' },
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@agentforge.ai',
  },
  sentry: { dsn: process.env.SENTRY_DSN },
};
