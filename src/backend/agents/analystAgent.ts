/**
 * Layer 2: 分析 Agent
 * 消费 ChartJSON，通过 LLM 进行技术分析，输出 AnalystVerdictJSON
 * 不做任何排盘计算，只做分析和判断
 */

import type { ChartJSON } from "@/types/bazi";
import type { AnalystVerdictJSON } from "@/types/analyst";
import type { LLMClient, LLMMessage } from "../llm/llmClient";

/**
 * 将 ChartJSON 转换为 LLM 可理解的文本格式
 */
function calcCurrentAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatChartForLLM(
  chart: ChartJSON,
  gender?: "male" | "female",
  birthDate?: string
): string {
  const { fourPillars, luckPillars, interactionMatrix, starGods } = chart;
  
  const genderLabel = gender === "female" ? "元女" : "元男";

  const currentAge = calcCurrentAge(birthDate);
  let activeLuckText = "";
  if (luckPillars.length > 0) {
    const active = currentAge != null
      ? luckPillars.find((lp) => lp.startAge <= currentAge && lp.endAge >= currentAge)
      : null;
    if (active) {
      activeLuckText = `当前大运：第${active.index}步（${active.startAge}-${active.endAge}岁），${active.pillar.heavenlyStem}${active.pillar.earthlyBranch}`;
    } else if (currentAge != null && currentAge < luckPillars[0]!.startAge) {
      const first = luckPillars[0]!;
      activeLuckText = `当前年龄 ${currentAge} 岁尚未起运，将提前参考即将到来的第${first.index}步大运（${first.startAge}-${first.endAge}岁，${first.pillar.heavenlyStem}${first.pillar.earthlyBranch}），报告中请注明这是即将到来的第一步大运。`;
    }
  }

  let text = "## 四柱信息\n\n";
  text += `年柱：${fourPillars.year.heavenlyStem}${fourPillars.year.earthlyBranch}\n`;
  text += `月柱：${fourPillars.month.heavenlyStem}${fourPillars.month.earthlyBranch}\n`;
  text += `日柱：${fourPillars.day.heavenlyStem}${fourPillars.day.earthlyBranch}（日主：${fourPillars.day.heavenlyStem}，${genderLabel}）\n`;
  text += `时柱：${fourPillars.hour.heavenlyStem}${fourPillars.hour.earthlyBranch}\n\n`;

  text += "## 藏干信息\n\n";
  ["year", "month", "day", "hour"].forEach((key) => {
    const pillar = fourPillars[key as keyof typeof fourPillars];
    text += `${key}柱藏干：`;
    text += pillar.hiddenStems
      .map((h) => `${h.stem}(${h.tenGod}, ${h.strength})`)
      .join("、");
    text += "\n";
  });
  text += "\n";

  text += "## 大运信息\n\n";
  
  // 调试日志：输出传递给 Analyst Agent 的大运数据
  if (process.env.NODE_ENV === "development" || true) {
    console.log(`[Analyst Agent] Received luck pillars:`, luckPillars.map(lp => ({
      step: lp.index,
      ageRange: `${lp.startAge}-${lp.endAge}`,
      pillar: `${lp.pillar.heavenlyStem}${lp.pillar.earthlyBranch}`
    })));
  }
  
  luckPillars.slice(0, 3).forEach((luck) => {
    text += `第${luck.index}步大运（${luck.startAge}-${luck.endAge}岁）：${luck.pillar.heavenlyStem}${luck.pillar.earthlyBranch}\n`;
  });
  text += "\n";

  if (activeLuckText) {
    text += `## 当前大运指示\n\n${activeLuckText}\n\n`;
  }

  if (interactionMatrix.entries.length > 0) {
    text += "## 互动关系\n\n";
    interactionMatrix.entries.forEach((entry) => {
      text += `${entry.description}（${entry.type}）\n`;
    });
    text += "\n";
  }

  if (starGods.length > 0) {
    text += "## 神煞\n\n";
    starGods.forEach((star) => {
      text += `${star.description}（${star.key}，位于${star.pillar}柱）\n`;
    });
    text += "\n";
  }

  return text;
}

/**
 * 加载系统提示词
 * 注意：在 Next.js 环境中，文件系统访问可能受限
 * 这里使用内联提示词，实际部署时可以通过环境变量或数据库加载
 */
