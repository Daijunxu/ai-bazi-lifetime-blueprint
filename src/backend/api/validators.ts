/**
 * API 输入验证模块
 * 使用 Zod 进行类型安全的输入验证
 */

import { z } from "zod";

/**
 * 出生信息输入 Schema
 */
export const BirthInputSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(["male", "female"]),
  birthDate: z.string().refine((val) => {
    // 允许本地时间字符串（不带时区）或完整的 ISO 8601 格式
    // 例如：1989-03-16T08:00:00 或 1989-03-16T08:00:00Z
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, {
    message: "Invalid datetime string",
  }),
  birthCity: z.string().min(1, "出生城市不能为空"),
  /**
   * 出生城市的内部 ID（来自城市搜索接口），用于精确解析经纬度与时区
   * 老数据/手填城市可能没有该字段，因此为可选
   */
  birthCityId: z.string().optional(),
});

export type BirthInput = z.infer<typeof BirthInputSchema>;

/**
 * 年度详细报告请求 Schema
 */
export const YearDetailRequestSchema = z.object({
  chart: z.any(), // ChartJSON 类型，这里简化处理
  year: z.number().int().min(1900).max(2100),
});

export type YearDetailRequest = z.infer<typeof YearDetailRequestSchema>;

/**
 * 验证并解析请求体
 */
export function validateBirthInput(data: unknown): BirthInput {
  return BirthInputSchema.parse(data);
}

/**
 * 验证年度详细报告请求
 */
export function validateYearDetailRequest(data: unknown): YearDetailRequest {
  return YearDetailRequestSchema.parse(data);
}

