import OpenAI from "openai";

import { getOpenAIModel } from "../config";
import type {
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIServiceProvider,
} from "../types";

function formatProviderError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("quota") || lower.includes("insufficient_quota")) {
    return new Error(
      "OpenAI quota exceeded. Add billing at https://platform.openai.com/account/billing or switch to Gemini with AI_PROVIDER=gemini in .env",
    );
  }

  return error instanceof Error ? error : new Error(message);
}

export class OpenAIProvider implements AIServiceProvider {
  readonly name = "openai";

  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(options?: { apiKey?: string; defaultModel?: string }) {
    const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OpenAI API key is required. Set OPENAI_API_KEY in your environment.",
      );
    }

    this.client = new OpenAI({ apiKey });
    this.defaultModel = options?.defaultModel ?? getOpenAIModel();
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

      const choice = response.choices[0];
      const content = choice?.message?.content;

      if (!content) {
        throw new Error("OpenAI returned an empty completion.");
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
      throw formatProviderError(error);
    }
  }
}
