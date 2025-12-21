/**
 * Anthropic Claude API 客户端实现
 * 支持 Claude 3.5 Sonnet 等模型
 */

import type { LLMClient, LLMMessage, LLMCallOptions, LLMResponse } from "./llmClient";

export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string; // 可选，用于支持代理或自定义端点
  model?: string; // 默认 "claude-3-5-sonnet-20241022"
}

export class AnthropicClient implements LLMClient {
  private config: Required<Pick<AnthropicConfig, "apiKey" | "model">> & {
    baseURL?: string;
  };

  constructor(config: AnthropicConfig) {
    if (!config.apiKey) {
      throw new Error("Anthropic API key is required");
    }
    this.config = {
      apiKey: config.apiKey,
      model: config.model || "claude-3-5-sonnet-20241022",
      baseURL: config.baseURL,
    };
  }

  async call(
    messages: LLMMessage[],
    options?: LLMCallOptions
  ): Promise<LLMResponse> {
    const url = this.config.baseURL
      ? `${this.config.baseURL}/v1/messages`
      : "https://api.anthropic.com/v1/messages";

    // Anthropic API 需要将 system message 单独处理
    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    // 重试机制：最多重试 3 次
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 创建 AbortController 用于超时控制（60秒）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: this.config.model,
            max_tokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.7,
            system: systemMessages.length > 0
              ? systemMessages.map((m) => m.content).join("\n\n")
              : undefined,
            messages: nonSystemMessages.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(
            `Anthropic API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
          );
        }

        const data = await response.json();
        const content = data.content?.[0]?.text || "";

        return {
          content,
          usage: data.usage
            ? {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens,
              }
            : undefined,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果是超时或网络错误，且还有重试机会，则等待后重试
        if (
          (error?.name === "AbortError" || 
           error?.code === "ECONNRESET" || 
           error?.message?.includes("fetch failed")) &&
          attempt < maxRetries - 1
        ) {
          const waitTime = (attempt + 1) * 1000; // 递增等待时间：1s, 2s, 3s
          console.warn(
            `[Anthropic Client] 请求失败 (尝试 ${attempt + 1}/${maxRetries})，${waitTime}ms 后重试:`,
            error.message
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        
        // 如果不是可重试的错误，或已用完重试次数，直接抛出
        throw error;
      }
    }

    // 如果所有重试都失败，抛出最后一个错误
    throw lastError || new Error("Anthropic API 调用失败：未知错误");
  }
}

