import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiModel } from "../config";
import type {
  AICompletionOptions,
  AICompletionResult,
  AIMessage,
  AIServiceProvider,
} from "../types";

function formatProviderError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("no longer available") ||
    (lower.includes("not found") && lower.includes("model"))
  ) {
    return new Error(
      `Gemini model unavailable. Set GEMINI_MODEL=gemini-3.6-flash in .env (current default). See https://ai.google.dev/gemini-api/docs/models`,
    );
  }

  if (lower.includes("quota") || lower.includes("resource exhausted")) {
    return new Error(
      "Gemini free tier quota exceeded. Wait a bit and try again, or check usage at https://aistudio.google.com/",
    );
  }

  if (lower.includes("api key") || lower.includes("invalid")) {
    return new Error(
      "Invalid Gemini API key. Get a free key at https://aistudio.google.com/apikey and set GEMINI_API_KEY in .env",
    );
  }

  return error instanceof Error ? error : new Error(message);
}

function toGeminiRole(
  role: AIMessage["role"],
): "user" | "model" | null {
  if (role === "assistant") return "model";
  if (role === "user") return "user";
  return null;
}

function normalizeGeminiHistory(messages: AIMessage[]) {
  const normalized: Array<{ role: "user" | "model"; parts: [{ text: string }] }> =
    [];

  for (const message of messages) {
    const role = toGeminiRole(message.role);
    if (!role) continue;

    const last = normalized[normalized.length - 1];
    if (last?.role === role) {
      last.parts[0].text = `${last.parts[0].text}\n\n${message.content}`;
      continue;
    }

    normalized.push({ role, parts: [{ text: message.content }] });
  }

  while (normalized.length > 0 && normalized[0]!.role === "model") {
    normalized.shift();
  }

  while (normalized.length > 0 && normalized[normalized.length - 1]!.role === "user") {
    normalized.pop();
  }

  return normalized;
}

export class GeminiProvider implements AIServiceProvider {
  readonly name = "gemini";

  private readonly client: GoogleGenerativeAI;
  private readonly defaultModel: string;

  constructor(options?: { apiKey?: string; defaultModel?: string }) {
    const apiKey = options?.apiKey ?? process.env.GEMINI_API_KEY;

    if (!apiKey?.trim()) {
      throw new Error(
        "Gemini API key is required. Set GEMINI_API_KEY in your .env file. Get a free key at https://aistudio.google.com/apikey",
      );
    }

    this.client = new GoogleGenerativeAI(apiKey.trim());
    this.defaultModel = options?.defaultModel ?? getGeminiModel();
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResult> {
    const modelName = options?.model ?? this.defaultModel;
    const systemInstruction = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");

    const conversation = messages.filter((message) => message.role !== "system");

    if (conversation.length === 0) {
      throw new Error("At least one non-system message is required.");
    }

    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction || undefined,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        ...(options?.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    });

    try {
      if (conversation.length === 1) {
        const only = conversation[0]!;
        const result = await model.generateContent(only.content);
        const content = result.response.text();

        if (!content) {
          throw new Error("Gemini returned an empty completion.");
        }

        return {
          content,
          model: modelName,
          provider: this.name,
          usage: toUsage(result.response.usageMetadata),
        };
      }

      const last = conversation[conversation.length - 1]!;

      if (last.role !== "user") {
        const transcript = conversation
          .map((message) => `${message.role}: ${message.content}`)
          .join("\n\n");
        const result = await model.generateContent(transcript);
        const content = result.response.text();

        if (!content) {
          throw new Error("Gemini returned an empty completion.");
        }

        return {
          content,
          model: modelName,
          provider: this.name,
          usage: toUsage(result.response.usageMetadata),
        };
      }

      const history = normalizeGeminiHistory(conversation.slice(0, -1));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(last.content);
      const content = result.response.text();

      if (!content) {
        throw new Error("Gemini returned an empty completion.");
      }

      return {
        content,
        model: modelName,
        provider: this.name,
        usage: toUsage(result.response.usageMetadata),
      };
    } catch (error) {
      throw formatProviderError(error);
    }
  }

  async completeWithImage(
    prompt: string,
    imageBase64: string,
    mimeType: string,
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.defaultModel,
    });

    try {
      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
      ]);

      const content = result.response.text()?.trim();

      if (!content) {
        throw new Error("Could not extract text from the uploaded image.");
      }

      return content;
    } catch (error) {
      throw formatProviderError(error);
    }
  }
}

function toUsage(
  usage:
    | {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      }
    | undefined,
) {
  if (!usage) return undefined;

  const promptTokens = usage.promptTokenCount ?? 0;
  const completionTokens = usage.candidatesTokenCount ?? 0;

  return {
    promptTokens,
    completionTokens,
    totalTokens: usage.totalTokenCount ?? promptTokens + completionTokens,
  };
}
