/**
 * Layer 1: 八字计算引擎主入口
 * 完全确定性的计算，不涉及任何 AI
 */

import type {
  ChartJSON,
  FourPillars,
  Pillar,
  EarthlyBranch,
  HeavenlyStem,
} from "@/types/bazi";
import {
  getYearStem,
  getYearBranch,
  getMonthStem,
  getDayPillar,
  getHourStem,
  hourToBranch,
  getHiddenStemsForBranch,
} from "./utils";
import { calculateTenGod } from "./tenGod";
import { calculateLuckPillars } from "./luckPillars";
import { calculateInteractionMatrix } from "./interactionMatrix";
import { calculateStarGods } from "./starGods";
import type { SolarTimeResult } from "./solarTime";
import { calculateFourPillarsWithLibrary } from "./baziLibraryAdapter";
import { getTimezoneOffsetHours } from "./solarTime";

/**
 * 出生信息输入
 */
export interface BirthInput {
  name?: string;
  gender: "male" | "female";
  birthDate: string; // ISO 8601 格式，例如 "1990-01-15T14:30:00"
  birthCity: string;
}

/**
 * 带地理位置信息的输入
 */
export interface BirthInputWithLocation extends BirthInput {
  solarTime: SolarTimeResult;
}

/**
 * 根据农历月份获取月支（简化：基于公历月份近似）
 * 实际应基于节气，这里先用简化版本
 */
function getMonthBranch(month: number): EarthlyBranch {
  // 简化：公历月份 - 1 对应月支（实际应基于节气）
  const monthBranchMap: EarthlyBranch[] = [
    "Yin", // 正月（立春后）
    "Mao", // 二月
    "Chen", // 三月
    "Si", // 四月
    "Wu", // 五月
    "Wei", // 六月
    "Shen", // 七月
    "You", // 八月
    "Xu", // 九月
    "Hai", // 十月
    "Zi", // 十一月
    "Chou", // 十二月
  ];
  // 确保月份在有效范围内
  const index = Math.max(0, Math.min(11, month - 1));
  const branch = monthBranchMap[index];
  if (!branch) {
    throw new Error(`Invalid month branch index: ${index}`);
  }
  return branch;
}

/**
 * 构建完整的四柱
 */
function buildFourPillars(
  solarDate: Date,
  dayMaster: HeavenlyStem
): FourPillars {
  const year = solarDate.getFullYear();
  const month = solarDate.getMonth() + 1;
  const hour = solarDate.getHours();

  // 年柱
  const yearStem = getYearStem(year);
  const yearBranch = getYearBranch(year);
  const yearHiddenStems = getHiddenStemsForBranch(yearBranch).map((h) => ({
    stem: h.stem,
    tenGod: calculateTenGod(dayMaster, h.stem),
    strength: h.strength,
  }));

  // 月柱
  const monthBranch = getMonthBranch(month);
  const monthStem = getMonthStem(monthBranch, yearStem);
  const monthHiddenStems = getHiddenStemsForBranch(monthBranch).map((h) => ({
    stem: h.stem,
    tenGod: calculateTenGod(dayMaster, h.stem),
    strength: h.strength,
  }));

  // 日柱
  const dayPillar = getDayPillar(solarDate);
  const dayHiddenStems = getHiddenStemsForBranch(dayPillar.branch).map((h) => ({
    stem: h.stem,
    tenGod: calculateTenGod(dayMaster, h.stem),
    strength: h.strength,
  }));

  // 时柱
  const hourBranch = hourToBranch(hour);
  const hourStem = getHourStem(hourBranch, dayPillar.stem);
  const hourHiddenStems = getHiddenStemsForBranch(hourBranch).map((h) => ({
    stem: h.stem,
    tenGod: calculateTenGod(dayMaster, h.stem),
    strength: h.strength,
  }));

  return {
    year: {
      heavenlyStem: yearStem,
      earthlyBranch: yearBranch,
      hiddenStems: yearHiddenStems,
    },
    month: {
      heavenlyStem: monthStem,
      earthlyBranch: monthBranch,
      hiddenStems: monthHiddenStems,
    },
    day: {
      heavenlyStem: dayPillar.stem,
      earthlyBranch: dayPillar.branch,
      hiddenStems: dayHiddenStems,
    },
    hour: {
      heavenlyStem: hourStem,
      earthlyBranch: hourBranch,
      hiddenStems: hourHiddenStems,
    },
  };
}