function loadSystemPrompt(): string {
  // 内联系统提示词（可以从文件加载，但为了简化，这里直接内联）
  // 使用字符串拼接避免长模板字符串导致的编译问题
  const parts = [
    "你是一位专业的八字命理分析专家。你的任务是分析八字命盘的技术特征，并输出结构化的技术结论。",
    "",
    "**分析风格要求**：请应用子平经典流派的分析风格，注重格局判断、用神取用、日主强弱等核心要素，遵循传统子平命理的理论体系和分析方法。",
    "",
    "## 核心原则",
    "",
    "1. **严格基于输入数据**：你只能分析提供的 ChartJSON 数据，不得自行推算或假设任何信息。",
    "2. **技术判断优先**：专注于判断日主强弱、格局结构、用神忌神等技术指标。",
    "3. **输出格式严格**：必须输出有效的 JSON 格式，符合 AnalystVerdictJSON 结构。",
    "",
    "## 分析任务",
    "",
    "### 1. 日主强弱判断（Day Master Strength）",
    "",
    "根据日主天干在四柱中的分布、藏干支持、大运影响等因素，判断日主强弱：",
    "- **Strong（身强）**：日主得令、得地、得势，有足够支持",
    "- **Weak（身弱）**：日主失令、失地、失势，缺乏支持",
    "- **Follow（从格）**：日主极弱或极强，形成特殊格局（从财、从官、从儿等）",
    "- **Balanced（平衡）**：日主力量适中",
    "",
    "### 2. 格局判断（Chart Structure）",
    "",
    "根据四柱组合、十神分布、神煞等因素，判断命盘格局：",
    "- NormalWealth（正财格）、IndirectWealth（偏财格）",
    "- SevenKillings（七杀格）、ProperAuthority（正官格）",
    "- EatingGod（食神格）、HurtingOfficer（伤官格）",
    "- SpecialStructure（特殊格局，如从格、化气格等）",
    "- Unknown（无法确定）",
    "",
    "### 3. 用神判断（Useful God - Yong Shen）",
    "",
    "根据日主强弱和格局，确定喜用神：",
    "- 身强：喜克、泄、耗（官杀、食伤、财星）",
    "- 身弱：喜生、扶（印星、比劫）",
    "- 从格：根据从的类型确定用神",
    "",
    "### 4. 忌神判断（Unfavorable Elements）",
    "",
    "确定对命盘不利的五行或十神：",
    "- 与用神相冲、相克的元素",
    "- 破坏格局的元素",
    "",
    "### 5. 推理说明（Verdict Reasoning）",
    "",
    "用简洁的中文说明你的判断依据，引用具体的四柱、藏干、大运等信息。",
    "",
    "## 输出格式",
    "",
    "你必须输出一个有效的 JSON 对象，格式如下：",
    "",
    '{"structure": "ProperAuthority", "dayMasterStrength": "Weak", "usefulGod": {"element": "Water", "reason": "日主身弱，需要水来生扶"}, "unfavorableElements": [{"element": "Fire", "reason": "火多会泄木气"}], "verdictReasoning": "日主乙木生于午月，失令。四柱中火土过旺，克泄日主。虽有年支子水，但力量不足。因此判断为身弱，喜水木为用神。"}',
    "",
    "## 注意事项",
    "",
    "- 不要给出具体的命运预测（那是 Writer Agent 的工作）",
    "- 不要使用宿命论语言",
    "- 专注于技术分析，保持客观",
    "- 如果数据不足或存在矛盾，在 reasoning 中说明",
  ];
  
  return parts.join("\n");
}

/**
 * 解析 LLM 返回的 JSON，并进行基本验证
 */
function parseAnalystResponse(response: string): AnalystVerdictJSON {
  try {
    // 尝试提取 JSON（可能被 markdown 代码块包裹）
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      const lines = jsonStr.split("\n");
      jsonStr = lines
        .slice(1, -1)
        .join("\n")
        .replace(/^json\n/, "");
    }

    const parsed = JSON.parse(jsonStr) as Partial<AnalystVerdictJSON>;

    // 基本验证
    if (!parsed.structure || !parsed.dayMasterStrength) {
      throw new Error("缺少必需字段：structure 或 dayMasterStrength");
    }

    // 确保数组存在
    if (!Array.isArray(parsed.unfavorableElements)) {
      parsed.unfavorableElements = [];
    }

    // 确保 reasoning 存在
    if (!parsed.verdictReasoning) {
      parsed.verdictReasoning = "分析完成";
    }

    return {
      structure: parsed.structure,
      dayMasterStrength: parsed.dayMasterStrength,
      usefulGod: parsed.usefulGod || null,
      unfavorableElements: parsed.unfavorableElements,
      verdictReasoning: parsed.verdictReasoning,
    };
  } catch (error) {
    throw new Error(
      `解析 Analyst 响应失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 分析八字命盘
 * @param chart 计算引擎输出的 ChartJSON
 * @param llmClient LLM 客户端（可以是真实客户端或 Mock 客户端）
 * @param gender 性别（用于标注元男/元女）
 * @returns 分析结论 JSON
 */
export async function analyzeChart(
  chart: ChartJSON,
  llmClient: LLMClient,
  gender?: "male" | "female",
  birthDate?: string
): Promise<AnalystVerdictJSON> {
  const systemPrompt = loadSystemPrompt();
  const chartText = formatChartForLLM(chart, gender, birthDate);

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `请分析以下八字命盘：\n\n${chartText}\n\n请输出 JSON 格式的分析结果。`,
    },
  ];

  const response = await llmClient.call(messages, {
    temperature: 0.3, // 较低温度以保证分析的一致性
    maxTokens: 1000,
  });

  return parseAnalystResponse(response.content);
}


