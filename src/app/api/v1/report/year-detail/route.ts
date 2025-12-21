/**
 * POST /api/v1/report/year-detail
 * 生成指定年份的详细流年分析报告
 */

import { NextRequest, NextResponse } from "next/server";
import { validateYearDetailRequest } from "@/backend/api/validators";
import { ZodError } from "zod";
import { createSuccessResponse, createErrorResponse } from "@/backend/api/mappers";
import { generateYearDetail } from "@/backend/agents/writerAgent";
import { analyzeChart } from "@/backend/agents/analystAgent";
import { MockLLMClient } from "@/backend/llm/llmClient";
import type { ChartJSON } from "@/types/bazi";

/**
 * 处理年度详细报告请求
 */
export async function POST(request: NextRequest) {
  try {
    // 解析并验证请求体
    const body = await request.json();
    const { chart, year } = validateYearDetailRequest(body);

    // 验证 chart 结构（简化版本，实际可以更严格）
    if (!chart || !chart.fourPillars || !chart.luckPillars) {
      return NextResponse.json(
        createErrorResponse(
          "VALIDATION_ERROR",
          "无效的命盘数据",
          false
        ),
        { status: 400 }
      );
    }

    const chartData = chart as ChartJSON;

    // 步骤 1: 分析命盘（如果需要，可以复用已有的 verdict，这里简化处理）
    // 注意：实际部署时，可以从缓存或数据库获取已有的 verdict
    const llmClient = new MockLLMClient();
    llmClient.setDefaultResponse(
      JSON.stringify({
        structure: "ProperAuthority",
        dayMasterStrength: "weak",
        usefulGod: { element: "Water", reason: "日主身弱" },
        unfavorableElements: [],
        verdictReasoning: "分析完成",
      })
    );

    const verdict = await analyzeChart(chartData, llmClient);

    // 步骤 2: 生成年度详细报告（Layer 3）
    const yearReport = await generateYearDetail(chartData, verdict, year, llmClient);

    // 返回成功响应
    return NextResponse.json(
      createSuccessResponse({
        yearReport,
      }),
      { status: 200 }
    );
  } catch (error) {
    // 处理验证错误
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse(
          "VALIDATION_ERROR",
          "输入数据验证失败",
          false,
          error.errors
        ),
        { status: 400 }
      );
    }

    // 处理其他错误
    console.error("年度报告生成失败:", error);
    return NextResponse.json(
      createErrorResponse(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "服务器内部错误",
        true // LLM 调用可能可以重试
      ),
      { status: 500 }
    );
  }
}

