import { config } from '../config/index.js';
import { ApiError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

interface LLMRequest {
  provider: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
}

interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

interface AnthropicResponse {
  content: Array<{ text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

interface OllamaResponse {
  message: { content: string };
  prompt_eval_count: number;
  eval_count: number;
  model: string;
}

const providers: Record<string, (req: LLMRequest) => Promise<LLMResponse>> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  ollama: callOllama,
};

export const llmService = {
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const provider = providers[request.provider];
    if (!provider) {
      throw new ApiError(400, `Unsupported LLM provider: ${request.provider}`);
    }

    logger.debug('LLM request', {
      provider: request.provider,
      model: request.model,
      messagesCount: request.messages.length,
    });

    try {
      const response = await provider(request);
      logger.debug('LLM response', {
        provider: request.provider,
        model: response.model,
        contentLength: response.content.length,
      });
      return response;
    } catch (error) {
      logger.error('LLM call failed', {
        provider: request.provider,
        model: request.model,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new ApiError(502, `LLM provider error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  },

  async stream(request: LLMRequest): Promise<ReadableStream<Uint8Array>> {
    const provider = request.provider;
    if (provider !== 'openai') {
      throw new ApiError(400, 'Streaming only supported for OpenAI');
    }

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
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new ApiError(502, 'OpenAI streaming request failed');
    }

    return response.body!;
  },
};

async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llm.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      stop: request.stop,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = (await response.json()) as OpenAIResponse;

  return {
    content: data.choices[0]!.message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
    model: data.model,
  };
}

async function callAnthropic(request: LLMRequest): Promise<LLMResponse> {
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
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = (await response.json()) as AnthropicResponse;

  return {
    content: data.content[0]!.text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    },
    model: data.model,
  };
}

async function callOllama(request: LLMRequest): Promise<LLMResponse> {
  const response = await fetch(`${config.llm.ollama.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      options: {
        temperature: request.temperature ?? 0.7,
        num_predict: request.maxTokens ?? 2048,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = (await response.json()) as OllamaResponse;

  return {
    content: data.message.content,
    usage: {
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
    },
    model: data.model,
  };
}
