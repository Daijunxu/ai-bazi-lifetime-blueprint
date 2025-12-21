/**
 * OpenAI API 客户端实现
 * 支持 GPT-4o 等模型
 */

import type { LLMClient, LLMMessage, LLMCallOptions, LLMResponse } from "./llmClient";

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string; // 可选，用于支持代理或自定义端点
  model?: string; // 默认 "gpt-4o"
}

export class OpenAIClient implements LLMClient {
  private config: Required<Pick<OpenAIConfig, "apiKey" | "model">> & {
    baseURL?: string;
  };

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.config = {
      apiKey: config.apiKey,
      model: config.model || "gpt-4o",
      baseURL: config.baseURL,
    };
  }

  async call(
    messages: LLMMessage[],
    options?: LLMCallOptions
  ): Promise<LLMResponse> {
    const url = this.config.baseURL
      ? `${this.config.baseURL}/v1/chat/completions`
      : "https://api.openai.com/v1/chat/completions";

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
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(
            `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
          );
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";

        return {
          content,
          usage: data.usage
            ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
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
            `[OpenAI Client] 请求失败 (尝试 ${attempt + 1}/${maxRetries})，${waitTime}ms 后重试:`,
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
    throw lastError || new Error("OpenAI API 调用失败：未知错误");
  }
}

