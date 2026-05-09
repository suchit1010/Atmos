import Anthropic from "@anthropic-ai/sdk";

let anthropicClient: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;

  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!baseUrl) {
    throw new Error(
      "AI_INTEGRATIONS_ANTHROPIC_BASE_URL must be set. Did you forget to provision the Anthropic AI integration?",
    );
  }

  if (!apiKey) {
    throw new Error(
      "AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set. Did you forget to provision the Anthropic AI integration?",
    );
  }

  anthropicClient = new Anthropic({
    apiKey,
    baseURL: baseUrl,
  });

  return anthropicClient;
}

// For backward compatibility, export a lazy-loaded proxy
export const anthropic = new Proxy({} as Anthropic, {
  get(target, prop) {
    return (getAnthropic() as any)[prop];
  },
});
