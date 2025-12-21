# LLM 配置说明

本项目支持使用真实的 LLM API 来生成八字分析报告。目前支持以下提供商：
- OpenAI (GPT-4o, GPT-4, GPT-3.5-turbo)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- DeepSeek (deepseek-chat)
- Qwen (通义千问)

## 配置方式

### 方式 1: 环境变量（推荐）

在项目根目录创建 `.env.local` 文件（此文件不会被提交到 git），添加以下配置：

```bash
# 选择 LLM 提供商: "openai", "anthropic", "deepseek", "qwen", 或 "mock" (默认)
LLM_PROVIDER=openai

# OpenAI 配置
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=  # 可选，用于代理或自定义端点
OPENAI_MODEL=gpt-4o  # 可选，默认: "gpt-4o"

# 或使用 Anthropic
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-your-api-key-here
# ANTHROPIC_BASE_URL=  # 可选
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # 可选

# 或使用 DeepSeek
# LLM_PROVIDER=deepseek
# DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
# DEEPSEEK_BASE_URL=  # 可选
# DEEPSEEK_MODEL=deepseek-chat  # 可选，默认: "deepseek-chat"

# 或使用 Qwen (通义千问)
# LLM_PROVIDER=qwen
# QWEN_API_KEY=sk-your-qwen-api-key-here
# QWEN_BASE_URL=  # 可选
# QWEN_MODEL=qwen-turbo  # 可选，默认: "qwen-turbo"
```

### 方式 2: 代码中配置（不推荐用于生产环境）

如果需要，也可以在代码中直接配置：

```typescript
import { createLLMClient } from "@/backend/llm/createLLMClient";

const llmClient = createLLMClient({
  provider: "openai",
  openaiApiKey: "your-api-key",
  openaiModel: "gpt-4o",
});
```

## 支持的模型

### OpenAI
- `gpt-4o` (默认)
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

### Anthropic
- `claude-3-5-sonnet-20241022` (默认)
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

### DeepSeek
- `deepseek-chat` (默认)
- `deepseek-coder`

### Qwen (通义千问)
- `qwen-turbo` (默认)
- `qwen-plus`
- `qwen-max`

## 默认行为

- 如果未配置任何 API key，系统会自动使用 `MockLLMClient`，返回预设的模板内容
- 如果配置了 `LLM_PROVIDER` 但缺少对应的 API key，系统会回退到 `MockLLMClient` 并输出警告

## 获取 API Key

### OpenAI
1. 访问 https://platform.openai.com/
2. 注册/登录账号
3. 进入 API Keys 页面创建新的 API key

### Anthropic
1. 访问 https://console.anthropic.com/
2. 注册/登录账号
3. 进入 API Keys 页面创建新的 API key

### DeepSeek
1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 进入 API Keys 页面创建新的 API key

### Qwen (通义千问)
1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录阿里云账号
3. 开通 DashScope 服务
4. 在 API-KEY 管理页面创建新的 API key

## 注意事项

- API key 是敏感信息，请勿提交到 git 仓库
- `.env.local` 文件已在 `.gitignore` 中，不会被提交
- 使用真实 API 会产生费用，请注意控制使用量
- 建议在开发环境先使用 Mock 模式测试，确认功能正常后再切换到真实 API

