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

    let solarTime;
    let resolved = false;

    // 1.1 优先使用前端传入的城市 ID（来自城市搜索接口），避免再次模糊搜索导致经纬度偏差
    if (birthInput.birthCityId) {
      try {
        const geoResult = await geoClient.resolveCoordinates(birthInput.birthCityId);
        if (geoResult.coordinates) {
          solarTime = toTrueSolarTime(birthInput.birthDate, geoResult);
          resolved = true;
        }
      } catch (error) {
        console.warn(
          "[Geo] resolveCoordinates with birthCityId failed, will fallback to name search:",
          error
        );
      }
    }

    // 1.2 如果没有城市 ID，或者通过 ID 解析失败，再根据城市名称模糊搜索
    if (!resolved) {
      // 如果用户传的是带层级的显示名（如 "Seattle, Washington, United States"），先取逗号前的主城市名做匹配
      const searchText =
        birthInput.birthCity.includes(",")
          ? birthInput.birthCity.split(",")[0]!.trim()
          : birthInput.birthCity;

      const citySuggestions = await geoClient.searchCity(searchText);

      if (citySuggestions.length > 0 && citySuggestions[0]) {
        const cityId = citySuggestions[0].id;
        try {
          const geoResult = await geoClient.resolveCoordinates(cityId);
          if (geoResult.coordinates) {
            solarTime = toTrueSolarTime(birthInput.birthDate, geoResult);
            resolved = true;
          }
        } catch (error) {
          console.warn(
            "[Geo] resolveCoordinates with searchCity result failed, will use fallback solar time:",
            error
          );
        }
      }
    }

    // 1.3 如果仍然无法成功解析坐标，则退回到不含真太阳时修正的计算
    if (!resolved) {
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
    
    // 流年取用逻辑：如果当前时间在9月1日及以后，显示下一年的大运
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() 返回 0-11
    const currentDay = now.getDate();
    let reportYear = now.getFullYear();
    
    // 如果当前日期在9月1日及以后，使用下一年
    if (currentMonth > 9 || (currentMonth === 9 && currentDay >= 1)) {
      reportYear = reportYear + 1;
    }
    
    const report = await generateBasicReport(chart, verdict, writerLLMClient, reportYear, birthInput.gender, birthInput.birthDate);

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

