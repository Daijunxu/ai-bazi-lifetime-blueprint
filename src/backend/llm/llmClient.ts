/**
 * 通用 LLM 客户端接口
 * 支持多种模型（GPT-4o, Claude 3.5 Sonnet 等）
 * 支持 streaming 和非 streaming 模式
 */

/**
 * LLM 消息格式
 */
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * LLM 调用选项
 */
export interface LLMCallOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * LLM 响应（非 streaming）
 */
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * LLM 客户端接口
 */
export interface LLMClient {
  /**
   * 调用 LLM（非 streaming）
   */
  call(messages: LLMMessage[], options?: LLMCallOptions): Promise<LLMResponse>;

  /**
   * 调用 LLM（streaming）
   * 返回一个异步迭代器，每次 yield 一个文本块
   */
  callStreaming?(
    messages: LLMMessage[],
    options?: LLMCallOptions
  ): AsyncIterable<string>;
}

/**
 * Mock LLM Client - 用于测试
 * 返回预设的固定响应
 */
export class MockLLMClient implements LLMClient {
  private responses: Map<string, string> = new Map();

  /**
   * 设置对特定消息的响应
   */
  setResponse(key: string, response: string): void {
    this.responses.set(key, response);
  }

  /**
   * 设置默认响应
   */
  setDefaultResponse(response: string): void {
    this.responses.set("__default__", response);
  }

  async call(
    messages: LLMMessage[],
    options?: LLMCallOptions
  ): Promise<LLMResponse> {
    // 使用最后一条用户消息作为 key
    const lastUserMessage = messages
      .filter((m) => m.role === "user")
      .pop()?.content || "";

    const response =
      this.responses.get(lastUserMessage) ||
      this.responses.get("__default__") ||
      '{"error": "No mock response configured"}';

    return {
      content: response,
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };
  }
}

