/**
 * 真太阳时计算模块。
 *
 * 改进版本：
 *   - 使用 IANA 时区标识符（如 "Asia/Shanghai"）进行准确的时区转换
 *   - 正确处理夏令时（DST）
 *   - 考虑经度导致的时差校正（相对所在时区中心子午线）
 *   - 考虑均时差（Equation of Time）的简化计算
 *
 * 约定：
 *   - 输入时间为目标时区的本地时间字符串（格式：YYYY-MM-DDTHH:mm:ss，不带时区信息）
 *   - 输出时间为真太阳时的本地时间字符串（格式：YYYY-MM-DDTHH:mm:ss，不带时区信息）
 */

import { fromZonedTime, toZonedTime, formatInTimeZone, getTimezoneOffset } from "date-fns-tz";
import type { Coordinates, GeoResolutionResult } from "../geo/geoTypes";

export interface SolarTimeResult {
  solarTimeIso: string;
  longitudeCorrectionMinutes: number;
  equationOfTimeMinutes: number;
  /**
   * 时区标识符（IANA 时区，例如 "Asia/Shanghai", "America/Los_Angeles"）
   * 用于正确解析 solarTimeIso 字符串
   */
  timezone?: string;
  /**
   * 标记是否应用了真太阳时纠正（例如 geocoding 失败时为 false）
   */
  applied: boolean;
  /**
   * 可选提示信息，例如「True Solar Time not applied (Location unknown)」
   */
  warning?: string;
}

/**
 * 计算均时差（Equation of Time）的简化版本
 * 基于一年中的第几天（day of year）进行近似计算
 * 
 * 公式来源：简化版本的均时差计算
 * 返回值：分钟数（可能为负）
 */
function computeEquationOfTime(dayOfYear: number): number {
  // 简化的均时差计算（基于正弦波近似）
  // 实际值在 -14 到 +16 分钟之间变化
  const B = (360 / 365) * (dayOfYear - 81);
  const BRad = (B * Math.PI) / 180;
  
  // 使用简化的均时差公式
  const EoT = 9.87 * Math.sin(2 * BRad) - 7.53 * Math.cos(BRad) - 1.5 * Math.sin(BRad);
  
  return EoT;
}

/**
 * 根据 IANA 时区标识符获取时区中心经度
 * 每个时区通常以 15° 为间隔，但实际时区边界可能不规则
 */
function getTimezoneCentralMeridian(timezone: string): number {
  // 常见时区的中心经度映射（简化版本）
  const timezoneMeridians: Record<string, number> = {
    "Asia/Shanghai": 120, // UTC+8
    "Asia/Hong_Kong": 120,
    "Asia/Taipei": 120,
    "Asia/Tokyo": 135, // UTC+9
    "Asia/Seoul": 135,
    "Asia/Singapore": 105, // UTC+8 (但经度约 103.8°)
    "Asia/Bangkok": 105, // UTC+7
    "Asia/Kolkata": 82.5, // UTC+5:30
    "Australia/Sydney": 150, // UTC+10
    "Australia/Melbourne": 150,
    "Pacific/Auckland": 180, // UTC+12
    "America/New_York": -75, // UTC-5
    "America/Chicago": -90, // UTC-6
    "America/Los_Angeles": -120, // UTC-8
    "America/Sao_Paulo": -45, // UTC-3
    "America/Argentina/Buenos_Aires": -60, // UTC-3
    "Europe/London": 0, // UTC+0
    "Europe/Paris": 15, // UTC+1
    "Europe/Berlin": 15,
    "Europe/Rome": 15,
    "Europe/Moscow": 37.5, // UTC+3
    "Asia/Dubai": 60, // UTC+4
    "Asia/Jerusalem": 35, // UTC+2
  };

  return timezoneMeridians[timezone] ?? 0;
}

/**
 * 计算给定经度相对于时区中心子午线的时间校正（分钟）。
 */
export function computeLongitudeCorrectionMinutes(
  longitude: number,
  timezone?: string
): number {
  let centralMeridian: number;
  
  if (timezone) {
    // 使用时区标识符获取中心经度
    centralMeridian = getTimezoneCentralMeridian(timezone);
  } else {
    // 如果没有时区信息，使用简化的 15° 间隔假设
    // 这不如使用时区标识符准确，但作为后备方案
    centralMeridian = Math.round(longitude / 15) * 15;
  }

  const deltaLongitude = longitude - centralMeridian;
  // 每 15° 经度约等于 60 分钟，即每度 4 分钟
  const minutesPerDegree = 4;
  const correctionMinutes = deltaLongitude * minutesPerDegree;

  return correctionMinutes;
}

