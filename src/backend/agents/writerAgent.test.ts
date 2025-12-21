/**
 * Writer Agent 的单元测试
 * 测试基础报告和年度报告的生成，确保 Markdown 结构、语气、内容安全
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateBasicReport,
  generateYearDetail,
} from "./writerAgent";
import { MockLLMClient } from "../llm/llmClient";
import type { ChartJSON } from "@/types/bazi";
import type { AnalystVerdictJSON } from "@/types/analyst";

// 创建测试用的 ChartJSON
function createTestChart(): ChartJSON {
  return {
    fourPillars: {
      year: {
        heavenlyStem: "Geng",
        earthlyBranch: "Wu",
        hiddenStems: [
          {
            stem: "Ding",
            tenGod: "ZhengGuan",
            strength: "strong",
          },
        ],
      },
      month: {
        heavenlyStem: "Wu",
        earthlyBranch: "Zi",
        hiddenStems: [
          {
            stem: "Gui",
            tenGod: "ZhengYin",
            strength: "strong",
          },
        ],
      },
      day: {
        heavenlyStem: "Yi",
        earthlyBranch: "Mao",
        hiddenStems: [
          {
            stem: "Yi",
            tenGod: "BiJian",
            strength: "strong",
          },
        ],
      },
      hour: {
        heavenlyStem: "Jia",
        earthlyBranch: "Shen",
        hiddenStems: [],
      },
    },
    luckPillars: [
      {
        index: 1,
        startAge: 0,
        endAge: 9,
        pillar: {
          heavenlyStem: "Ji",
          earthlyBranch: "Chou",
          hiddenStems: [],
        },
      },
      {
        index: 2,
        startAge: 10,
        endAge: 19,
        pillar: {
          heavenlyStem: "Geng",
          earthlyBranch: "Yin",
          hiddenStems: [],
        },
      },
      {
        index: 3,
        startAge: 20,
        endAge: 29,
        pillar: {
          heavenlyStem: "Xin",
          earthlyBranch: "Mao",
          hiddenStems: [],
        },
      },
    ],
    interactionMatrix: {
      entries: [
        {
          type: "chong",
          from: "month",
          to: "hour",
          description: "月冲时",
        },
      ],
    },
    starGods: [],
  };
}

// 创建测试用的 AnalystVerdictJSON
function createTestVerdict(): AnalystVerdictJSON {
  return {
    structure: "ProperAuthority",
    dayMasterStrength: "weak",
    usefulGod: {
      element: "Water",
      reason: "日主身弱，需要水来生扶",
    },
    unfavorableElements: [
      {
        element: "Fire",
        reason: "火多会泄木气",
      },
    ],
    verdictReasoning: "日主乙木身弱，喜水木为用神",
  };
}

describe("WriterAgent", () => {
  let mockClient: MockLLMClient;
  let testChart: ChartJSON;
  let testVerdict: AnalystVerdictJSON;

  beforeEach(() => {
    mockClient = new MockLLMClient();
    testChart = createTestChart();
    testVerdict = createTestVerdict();
  });

  describe("generateBasicReport", () => {
    it("应该生成包含所有必需章节的基础报告", async () => {
      const mockReport = `## 核心性格

你的命盘显示...

## 事业与财富

在事业方面...

## 感情与婚姻

感情方面...

## 健康关注

健康方面需要注意...

## 当前十年大运

当前大运...

## 当前流年分析

2025 年的流年影响...`;

      mockClient.setDefaultResponse(mockReport);

      const result = await generateBasicReport(
        testChart,
        testVerdict,
        mockClient
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.language).toBe("zh-CN");
      expect(result.sections).toContain("core-personality");
      expect(result.sections).toContain("career-wealth");
      expect(result.sections).toContain("relationship");
      expect(result.sections).toContain("health");
      expect(result.sections).toContain("current-luck");
      expect(result.sections).toContain("current-year");
    });

    it("应该使用指定的当前年份", async () => {
      const mockReport = `## 核心性格\n\n测试内容\n\n## 当前流年分析\n\n2027 年的流年影响...`;
      mockClient.setDefaultResponse(mockReport);

      const result = await generateBasicReport(
        testChart,
        testVerdict,
        mockClient,
        2027
      );

      expect(result.content).toContain("2027");
    });

    it("报告内容应该是 Markdown 格式", async () => {
      const mockReport = `## 核心性格\n\n这是第一段。\n\n这是第二段。`;
      mockClient.setDefaultResponse(mockReport);

      const result = await generateBasicReport(
        testChart,
        testVerdict,
        mockClient
      );

      expect(result.content).toContain("##");
      expect(result.content).toContain("核心性格");
    });
  });

  describe("generateYearDetail", () => {
    it("应该生成指定年份的详细报告", async () => {
      const mockReport = `## 2027年流年分析

2027 年为丁未年，流年天干丁火与你的日主形成相生关系...

这一年你在事业上会有新的机会...`;

      mockClient.setDefaultResponse(mockReport);

      const result = await generateYearDetail(
        testChart,
        testVerdict,
        2027,
        mockClient
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.language).toBe("zh-CN");
      expect(result.year).toBe(2027);
      expect(result.content).toContain("2027");
    });

    it("应该包含流年分析的关键内容", async () => {
      const mockReport = `## 2025年流年分析

流年概述：2025 年为乙巳年...

重点领域：在事业方面...`;

      mockClient.setDefaultResponse(mockReport);

      const result = await generateYearDetail(
        testChart,
        testVerdict,
        2025,
        mockClient
      );

      expect(result.year).toBe(2025);
      expect(result.content).toContain("2025");
    });

    it("应该处理不同年份", async () => {
      const mockReport2023 = `## 2023年流年分析\n\n2023 年的分析...`;
      const mockReport2030 = `## 2030年流年分析\n\n2030 年的分析...`;

      mockClient.setResponse("请分析 2023 年", mockReport2023);
      mockClient.setResponse("请分析 2030 年", mockReport2030);

      const result2023 = await generateYearDetail(
        testChart,
        testVerdict,
        2023,
        mockClient
      );
      const result2030 = await generateYearDetail(
        testChart,
        testVerdict,
        2030,
        mockClient
      );

      expect(result2023.year).toBe(2023);
      expect(result2030.year).toBe(2030);
    });
  });

  describe("内容安全检查", () => {
    it("应该拒绝包含医疗诊断的内容（通过提示词约束）", async () => {
      // 注意：实际的内容安全检查应该在 LLM 调用层面或后处理层面实现
      // 这里主要测试报告结构是否正确
      const mockReport = `## 核心性格\n\n正常内容\n\n## 健康关注\n\n需要注意能量平衡，避免过度消耗。`;
      mockClient.setDefaultResponse(mockReport);

      const result = await generateBasicReport(
        testChart,
        testVerdict,
        mockClient
      );

      // 报告应该正常生成，但不应包含具体疾病诊断
      expect(result.content).toBeDefined();
      // 实际部署时，可以添加后处理检查，拒绝包含特定关键词的内容
    });

    it("应该使用建设性语气（通过提示词约束）", async () => {
      const mockReport = `## 核心性格\n\n你的命盘显示你具有强烈的进取心。虽然有时会显得急躁，但这也是你行动力的体现。建议通过学习和思考来平衡这种能量。`;
      mockClient.setDefaultResponse(mockReport);

      const result = await generateBasicReport(
        testChart,
        testVerdict,
        mockClient
      );

      expect(result.content).toBeDefined();
      // 实际部署时，可以添加语气检查，确保不使用极端负面语言
    });
  });

  describe("Markdown 格式验证", () => {
    it("应该生成有效的 Markdown 结构", async () => {
      const mockReport = `## 核心性格

这是第一段内容。

这是第二段内容。

## 事业与财富

事业方面的分析...`;
      mockClient.setDefaultResponse(mockReport);

      const result = await generateBasicReport(
        testChart,
        testVerdict,
        mockClient
      );

      // 检查 Markdown 结构
      expect(result.content).toContain("##");
      const lines = result.content.split("\n");
      const headers = lines.filter((line) => line.startsWith("##"));
      expect(headers.length).toBeGreaterThan(0);
    });
  });
});

