import { getGroqModel } from "../config";
import { OpenAICompatibleProvider } from "./openai-compatible";

export class GroqProvider extends OpenAICompatibleProvider {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "Groq API key is required. Get a free key at https://console.groq.com/keys and set GROQ_API_KEY.",
      );
    }

    super({
      name: "groq",
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      defaultModel: getGroqModel(),
    });
  }
}

export function tryCreateGroqProvider(): GroqProvider | null {
  try {
    return new GroqProvider();
  } catch {
    return null;
  }
}