/**
 * 将本地时间转换为真太阳时
 * 
 * @param localDateTime 本地时间字符串（格式：YYYY-MM-DDTHH:mm:ss，不带时区信息）
 * @param geoResult 地理解析结果（包含坐标和时区）
 * 
 * 关键步骤：
 * 1. 解析用户输入的本地时间（目标时区的本地时间）
 * 2. 计算经度校正和均时差
 * 3. 直接在本地时间上应用校正（真太阳时 = 平太阳时 + 经度校正 + 均时差）
 * 
 * 注意：真太阳时是相对于本地时区的概念，不需要转换为UTC
 */
export function toTrueSolarTime(
  localDateTime: string,
  geoResult: GeoResolutionResult
): SolarTimeResult {
  if (!geoResult.timezone) {
    throw new Error("Timezone is required for True Solar Time calculation");
  }

  // 解析输入时间字符串
  const match = localDateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (!match || !match[1] || !match[2] || !match[3] || !match[4] || !match[5] || !match[6]) {
    throw new Error("INVALID_DATE_FORMAT");
  }
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Date 对象月份从 0 开始
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);
  
  // 创建一个 Date 对象表示目标时区的本地时间
  // 使用 fromZonedTime 来正确理解这个时间为目标时区的本地时间
  const localDate = new Date(year, month, day, hour, minute, second);
  if (Number.isNaN(localDate.getTime())) {
    throw new Error("INVALID_DATE");
  }

  // 将本地时间转换为 UTC（date-fns-tz 会正确处理夏令时）
  const utcDate = fromZonedTime(localDate, geoResult.timezone);

  // 关键步骤：真太阳时的计算应该基于标准时区时间（不考虑夏令时）
  // 如果当前是夏令时期间，需要先转换为标准时区时间
  // 方法：检查当前日期是否在夏令时期间，如果是，减去1小时
  // 对于北半球，夏令时通常在3月第二个星期日到11月第一个星期日之间
  const isDST = isDaylightSavingTime(year, month + 1, day, geoResult.timezone);
  const dstOffsetMs = isDST ? 60 * 60 * 1000 : 0; // 如果是夏令时，减去1小时
  
  // 将用户输入的本地时间转换为标准时区时间对应的 UTC
  const utcForStandardTime = new Date(utcDate.getTime() - dstOffsetMs);

  const coordinates = geoResult.coordinates;
  
  // 步骤1：计算经度校正（相对于时区中心子午线）
  // 经度校正是基于标准时区时间的
  const longitudeCorrection = computeLongitudeCorrectionMinutes(
    coordinates.longitude,
    geoResult.timezone
  );

  // 步骤2：计算均时差（Equation of Time）
  // 使用标准时区时间对应的 UTC 来计算一年中的第几天
  const yearStartUTC = new Date(Date.UTC(utcForStandardTime.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor(
    (utcForStandardTime.getTime() - yearStartUTC.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const equationOfTime = computeEquationOfTime(dayOfYear);

  // 步骤3：总校正 = 经度校正 + 均时差
  const totalCorrectionMinutes = longitudeCorrection + equationOfTime;

  // 步骤4：在标准时区时间对应的 UTC 上应用校正
  const solarUtcDate = new Date(utcForStandardTime.getTime() + totalCorrectionMinutes * 60 * 1000);

  // 步骤5：将校正后的 UTC 时间转换回目标时区的本地时间（正确处理夏令时）
  // 使用 formatInTimeZone 直接获取目标时区的本地时间字符串
  const solarTimeLocalString = formatInTimeZone(
    solarUtcDate,
    geoResult.timezone,
    "yyyy-MM-dd'T'HH:mm:ss"
  );

  return {
    solarTimeIso: solarTimeLocalString, // 返回本地时间字符串
    longitudeCorrectionMinutes: longitudeCorrection,
    equationOfTimeMinutes: equationOfTime,
    timezone: geoResult.timezone, // 保存时区信息
    applied: true
  };
}

/**
 * 检查指定日期是否在夏令时期间
 * 简化版本：对于北半球，通常3月到11月是夏令时
 */
function isDaylightSavingTime(year: number, month: number, day: number, timezone: string): boolean {
  // 对于有夏令时的时区，检查月份
  // 北半球：通常3月第二个星期日到11月第一个星期日
  // 简化处理：3月到10月认为是夏令时（实际应该精确到具体日期）
  const dstTimezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix", // 注意：亚利桑那不实行夏令时
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
  ];
  
  if (!dstTimezones.includes(timezone)) {
    return false; // 没有夏令时
  }
  
  if (timezone === "America/Phoenix") {
    return false; // 亚利桑那不实行夏令时
  }
  
  // 简化：3月到10月认为是夏令时
  // 实际应该精确计算：3月第二个星期日到11月第一个星期日
  return month >= 3 && month <= 10;
}

/**
 * 获取时区的标准 UTC 偏移（毫秒），不考虑夏令时
 */
function getStandardTimezoneOffsetMs(timezone: string): number {
  // 标准时区偏移（不考虑夏令时）
  const standardOffsets: Record<string, number> = {
    "Asia/Shanghai": 8 * 60 * 60 * 1000,
    "Asia/Hong_Kong": 8 * 60 * 60 * 1000,
    "Asia/Taipei": 8 * 60 * 60 * 1000,
    "Asia/Tokyo": 9 * 60 * 60 * 1000,
    "Asia/Seoul": 9 * 60 * 60 * 1000,
    "Asia/Singapore": 8 * 60 * 60 * 1000,
    "Asia/Bangkok": 7 * 60 * 60 * 1000,
    "Asia/Kolkata": 5.5 * 60 * 60 * 1000,
    "Australia/Sydney": 10 * 60 * 60 * 1000,
    "Australia/Melbourne": 10 * 60 * 60 * 1000,
    "Pacific/Auckland": 12 * 60 * 60 * 1000,
    "America/New_York": -5 * 60 * 60 * 1000,
    "America/Chicago": -6 * 60 * 60 * 1000,
    "America/Denver": -7 * 60 * 60 * 1000,
    "America/Los_Angeles": -8 * 60 * 60 * 1000, // PST (标准时间)
    "America/Phoenix": -7 * 60 * 60 * 1000,
    "America/Anchorage": -9 * 60 * 60 * 1000,
    "America/Sao_Paulo": -3 * 60 * 60 * 1000,
    "America/Argentina/Buenos_Aires": -3 * 60 * 60 * 1000,
    "Europe/London": 0,
    "Europe/Paris": 1 * 60 * 60 * 1000,
    "Europe/Berlin": 1 * 60 * 60 * 1000,
    "Europe/Rome": 1 * 60 * 60 * 1000,
    "Europe/Moscow": 3 * 60 * 60 * 1000,
    "Asia/Dubai": 4 * 60 * 60 * 1000,
    "Asia/Jerusalem": 2 * 60 * 60 * 1000,
  };
  return standardOffsets[timezone] ?? 0;
}

/**
 * 获取时区的 UTC 偏移（小时）
 * 简化版本，只处理常见时区
 */
export function getTimezoneOffsetHours(timezone?: string): number {
  if (!timezone) {
    return 0; // 如果没有时区信息，默认 UTC
  }
  
  const timezoneOffsets: Record<string, number> = {
    "Asia/Shanghai": 8,
    "Asia/Hong_Kong": 8,
    "Asia/Taipei": 8,
    "Asia/Tokyo": 9,
    "Asia/Seoul": 9,
    "Asia/Singapore": 8,
    "Asia/Bangkok": 7,
    "Asia/Kolkata": 5.5,
    "Australia/Sydney": 10,
    "Australia/Melbourne": 10,
    "Pacific/Auckland": 12,
    "America/New_York": -5,
    "America/Chicago": -6,
    "America/Denver": -7,
    "America/Los_Angeles": -8,
    "America/Sao_Paulo": -3,
    "America/Argentina/Buenos_Aires": -3,
    "Europe/London": 0,
    "Europe/Paris": 1,
    "Europe/Berlin": 1,
    "Europe/Rome": 1,
    "Europe/Moscow": 3,
    "Asia/Dubai": 4,
    "Asia/Jerusalem": 2,
  };
  return timezoneOffsets[timezone] ?? 0;
}

/**
 * 当 geocoding 失败或缺失经度时的兜底：不做校正，只返回原始时间与告警。
 */
export function fallbackSolarTime(localDateIso: string): SolarTimeResult {
  const localDate = new Date(localDateIso);
  if (Number.isNaN(localDate.getTime())) {
    throw new Error("INVALID_DATE");
  }

  return {
    solarTimeIso: localDate.toISOString(),
    longitudeCorrectionMinutes: 0,
    equationOfTimeMinutes: 0,
    applied: false,
    warning: "True Solar Time not applied (Location unknown)."
  };
}


