export type AIMessageRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider to return strict JSON when supported. */
  jsonMode?: boolean;
  /** Append OpenAI after free Gemini→Groq→OpenRouter when OPENAI_API_KEY is set. */
  includeOpenAIPro?: boolean;
  /**
   * Skip these provider names (e.g. after a weak quiz bank) so quality retries
   * rotate Gemini → Groq → OpenRouter instead of reusing the same head.
   */
  skipProviders?: string[];
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AICompletionResult {
  content: string;
  model: string;
  provider?: string;
  usage?: AIUsage;
}

export interface AIServiceProvider {
  readonly name: string;
  complete(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResult>;
}
