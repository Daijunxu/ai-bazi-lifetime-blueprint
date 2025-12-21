# 部署指南 - AI 八字终身蓝图

本指南将帮助你将项目部署到 GitHub 和 Vercel。

## 前置要求

1. GitHub 账号
2. Vercel 账号（可以使用 GitHub 账号登录）
3. 已安装 Git

## 步骤 1: 初始化 Git 仓库并提交代码

在项目根目录执行以下命令：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件（.gitignore 会自动排除敏感文件）
git add .

# 创建初始提交
git commit -m "Initial commit: AI Bazi Lifetime Blueprint"
```

## 步骤 2: 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `ai-bazi-lifetime-blueprint`（或你喜欢的名字）
   - **Description**: AI 八字终身蓝图 - 基于传统命理学与 AI 技术的个性化命盘分析
   - **Visibility**: 选择 Public（公开）或 Private（私有）
   - **不要**勾选 "Initialize this repository with a README"（我们已经有了代码）
3. 点击 "Create repository"

## 步骤 3: 推送代码到 GitHub

在终端执行以下命令（将 `YOUR_USERNAME` 替换为你的 GitHub 用户名）：

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/ai-bazi-lifetime-blueprint.git

# 重命名主分支为 main（如果还没有）
git branch -M main

# 推送代码
git push -u origin main
```

如果遇到认证问题，你可能需要：
- 使用 Personal Access Token 代替密码
- 或者配置 SSH 密钥

## 步骤 4: 在 Vercel 上部署

### 方法 1: 通过 GitHub 导入（推荐）

1. 访问 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择你刚创建的 GitHub 仓库
4. 配置项目：
   - **Project Name**: `ai-bazi-lifetime-blueprint`（或自定义）
   - **Framework Preset**: Next.js（应该自动检测）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `.next`（默认）
5. 点击 "Deploy"

### 方法 2: 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目目录执行
vercel

# 按照提示完成部署
```

## 步骤 5: 配置环境变量

在 Vercel 项目设置中添加环境变量：

1. 进入 Vercel 项目 Dashboard
2. 点击 "Settings" → "Environment Variables"
3. 添加以下环境变量（根据你使用的 LLM 提供商）：

### 如果使用 OpenAI:
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o
```

### 如果使用 DeepSeek:
```
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
DEEPSEEK_MODEL=deepseek-chat
```

### 如果使用 Anthropic (Claude):
```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 如果使用 Qwen (通义千问):
```
LLM_PROVIDER=qwen
QWEN_API_KEY=sk-your-qwen-api-key-here
QWEN_MODEL=qwen-turbo
```

**重要提示**：
- 不要将 API Key 提交到 GitHub
- `.env.local` 文件已经在 `.gitignore` 中，不会被提交
- 只在 Vercel 的环境变量中配置

## 步骤 6: 重新部署

配置环境变量后，Vercel 会自动触发重新部署。如果没有，可以：

1. 在 Vercel Dashboard 点击 "Deployments"
2. 点击最新的部署右侧的 "..." 菜单
3. 选择 "Redeploy"

## 验证部署

部署完成后，你会得到一个类似 `https://your-project-name.vercel.app` 的 URL。

访问该 URL 测试应用是否正常工作。

## 常见问题

### 1. 构建失败

- 检查 Node.js 版本（Vercel 默认使用 Node.js 18.x）
- 检查 `package.json` 中的依赖是否正确
- 查看 Vercel 构建日志中的错误信息

### 2. API 调用失败

- 确认环境变量已正确配置
- 检查 API Key 是否有效
- 查看 Vercel 函数日志

### 3. 图片/资源加载失败

- 确认文件在 `public` 目录下
- 使用相对路径（如 `/rabbit-rainbow-bg.jpg` 而不是 `/public/rabbit-rainbow-bg.jpg`）

## 更新代码

当你更新代码后：

```bash
# 提交更改
git add .
git commit -m "描述你的更改"

# 推送到 GitHub
git push

# Vercel 会自动检测并重新部署
```

## 自定义域名（可选）

1. 在 Vercel Dashboard 进入项目设置
2. 点击 "Domains"
3. 添加你的自定义域名
4. 按照提示配置 DNS 记录

---

祝你部署顺利！🎉

