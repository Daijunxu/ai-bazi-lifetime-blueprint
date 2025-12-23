/**
 * POST /api/v1/report/init
 * 初始化报告：接收出生信息，返回完整的命盘、分析和基础报告
 */

import { NextRequest, NextResponse } from "next/server";
import { validateBirthInput } from "@/backend/api/validators";
import { ZodError } from "zod";
import { createSuccessResponse, createErrorResponse } from "@/backend/api/mappers";
import { InMemoryGeoClient } from "@/backend/geo/geoClient";
import { toTrueSolarTime, fallbackSolarTime } from "@/backend/bazi/solarTime";
import { calculateChart, type BirthInputWithLocation } from "@/backend/bazi/calculationEngine";
import { analyzeChart } from "@/backend/agents/analystAgent";
import { generateBasicReport } from "@/backend/agents/writerAgent";
import { createLLMClient } from "@/backend/llm/createLLMClient";

/**
 * 处理报告初始化请求
 */
export async function POST(request: NextRequest) {
  try {
    // 解析并验证请求体
    const body = await request.json();
    const birthInput = validateBirthInput(body);

    // 步骤 1: 地理编码（获取城市坐标）
    const geoClient = new InMemoryGeoClient();
    const citySuggestions = await geoClient.searchCity(birthInput.birthCity);

    let solarTime;
    if (citySuggestions.length > 0 && citySuggestions[0]) {
      // 使用第一个匹配的城市
      const cityId = citySuggestions[0].id;
      try {
        // 步骤 2: 计算真太阳时（使用改进的版本，支持时区）
        const geoResult = await geoClient.resolveCoordinates(cityId);
        if (geoResult.coordinates) {
          solarTime = toTrueSolarTime(birthInput.birthDate, geoResult);
        } else {
          solarTime = fallbackSolarTime(birthInput.birthDate);
        }
      } catch (error) {
        // 解析坐标失败，使用 fallback
        solarTime = fallbackSolarTime(birthInput.birthDate);
      }
    } else {
      // 地理编码失败，使用 fallback
      solarTime = fallbackSolarTime(birthInput.birthDate);
    }

    // 步骤 3: 计算八字命盘（Layer 1）
    const chartInput: BirthInputWithLocation = {
      ...birthInput,
      solarTime,
    };
    const chart = await calculateChart(chartInput);

    // 步骤 4: 分析命盘（Layer 2）
    // 使用真实的 LLM 客户端（根据环境变量自动选择 provider）
    const analystLLMClient = createLLMClient();
    const verdict = await analyzeChart(chart, analystLLMClient, birthInput.gender);

    // 步骤 5: 生成基础报告（Layer 3）
    // 使用真实的 LLM 客户端（可以复用同一个实例，也可以创建新实例）
    const writerLLMClient = createLLMClient();
    const currentYear = new Date().getFullYear();
    const report = await generateBasicReport(chart, verdict, writerLLMClient, currentYear, birthInput.gender, birthInput.birthDate);

    // 返回成功响应
    return NextResponse.json(
      createSuccessResponse({
        chart,
        verdict,
        report,
        solarTime,
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
    console.error("报告初始化失败:", error);
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
    return NextResponse.json(
      createErrorResponse(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "服务器内部错误",
        true // LLM 调用等可能可以重试
      ),
      { status: 500 }
    );
  }
}

