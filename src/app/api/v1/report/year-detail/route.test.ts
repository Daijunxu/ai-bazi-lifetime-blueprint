/**
 * /api/v1/report/year-detail API 的集成测试
 * 使用 mock LLM 进行测试
 */

import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import type { ChartJSON } from "@/types/bazi";

// Mock Next.js 的 NextRequest
function createMockRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

// 创建测试用的 ChartJSON
function createTestChart(): ChartJSON {
  return {
    fourPillars: {
      year: {
        heavenlyStem: "Geng",
        earthlyBranch: "Wu",
        hiddenStems: [],
      },
      month: {
        heavenlyStem: "Wu",
        earthlyBranch: "Zi",
        hiddenStems: [],
      },
      day: {
        heavenlyStem: "Yi",
        earthlyBranch: "Mao",
        hiddenStems: [],
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
    ],
    interactionMatrix: {
      entries: [],
    },
    starGods: [],
  };
}

describe("POST /api/v1/report/year-detail", () => {
  it("应该成功生成年度详细报告", async () => {
    const requestBody = {
      chart: createTestChart(),
      year: 2025,
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.yearReport).toBeDefined();
    expect(data.data.yearReport.year).toBe(2025);
    expect(data.data.yearReport.content).toBeDefined();
    expect(data.data.yearReport.language).toBe("zh-CN");
  });

  it("应该在输入验证失败时返回 400", async () => {
    const invalidBody = {
      chart: createTestChart(),
      year: 1800, // 无效年份
    };

    const request = createMockRequest(invalidBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("应该在命盘数据无效时返回 400", async () => {
    const invalidBody = {
      chart: { invalid: "data" },
      year: 2025,
    };

    const request = createMockRequest(invalidBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("应该处理不同年份", async () => {
    const testYears = [2023, 2025, 2027, 2030];

    for (const year of testYears) {
      const requestBody = {
        chart: createTestChart(),
        year,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.yearReport.year).toBe(year);
    }
  });

  it("应该生成包含年份信息的报告内容", async () => {
    const requestBody = {
      chart: createTestChart(),
      year: 2027,
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(data.data.yearReport.content).toContain("2027");
  });
});

