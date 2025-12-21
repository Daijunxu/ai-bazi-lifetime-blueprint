/**
 * API 响应映射模块
 * 将内部数据结构映射为前端友好的格式
 */

import type { ChartJSON } from "@/types/bazi";
import type { AnalystVerdictJSON } from "@/types/analyst";
import type { BasicReport, YearReport } from "@/types/report";
import type { SolarTimeResult } from "../bazi/solarTime";

/**
 * 报告初始化 API 的响应结构
 */
export interface ReportInitResponse {
  success: true;
  data: {
    chart: ChartJSON;
    verdict: AnalystVerdictJSON;
    report: BasicReport;
    solarTime: SolarTimeResult;
  };
}

/**
 * 年度详细报告 API 的响应结构
 */
export interface YearDetailResponse {
  success: true;
  data: {
    yearReport: YearReport;
  };
}

/**
 * API 错误响应结构
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryable?: boolean;
    details?: unknown;
  };
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  retryable = false,
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      retryable,
      details,
    },
  };
}

