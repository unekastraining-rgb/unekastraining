import OpenAI from "openai";

import type {
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIServiceProvider,
} from "../types";

function formatProviderError(provider: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("quota") || lower.includes("insufficient_quota")) {
    return new Error(`${provider} quota exceeded.`);
  }

  if (lower.includes("rate limit") || lower.includes("429")) {
    return new Error(`${provider} rate limit reached.`);
  }

  return new Error(`${provider}: ${message}`);
}

export class OpenAICompatibleProvider implements AIServiceProvider {
  readonly name: string;

  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(options: {
    name: string;
    apiKey: string;
    baseURL: string;
    defaultModel: string;
    extraHeaders?: Record<string, string>;
  }) {
    this.name = options.name;
    this.defaultModel = options.defaultModel;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      defaultHeaders: options.extraHeaders,
    });
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResult> {
    const model = options?.model ?? this.defaultModel;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        ...(options?.jsonMode
          ? { response_format: { type: "json_object" as const } }
          : {}),
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error(`${this.name} returned an empty completion.`);
      }

      return {
        content,
        model: response.model,
        provider: this.name,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      throw formatProviderError(this.name, error);
    }
  }
}
