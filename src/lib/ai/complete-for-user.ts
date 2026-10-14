import { aiService } from "@/lib/ai/service";
import { getUserAppSettings } from "@/lib/settings/app-settings";
import type { AICompletionOptions, AICompletionResult, AIMessage } from "@/lib/ai/types";

/**
 * Run a completion with the user's Settings Pro toggle (OpenAI after free chain).
 */
export async function completeForUser(
  userId: string,
  messages: AIMessage[],
  options?: Omit<AICompletionOptions, "includeOpenAIPro">,
): Promise<AICompletionResult> {
  const appSettings = await getUserAppSettings(userId);
  return aiService.complete(messages, {
    ...options,
    includeOpenAIPro: appSettings.aiUseOpenAIPro,
  });
}
