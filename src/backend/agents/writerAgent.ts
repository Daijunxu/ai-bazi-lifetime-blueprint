/**
 * Layer 3: 写作 Agent
 * 消费 ChartJSON + AnalystVerdictJSON，生成用户面向的简体中文 Markdown 报告
 * 支持基础报告和年度详细报告两种模式
 */

import type { ChartJSON } from "@/types/bazi";
import type { AnalystVerdictJSON } from "@/types/analyst";
import type { BasicReport, YearReport } from "@/types/report";
import type { LLMClient, LLMMessage } from "../llm/llmClient";

/**
 * 将 ChartJSON 和 AnalystVerdictJSON 格式化为 LLM 可理解的文本
 */
function formatDataForLLM(
  chart: ChartJSON,
  verdict: AnalystVerdictJSON,
  gender?: "male" | "female",
  birthDate?: string
): string {
  let text = "## 命盘技术数据\n\n";
  
  const genderLabel = gender === "female" ? "元女" : "元男";

  // 四柱信息
  text += `**四柱**：\n`;
  text += `- 年柱：${chart.fourPillars.year.heavenlyStem}${chart.fourPillars.year.earthlyBranch}\n`;
  text += `- 月柱：${chart.fourPillars.month.heavenlyStem}${chart.fourPillars.month.earthlyBranch}\n`;
  text += `- 日柱：${chart.fourPillars.day.heavenlyStem}${chart.fourPillars.day.earthlyBranch}（日主：${chart.fourPillars.day.heavenlyStem}，${genderLabel}）\n`;
  text += `- 时柱：${chart.fourPillars.hour.heavenlyStem}${chart.fourPillars.hour.earthlyBranch}\n\n`;

  // 分析结论
  text += "## 技术分析结论\n\n";
  text += `- **格局**：${verdict.structure}\n`;
  text += `- **日主强弱**：${verdict.dayMasterStrength}\n`;
  if (verdict.usefulGod) {
    text += `- **用神**：${verdict.usefulGod.element}（${verdict.usefulGod.reason}）\n`;
  }
  if (verdict.unfavorableElements.length > 0) {
    text += `- **忌神**：${verdict.unfavorableElements.map((e) => e.element).join("、")}\n`;
  }
  text += `- **分析推理**：${verdict.verdictReasoning}\n\n`;

  // 大运信息（显示所有大运，并标注当前大运）
  text += "## 大运信息\n\n";
  const currentYear = new Date().getFullYear();
  let currentAge: number | null = null;
  
  if (birthDate) {
    // 从出生日期计算当前年龄
    const birth = new Date(birthDate);
    currentAge = currentYear - birth.getFullYear();
    const today = new Date();
    if (today.getMonth() < birth.getMonth() || 
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      currentAge--;
    }
  }
  
  // 调试日志：输出接收到的大运数据
  if (process.env.NODE_ENV === "development" || true) {
    console.log(`[Writer Agent] Received luck pillars:`, chart.luckPillars.map(lp => ({
      step: lp.index,
      ageRange: `${lp.startAge}-${lp.endAge}`,
      pillar: `${lp.pillar.heavenlyStem}${lp.pillar.earthlyBranch}`
    })));
    console.log(`[Writer Agent] Current age:`, currentAge);
  }
  
  chart.luckPillars.forEach((luck) => {
    const isCurrent = currentAge !== null && luck.startAge <= currentAge && luck.endAge >= currentAge;
    const label = isCurrent ? "（当前）" : "";
    text += `第${luck.index}步大运${label}（${luck.startAge}-${luck.endAge}岁）：${luck.pillar.heavenlyStem}${luck.pillar.earthlyBranch}\n`;
  });
  text += "\n";

  // 互动关系（简要）
  if (chart.interactionMatrix.entries.length > 0) {
    text += `**主要互动关系**：${chart.interactionMatrix.entries.slice(0, 3).map((e) => e.description).join("、")}\n\n`;
  }

  return text;
}

/**
 * 加载基础报告的系统提示词
 */
