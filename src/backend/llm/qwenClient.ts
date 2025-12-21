/**
 * Qwen (通义千问) API 客户端实现
 * 支持阿里云 Qwen 模型
 */

import type { LLMClient, LLMMessage, LLMCallOptions, LLMResponse } from "./llmClient";

export interface QwenConfig {
  apiKey: string;
  baseURL?: string; // 可选，用于支持代理或自定义端点
  model?: string; // 默认 "qwen-turbo"
}

export class QwenClient implements LLMClient {
  private config: Required<Pick<QwenConfig, "apiKey" | "model">> & {
    baseURL?: string;
  };

  constructor(config: QwenConfig) {
    if (!config.apiKey) {
      throw new Error("Qwen API key is required");
    }
    this.config = {
      apiKey: config.apiKey,
      model: config.model || "qwen-turbo",
      baseURL: config.baseURL,
    };
  }

  async call(
    messages: LLMMessage[],
    options?: LLMCallOptions
  ): Promise<LLMResponse> {
    // Qwen API 通常使用阿里云 DashScope，端点为 https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
    // 但也可以使用兼容 OpenAI 格式的端点
    const url = this.config.baseURL
      ? `${this.config.baseURL}/v1/chat/completions`
      : "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

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
            `Qwen API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
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
            `[Qwen Client] 请求失败 (尝试 ${attempt + 1}/${maxRetries})，${waitTime}ms 后重试:`,
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
    throw lastError || new Error("Qwen API 调用失败：未知错误");
  }
}