/**
 * 主计算函数：从出生信息生成完整的 ChartJSON
 */
export async function calculateChart(
  input: BirthInputWithLocation
): Promise<ChartJSON> {
  let fourPillars: FourPillars;
  let dayMaster: HeavenlyStem;

  // 尝试使用准确的八字库计算
  try {
    // 关键：如果应用了真太阳时，直接使用真太阳时；否则使用原始输入时间
    // 真太阳时已经在 solarTime.ts 中考虑了经度校正和均时差，所以这里直接使用即可
    let finalDate: Date;
    
    // 从真太阳时或原始输入时间中提取年月日时分
    // 关键：八字库期望接收的是真太阳时的本地时间组件，而不是 UTC 时间
    let year: number, month: number, day: number, hour: number, minute: number;
    
    if (input.solarTime.applied) {
      // 使用真太阳时（已经包含了经度校正和均时差）
      // solarTimeIso 是目标时区的本地时间字符串（格式：YYYY-MM-DDTHH:mm:ss）
      // 直接解析字符串提取时间组件，避免时区转换问题
      const solarTimeString = input.solarTime.solarTimeIso;
      const match = solarTimeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
      if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
        hour = parseInt(match[4], 10);
        minute = parseInt(match[5], 10);
      } else {
        // 如果格式不匹配，回退到 Date 解析（可能有时区问题）
        const tempDate = new Date(solarTimeString);
        year = tempDate.getFullYear();
        month = tempDate.getMonth() + 1;
        day = tempDate.getDate();
        hour = tempDate.getHours();
        minute = tempDate.getMinutes();
      }
    } else {
      // 未应用真太阳时，使用原始输入时间（本地时间字符串）
      const inputDate = new Date(input.birthDate);
      year = inputDate.getFullYear();
      month = inputDate.getMonth() + 1;
      day = inputDate.getDate();
      hour = inputDate.getHours();
      minute = inputDate.getMinutes();
    }

    fourPillars = await calculateFourPillarsWithLibrary(
      year,
      month,
      day,
      hour,
      minute
    );
    dayMaster = fourPillars.day.heavenlyStem;
  } catch (error) {
    // 如果库加载失败，回退到简化算法
    console.warn("使用八字库失败，回退到简化算法:", error);
    
    // 确定最终使用的日期（真太阳时或原始时间）
    // 用于简化算法的回退逻辑
    let year: number, month: number, day: number, hour: number, minute: number;
    
    if (input.solarTime.applied) {
      // 使用真太阳时，直接解析字符串提取时间组件（避免时区转换问题）
      const solarTimeString = input.solarTime.solarTimeIso;
      const match = solarTimeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
      if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
        hour = parseInt(match[4], 10);
        minute = parseInt(match[5], 10);
      } else {
        // 如果格式不匹配，回退到 Date 解析
        const tempDate = new Date(solarTimeString);
        year = tempDate.getFullYear();
        month = tempDate.getMonth() + 1;
        day = tempDate.getDate();
        hour = tempDate.getHours();
        minute = tempDate.getMinutes();
      }
    } else {
      // 未应用真太阳时，使用原始输入时间（本地时间字符串）
      const inputDate = new Date(input.birthDate);
      year = inputDate.getFullYear();
      month = inputDate.getMonth() + 1;
      day = inputDate.getDate();
      hour = inputDate.getHours();
      minute = inputDate.getMinutes();
    }
    
    // 创建 Date 对象用于简化算法（使用本地时间）
    const finalDate = new Date(year, month - 1, day, hour, minute);
    
    // 先计算日柱以获取日主
    const dayPillar = getDayPillar(finalDate);
    dayMaster = dayPillar.stem;

    // 构建四柱（使用简化算法）
    fourPillars = buildFourPillars(finalDate, dayMaster);
  }

  // 计算大运
  const luckPillars = calculateLuckPillars(
    fourPillars.year.heavenlyStem,
    fourPillars.month.heavenlyStem,
    fourPillars.month.earthlyBranch,
    input.gender,
    dayMaster
  );

  // 计算互动矩阵
  const interactionMatrix = calculateInteractionMatrix(fourPillars);

  // 计算神煞
  const starGods = calculateStarGods(fourPillars);

  return {
    fourPillars,
    luckPillars,
    interactionMatrix,
    starGods,
  };
}

