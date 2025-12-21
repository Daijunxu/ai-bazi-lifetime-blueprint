/**
 * Analyst Agent 的单元测试
 * 使用 MockLLMClient 进行测试，确保 JSON 解析和验证正确
 */

import { describe, it, expect, beforeEach } from "vitest";
import { analyzeChart } from "./analystAgent";
import { MockLLMClient } from "../llm/llmClient";
import type { ChartJSON } from "@/types/bazi";
import type { AnalystVerdictJSON } from "@/types/analyst";

// 创建一个测试用的 ChartJSON
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
          {
            stem: "Ji",
            tenGod: "ZhengCai",
            strength: "medium",
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
        hiddenStems: [
          {
            stem: "Geng",
            tenGod: "ZhengGuan",
            strength: "strong",
          },
          {
            stem: "Ren",
            tenGod: "ZhengYin",
            strength: "medium",
          },
        ],
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
    starGods: [
      {
        key: "TianYiGuiRen",
        pillar: "day",
        description: "天乙贵人",
      },
    ],
  };
}

describe("AnalystAgent", () => {
  let mockClient: MockLLMClient;
  let testChart: ChartJSON;

  beforeEach(() => {
    mockClient = new MockLLMClient();
    testChart = createTestChart();
  });

  it("应该成功分析命盘并返回 AnalystVerdictJSON", async () => {
    const mockResponse: AnalystVerdictJSON = {
      structure: "ProperAuthority",
      dayMasterStrength: "weak",
      usefulGod: {
        element: "Water",
        reason: "日主乙木身弱，需要水来生扶",
      },
      unfavorableElements: [
        {
          element: "Fire",
          reason: "火多会泄木气",
        },
      ],
      verdictReasoning: "日主乙木生于子月，得令。但四柱中金火较多，克泄日主。年支午火与月支子水相冲，格局不稳。因此判断为身弱，喜水木为用神。",
    };

    mockClient.setDefaultResponse(JSON.stringify(mockResponse));

    const result = await analyzeChart(testChart, mockClient);

    expect(result).toBeDefined();
    expect(result.structure).toBe("ProperAuthority");
    expect(result.dayMasterStrength).toBe("weak");
    expect(result.usefulGod).toBeDefined();
    expect(result.unfavorableElements).toBeInstanceOf(Array);
    expect(result.verdictReasoning).toBeDefined();
  });

  it("应该处理被 markdown 代码块包裹的 JSON 响应", async () => {
    const mockResponse: AnalystVerdictJSON = {
      structure: "NormalWealth",
      dayMasterStrength: "balanced",
      usefulGod: null,
      unfavorableElements: [],
      verdictReasoning: "测试推理",
    };

    const wrappedResponse = `\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\``;
    mockClient.setDefaultResponse(wrappedResponse);

    const result = await analyzeChart(testChart, mockClient);

    expect(result.structure).toBe("NormalWealth");
    expect(result.dayMasterStrength).toBe("balanced");
  });

  it("应该处理缺少可选字段的响应", async () => {
    const incompleteResponse = {
      structure: "SevenKillings",
      dayMasterStrength: "strong",
      // 缺少 usefulGod 和 unfavorableElements
    };

    mockClient.setDefaultResponse(JSON.stringify(incompleteResponse));

    const result = await analyzeChart(testChart, mockClient);

    expect(result.structure).toBe("SevenKillings");
    expect(result.dayMasterStrength).toBe("strong");
    expect(result.usefulGod).toBeNull();
    expect(result.unfavorableElements).toEqual([]);
    expect(result.verdictReasoning).toBeDefined(); // 应该有默认值
  });

  it("应该在 JSON 解析失败时抛出错误", async () => {
    mockClient.setDefaultResponse("这不是有效的 JSON");

    await expect(analyzeChart(testChart, mockClient)).rejects.toThrow(
      "解析 Analyst 响应失败"
    );
  });

  it("应该在缺少必需字段时抛出错误", async () => {
    const invalidResponse = {
      // 缺少 structure 和 dayMasterStrength
      usefulGod: null,
    };

    mockClient.setDefaultResponse(JSON.stringify(invalidResponse));

    await expect(analyzeChart(testChart, mockClient)).rejects.toThrow(
      "缺少必需字段"
    );
  });

  it("应该正确处理从格（follow）的判断", async () => {
    const followResponse: AnalystVerdictJSON = {
      structure: "SpecialStructure",
      dayMasterStrength: "follow",
      usefulGod: {
        element: "Fire",
        reason: "从财格，喜用财星",
      },
      unfavorableElements: [
        {
          element: "Water",
          reason: "水会生木，破坏从格",
        },
      ],
      verdictReasoning: "日主极弱，形成从财格",
    };

    mockClient.setDefaultResponse(JSON.stringify(followResponse));

    const result = await analyzeChart(testChart, mockClient);

    expect(result.dayMasterStrength).toBe("follow");
    expect(result.usefulGod?.element).toBe("Fire");
  });

  it("应该正确处理多个不利元素", async () => {
    const multiUnfavorableResponse: AnalystVerdictJSON = {
      structure: "HurtingOfficer",
      dayMasterStrength: "weak",
      usefulGod: {
        element: "Wood",
        reason: "身弱喜印比",
      },
      unfavorableElements: [
        {
          element: "Fire",
          reason: "火多泄木",
        },
        {
          element: "Metal",
          reason: "金多克木",
        },
        {
          element: "Earth",
          reason: "土多耗木",
        },
      ],
      verdictReasoning: "日主身弱，多个不利因素",
    };

    mockClient.setDefaultResponse(JSON.stringify(multiUnfavorableResponse));

    const result = await analyzeChart(testChart, mockClient);

    expect(result.unfavorableElements.length).toBe(3);
    expect(result.unfavorableElements[0].element).toBe("Fire");
    expect(result.unfavorableElements[1].element).toBe("Metal");
    expect(result.unfavorableElements[2].element).toBe("Earth");
  });
});