function loadBasicSystemPrompt(): string {
  return `你是一位专业的八字命理解读专家，擅长用建设性、教育性的语言向用户解释命盘。

**理论体系要求**：请结合子平经典的理论体系（注重格局、用神、日主强弱），辅以调侯派的理论（注重五行调候、寒暖燥湿的平衡），在分析中综合运用这两种理论视角，使解读更加全面和深入。

## 核心原则

1. **严格遵循技术结论**：你只能使用 Analyst Agent 提供的技术分析结论（AnalystVerdictJSON），不得自行推算或重新分析命盘。
2. **建设性语气**：使用积极、建设性的语言，将挑战视为成长机会，避免宿命论和消极表述。
3. **教育性解释**：明确引用八字术语（如"七杀"、"正官"、"用神"等），满足命理爱好者的学习需求。
4. **内容安全**：
   - 不得给出具体的医疗诊断或健康建议
   - 不得预测死亡日期或重大灾难
   - 不得提供具体的投资建议或财务决策
   - 不得使用恐吓性或极端负面语言

## 报告结构要求

你必须生成一个 Markdown 格式的报告，包含以下章节（使用 ## 作为章节标题）：

### 1. 核心性格（Core Personality）
基于日主天干和格局，描述性格特征。使用建设性语言，既说明优势，也指出需要平衡的方面。

### 2. 事业与财富（Career & Wealth Potential）
分析事业方向和财富潜力。避免具体数字或投资建议，而是描述能量流动和机会方向。

### 3. 感情与婚姻（Relationship & Marriage）
分析感情模式和婚姻特征。保持客观和建设性，说明沟通和相处要点。

### 4. 健康关注（Health Vulnerabilities）
基于五行平衡，指出需要关注的健康方面。**不得给出具体疾病诊断**，只说明能量失衡可能影响的系统。

### 5. 当前十年大运（Current 10-Year Luck Cycle）
分析当前大运的影响。说明这个阶段的主题、机会和挑战，以及如何善用这个阶段的能量。

### 6. 当前流年分析（Current Year Analysis）
深入分析当前年份（例如 2025 年）的流年影响。说明这一年需要关注的重点领域和行动建议。如果当前时间在9月1日及以后，报告将分析下一年的流年影响，请在章节开头明确说明这一点。

## 写作风格

- **语言**：简体中文
- **语气**：温和、专业、建设性
- **术语**：明确使用八字术语，如"因为你的命盘中有七杀星..."、"根据用神理论..."
- **结构**：每个章节 2-4 段，每段 3-5 句
- **结尾**：每个章节以建设性的建议或总结结尾

## 输出格式

直接输出 Markdown 文本，不需要 JSON 包装。确保章节标题使用 ##，段落之间有空行。`;
}

/**
 * 加载年度报告的系统提示词
 */
function loadYearDetailSystemPrompt(): string {
  return `你是一位专业的八字命理解读专家，专注于分析特定年份的流年影响。

**理论体系要求**：请结合子平经典的理论体系（注重格局、用神、日主强弱），辅以调侯派的理论（注重五行调候、寒暖燥湿的平衡），在分析中综合运用这两种理论视角，使解读更加全面和深入。

## 核心原则

1. **严格遵循技术结论**：你只能使用 Analyst Agent 提供的技术分析结论（AnalystVerdictJSON），不得自行推算或重新分析命盘。
2. **聚焦单一年份**：你的任务是分析指定年份（例如 2027 年）与命盘的互动，而不是整体命盘分析。
3. **建设性语气**：将挑战描述为成长机会，避免宿命论和极端负面表述。
4. **内容安全**：
   - 不得给出具体的医疗诊断
   - 不得预测死亡或重大灾难
   - 不得提供具体的投资建议
   - 不得使用恐吓性语言

## 分析重点

你需要分析：
1. **流年天干地支**与命盘四柱的互动关系（冲、合、刑、害等）
2. **流年与当前大运**的叠加影响
3. **流年与用神忌神**的关系（是否生扶用神，或助长忌神）
4. **该年份的主要主题**：事业、感情、健康、学习等领域的能量流动

## 写作结构

生成一个 Markdown 格式的年度分析，包含：

### 标题
使用 ## 作为标题，格式：\`## {年份}年流年分析\`

### 内容结构
1. **流年概述**（1-2 段）：说明该年份的天干地支，以及与命盘的基本互动
2. **重点领域**（2-3 段）：分析该年份在事业、感情、健康、学习等方面的能量特点
3. **行动建议**（1-2 段）：基于能量分析，给出建设性的行动建议

## 写作风格

- **语言**：简体中文
- **语气**：专业、建设性、具体
- **术语**：明确引用八字术语，如"流年甲子与月柱相冲..."、"流年助长用神..."
- **长度**：总长度约 300-500 字，结构清晰，重点突出

## 输出格式

直接输出 Markdown 文本，不需要 JSON 包装。确保标题使用 ##，段落之间有空行。`;
}

