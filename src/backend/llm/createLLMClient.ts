/**
 * LLM 客户端工厂函数
 * 根据环境变量自动创建合适的 LLM 客户端
 */

import { MockLLMClient } from "./llmClient";
import { OpenAIClient } from "./openAIClient";
import { AnthropicClient } from "./anthropicClient";
import { DeepSeekClient } from "./deepseekClient";
import { QwenClient } from "./qwenClient";
import type { LLMClient } from "./llmClient";

export type LLMProvider = "openai" | "anthropic" | "deepseek" | "qwen" | "mock";

export interface LLMClientConfig {
  provider?: LLMProvider;
  openaiApiKey?: string;
  openaiBaseURL?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicBaseURL?: string;
  anthropicModel?: string;
  deepseekApiKey?: string;
  deepseekBaseURL?: string;
  deepseekModel?: string;
  qwenApiKey?: string;
  qwenBaseURL?: string;
  qwenModel?: string;
}

/**
 * 创建 LLM 客户端
 * 优先级：环境变量 > 配置参数 > Mock
 */
export function createLLMClient(config?: LLMClientConfig): LLMClient {
  // 从环境变量读取配置
  const provider =
    config?.provider ||
    (process.env.LLM_PROVIDER as LLMProvider) ||
    "mock";

  // 调试日志（仅在开发环境）
  if (process.env.NODE_ENV === "development") {
    console.log("[LLM Client] Provider:", provider);
    console.log("[LLM Client] OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
    console.log("[LLM Client] ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY);
    console.log("[LLM Client] DEEPSEEK_API_KEY exists:", !!process.env.DEEPSEEK_API_KEY);
    console.log("[LLM Client] QWEN_API_KEY exists:", !!process.env.QWEN_API_KEY);
  }

  // OpenAI
  if (provider === "openai") {
    const apiKey = config?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        "OpenAI provider selected but OPENAI_API_KEY not found, falling back to MockLLMClient"
      );
      return new MockLLMClient();
    }
    try {
      return new OpenAIClient({
        apiKey,
        baseURL: config?.openaiBaseURL || process.env.OPENAI_BASE_URL,
        model: config?.openaiModel || process.env.OPENAI_MODEL || "gpt-4o",
      });
    } catch (error) {
      console.error("[LLM Client] Failed to create OpenAI client:", error);
      throw error;
    }
  }

  // Anthropic
  if (provider === "anthropic") {
    const apiKey =
      config?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn(
        "Anthropic provider selected but ANTHROPIC_API_KEY not found, falling back to MockLLMClient"
      );
      return new MockLLMClient();
    }
    return new AnthropicClient({
      apiKey,
      baseURL: config?.anthropicBaseURL || process.env.ANTHROPIC_BASE_URL,
      model:
        config?.anthropicModel ||
        process.env.ANTHROPIC_MODEL ||
        "claude-3-5-sonnet-20241022",
    });
  }

  // DeepSeek
  if (provider === "deepseek") {
    const apiKey = config?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.warn(
        "DeepSeek provider selected but DEEPSEEK_API_KEY not found, falling back to MockLLMClient"
      );
      return new MockLLMClient();
    }
    try {
      return new DeepSeekClient({
        apiKey,
        baseURL: config?.deepseekBaseURL || process.env.DEEPSEEK_BASE_URL,
        model: config?.deepseekModel || process.env.DEEPSEEK_MODEL || "deepseek-chat",
      });
    } catch (error) {
      console.error("[LLM Client] Failed to create DeepSeek client:", error);
      throw error;
    }
  }

  // Qwen
  if (provider === "qwen") {
    const apiKey = config?.qwenApiKey || process.env.QWEN_API_KEY;
    if (!apiKey) {
      console.warn(
        "Qwen provider selected but QWEN_API_KEY not found, falling back to MockLLMClient"
      );
      return new MockLLMClient();
    }
    try {
      return new QwenClient({
        apiKey,
        baseURL: config?.qwenBaseURL || process.env.QWEN_BASE_URL,
        model: config?.qwenModel || process.env.QWEN_MODEL || "qwen-turbo",
      });
    } catch (error) {
      console.error("[LLM Client] Failed to create Qwen client:", error);
      throw error;
    }
  }

  // Mock (默认)
  return new MockLLMClient();
}

