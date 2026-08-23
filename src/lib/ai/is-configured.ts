export function isAIConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
      process.env.GROQ_API_KEY?.trim() ||
      process.env.OPENROUTER_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim(),
  );
}

export function listConfiguredAIProviders(): string[] {
  const providers: string[] = [];
  if (process.env.GEMINI_API_KEY?.trim()) providers.push("gemini");
  if (process.env.GROQ_API_KEY?.trim()) providers.push("groq");
  if (process.env.OPENROUTER_API_KEY?.trim()) providers.push("openrouter");
  if (process.env.OPENAI_API_KEY?.trim()) providers.push("openai");
  return providers;
}