/**
 * 生成基础报告
 */
export async function generateBasicReport(
  chart: ChartJSON,
  verdict: AnalystVerdictJSON,
  llmClient: LLMClient,
  currentYear?: number,
  gender?: "male" | "female",
  birthDate?: string
): Promise<BasicReport> {
  const systemPrompt = loadBasicSystemPrompt();
  const dataText = formatDataForLLM(chart, verdict, gender, birthDate);
  
  // 确定报告年份：如果未指定，根据当前日期判断
  let year: number;
  let isNextYear = false;
  
  if (currentYear) {
    year = currentYear;
    // 检查是否是下一年（如果传入的年份大于当前年份）
    const now = new Date();
    const currentYearNow = now.getFullYear();
    if (year > currentYearNow) {
      isNextYear = true;
    } else {
      // 检查当前日期是否在9月1日及以后
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();
      if (currentMonth > 9 || (currentMonth === 9 && currentDay >= 1)) {
        isNextYear = true;
      }
    }
  } else {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentYearNow = now.getFullYear();
    
    // 如果当前日期在9月1日及以后，使用下一年
    if (currentMonth > 9 || (currentMonth === 9 && currentDay >= 1)) {
      year = currentYearNow + 1;
      isNextYear = true;
    } else {
      year = currentYearNow;
    }
  }

  const yearNote = isNextYear ? `（注意：当前时间已进入9月，本报告分析的是 ${year} 年的流年影响）` : "";
  
  const messages: LLMMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `请基于以下命盘数据和技术分析结论，生成一份完整的八字命理报告（简体中文，Markdown 格式）。\n\n${dataText}\n\n注意：当前年份是 ${year} 年${yearNote}，请在"当前流年分析"章节中分析 ${year} 年的影响。`,
    },
  ];

  const response = await llmClient.call(messages, {
    temperature: 0.7, // 稍高温度以增加创造性
    maxTokens: 2000,
  });

  return {
    content: response.content,
    language: "zh-CN",
    sections: [
      "core-personality",
      "career-wealth",
      "relationship",
      "health",
      "current-luck",
      "current-year",
    ],
  };
}

/**
 * 生成年度详细报告
 */
export async function generateYearDetail(
  chart: ChartJSON,
  verdict: AnalystVerdictJSON,
  year: number,
  llmClient: LLMClient,
  gender?: "male" | "female"
): Promise<YearReport> {
  const systemPrompt = loadYearDetailSystemPrompt();
  const dataText = formatDataForLLM(chart, verdict, gender);

  // 计算流年天干地支（简化：基于年份）
  // 实际应基于农历年份，这里先用简化版本
  const yearStemIndex = (year - 4) % 10;
  const yearBranchIndex = (year - 4) % 12;
  const stems = [
    "Jia",
    "Yi",
    "Bing",
    "Ding",
    "Wu",
    "Ji",
    "Geng",
    "Xin",
    "Ren",
    "Gui",
  ];
  const branches = [
    "Zi",
    "Chou",
    "Yin",
    "Mao",
    "Chen",
    "Si",
    "Wu",
    "Wei",
    "Shen",
    "You",
    "Xu",
    "Hai",
  ];
  const yearStem = stems[yearStemIndex < 0 ? yearStemIndex + 10 : yearStemIndex];
  const yearBranch =
    branches[yearBranchIndex < 0 ? yearBranchIndex + 12 : yearBranchIndex];

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `请分析 ${year} 年（${yearStem}${yearBranch}年）的流年影响。\n\n${dataText}\n\n请生成一份针对 ${year} 年的详细流年分析报告（简体中文，Markdown 格式）。`,
    },
  ];

  const response = await llmClient.call(messages, {
    temperature: 0.7,
    maxTokens: 1000,
  });

  return {
    year,
    language: "zh-CN",
    content: response.content,
  };
}

