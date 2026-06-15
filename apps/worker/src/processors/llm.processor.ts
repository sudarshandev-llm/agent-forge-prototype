import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

interface LLMRequest {
  provider: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export const llmProcessor = {
  async complete(request: LLMRequest): Promise<LLMResponse> {
    logger.debug(`LLM call: ${request.provider}/${request.model}`);

    switch (request.provider) {
      case 'openai':
        return this.callOpenAI(request);
      case 'anthropic':
        return this.callAnthropic(request);
      case 'ollama':
        return this.callOllama(request);
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }
  },

  async callOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      model: string;
    };

    return {
      content: data.choices[0]!.message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
    };
  },

  async callAnthropic(request: LLMRequest): Promise<LLMResponse> {
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const conversationMessages = request.messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.llm.anthropic.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        messages: conversationMessages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        system: systemMessage?.content,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${err}`);
    }

    const data = (await response.json()) as {
      content: Array<{ text: string }>;
      usage: { input_tokens: number; output_tokens: number };
      model: string;
    };

    return {
      content: data.content[0]!.text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      model: data.model,
    };
  },

  async callOllama(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${config.llm.ollama.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error: ${err}`);
    }

    const data = (await response.json()) as {
      message: { content: string };
      prompt_eval_count: number;
      eval_count: number;
      model: string;
    };

    return {
      content: data.message.content,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      model: data.model,
    };
  },
};
