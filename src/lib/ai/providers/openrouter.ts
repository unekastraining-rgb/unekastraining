import { getOpenRouterModel } from "../config";
import { OpenAICompatibleProvider } from "./openai-compatible";

export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key is required. Get a free key at https://openrouter.ai/settings/keys and set OPENROUTER_API_KEY.",
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

    super({
      name: "openrouter",
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultModel: getOpenRouterModel(),
      extraHeaders: {
        "HTTP-Referer": appUrl,
        "X-Title": "Study Haul",
      },
    });
  }
}

export function tryCreateOpenRouterProvider(): OpenRouterProvider | null {
  try {
    return new OpenRouterProvider();
  } catch {
    return null;
  }
}
