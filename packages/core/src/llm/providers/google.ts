import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { LLMMessage, LLMResponse } from '../../types.js';
import { LLMProvider } from './base.js';

export class GoogleProvider extends LLMProvider {
  private model: GenerativeModel;
  private modelName: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-pro') {
    super();
    const genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
    this.model = genAI.getGenerativeModel({ model });
  }

  getModel(): string {
    return this.modelName;
  }

  getProvider(): string {
    return 'google';
  }

  async complete(
    messages: LLMMessage[],
    options?: Record<string, unknown>,
  ): Promise<LLMResponse> {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMessage = messages.filter((m) => m.role === 'user').pop();
    const systemPrompt = systemMessages.map((m) => m.content).join('\n');

    const chat = this.model.startChat({
      history: history.slice(0, -1) as any,
      systemInstruction: systemPrompt ? { role: 'user', parts: [{ text: systemPrompt }] } : undefined,
      generationConfig: {
        temperature: (options?.temperature as number) ?? 0.7,
        maxOutputTokens: (options?.maxTokens as number) ?? 4096,
      },
    });

    const result = await chat.sendMessage(lastMessage?.content ?? '');

    const response = result.response;
    const text = response.text();

    return {
      content: text,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: (response.usageMetadata?.promptTokenCount ?? 0) + (response.usageMetadata?.candidatesTokenCount ?? 0),
      },
      finishReason: 'stop',
    };
  }

  async *completeStream(
    messages: LLMMessage[],
    options?: Record<string, unknown>,
  ): AsyncIterable<LLMResponse> {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMessage = messages.filter((m) => m.role === 'user').pop();
    const systemPrompt = systemMessages.map((m) => m.content).join('\n');

    const chat = this.model.startChat({
      history: history.slice(0, -1) as any,
      systemInstruction: systemPrompt ? { role: 'user', parts: [{ text: systemPrompt }] } : undefined,
      generationConfig: {
        temperature: (options?.temperature as number) ?? 0.7,
        maxOutputTokens: (options?.maxTokens as number) ?? 4096,
      },
    });

    const result = await chat.sendMessageStream(lastMessage?.content ?? '');

    for await (const chunk of result.stream) {
      yield {
        content: chunk.text(),
        finishReason: undefined,
      };
    }
  }
}
