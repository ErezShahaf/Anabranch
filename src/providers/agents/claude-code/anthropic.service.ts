const DEFAULT_BASE_URL = "https://api.anthropic.com";
const ANTHROPIC_VERSION = "2023-06-01";
const HEALTH_CHECK_MODEL = "claude-haiku-4-20250414";

export class AnthropicService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl = DEFAULT_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: HEALTH_CHECK_MODEL,
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
