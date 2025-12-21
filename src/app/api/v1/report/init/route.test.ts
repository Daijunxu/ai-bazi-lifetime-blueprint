/**
 * /api/v1/report/init API 的集成测试
 * 使用 mock LLM 和 mock GeoClient 进行测试
 */

import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { MockLLMClient } from "@/backend/llm/llmClient";
import { InMemoryGeoClient } from "@/backend/geo/geoClient";

// Mock Next.js 的 NextRequest
function createMockRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe("POST /api/v1/report/init", () => {
  it("应该成功生成报告", async () => {
    const requestBody = {
      name: "测试用户",
      gender: "male" as const,
      birthDate: "1990-01-15T14:30:00Z",
      birthCity: "北京",
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.chart).toBeDefined();
    expect(data.data.verdict).toBeDefined();
    expect(data.data.report).toBeDefined();
    expect(data.data.solarTime).toBeDefined();
  });

  it("应该在输入验证失败时返回 400", async () => {
    const invalidBody = {
      gender: "invalid",
      birthDate: "invalid-date",
    };

    const request = createMockRequest(invalidBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("应该处理地理编码失败的情况", async () => {
    const requestBody = {
      gender: "female" as const,
      birthDate: "1995-06-20T10:00:00Z",
      birthCity: "不存在的城市名称",
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    // 即使地理编码失败，也应该能生成报告（使用 fallback）
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.solarTime.applied).toBe(false);
    expect(data.data.solarTime.warning).toContain("True Solar Time not applied");
  });

  it("应该包含完整的命盘数据", async () => {
    const requestBody = {
      gender: "male" as const,
      birthDate: "1985-03-10T08:15:00Z",
      birthCity: "上海",
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(data.data.chart.fourPillars).toBeDefined();
    expect(data.data.chart.fourPillars.year).toBeDefined();
    expect(data.data.chart.fourPillars.month).toBeDefined();
    expect(data.data.chart.fourPillars.day).toBeDefined();
    expect(data.data.chart.fourPillars.hour).toBeDefined();
    expect(data.data.chart.luckPillars.length).toBeGreaterThan(0);
  });

  it("应该包含分析结论", async () => {
    const requestBody = {
      gender: "female" as const,
      birthDate: "2000-12-25T20:30:00Z",
      birthCity: "广州",
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(data.data.verdict.structure).toBeDefined();
    expect(data.data.verdict.dayMasterStrength).toBeDefined();
    expect(data.data.verdict.verdictReasoning).toBeDefined();
  });

  it("应该包含基础报告内容", async () => {
    const requestBody = {
      gender: "male" as const,
      birthDate: "1992-07-08T12:00:00Z",
      birthCity: "深圳",
    };

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(data.data.report.content).toBeDefined();
    expect(data.data.report.language).toBe("zh-CN");
    expect(data.data.report.sections).toBeInstanceOf(Array);
    expect(data.data.report.sections.length).toBeGreaterThan(0);
  });
});

