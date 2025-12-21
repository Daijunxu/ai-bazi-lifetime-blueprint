# AI 八字终身蓝图

基于传统命理学与 AI 技术的个性化命盘分析应用。

## 功能特性

- 🎯 **精准排盘**：使用专业的八字计算库，支持真太阳时校正
- 🤖 **AI 分析**：集成多种 LLM（OpenAI、DeepSeek、Claude、Qwen）进行智能分析
- 📱 **移动端适配**：响应式设计，完美支持移动设备
- 💾 **本地存储**：数据仅存储在浏览器本地，保护隐私
- 🌍 **全球城市支持**：支持全球主要城市的时区和真太阳时计算

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **后端**: Next.js API Routes
- **八字计算**: bazi-calculator-by-alvamind
- **时区处理**: date-fns-tz
- **AI 集成**: OpenAI / DeepSeek / Anthropic / Qwen

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env.local` 文件：

```bash
# 选择 LLM 提供商
LLM_PROVIDER=deepseek

# DeepSeek 配置
DEEPSEEK_API_KEY=your-api-key-here
DEEPSEEK_MODEL=deepseek-chat
```

支持的提供商：
- `openai` - OpenAI GPT-4
- `deepseek` - DeepSeek
- `anthropic` - Claude
- `qwen` - 通义千问
- `mock` - 模拟模式（默认，用于测试）

### 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/         # API 路由
│   │   ├── page.tsx     # 主页面
│   │   └── report/      # 报告页面
│   ├── backend/         # 后端逻辑
│   │   ├── agents/      # AI 代理（Analyst, Writer）
│   │   ├── bazi/        # 八字计算引擎
│   │   ├── geo/         # 地理编码和时区
│   │   └── llm/         # LLM 客户端
│   ├── components/      # React 组件
│   ├── lib/             # 工具函数
│   └── types/           # TypeScript 类型定义
└── public/              # 静态资源
```

## 部署

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 完成！

## 使用说明

1. **输入出生信息**：填写姓名、性别、出生日期、时间和地点
2. **生成报告**：点击"保存"按钮，系统会自动计算八字并生成分析报告
3. **查看报告**：报告包含详细的命盘分析、性格解读、运势预测等内容
4. **历史记录**：可以查看和切换之前保存的命盘记录

## 注意事项

- 所有数据仅存储在浏览器本地（localStorage），不会上传到服务器
- API Key 等敏感信息请妥善保管，不要提交到代码仓库
- 本应用仅供娱乐参考，不构成任何现实决策依据

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

