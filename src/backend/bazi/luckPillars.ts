/**
 * 大运（Luck Pillars）计算模块
 */

import type { HeavenlyStem, EarthlyBranch, LuckPillar, Pillar } from "@/types/bazi";
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  getMonthStem,
  getHiddenStemsForBranch,
} from "./utils";
import { calculateTenGod } from "./tenGod";

/**
 * 根据性别和月柱判断大运顺逆
 * 男阳年/女阴年：顺排；男阴年/女阳年：逆排
 */
function shouldReverseLuck(
  yearStem: HeavenlyStem,
  gender: "male" | "female"
): boolean {
  const yearIndex = HEAVENLY_STEMS.indexOf(yearStem);
  const isYearYang = yearIndex % 2 === 0;

  // 男阳年或女阴年：顺排（不逆）
  // 男阴年或女阳年：逆排
  if (gender === "male") {
    return !isYearYang; // 男阴年逆排
  } else {
    return isYearYang; // 女阳年逆排
  }
}

/**
 * 计算下一个或上一个节气的日期（简化版本）
 * 注意：这是简化算法，精确的节气计算需要天文算法
 */
function getNextSolarTerm(birthDate: Date, reverse: boolean): Date {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  
  // 简化的节气日期表（基于公历，每年略有不同）
  // 立春：约2月4-5日，惊蛰：约3月5-6日，清明：约4月4-5日
  // 立夏：约5月5-6日，芒种：约6月5-6日，小暑：约7月7-8日
  // 立秋：约8月7-8日，白露：约9月7-8日，寒露：约10月8-9日
  // 立冬：约11月7-8日，大雪：约12月7-8日，小寒：约1月5-6日
  
  // 节气日期表（简化，使用固定日期）
  const solarTerms = [
    { month: 2, day: 4 },   // 立春
    { month: 3, day: 6 },   // 惊蛰
    { month: 4, day: 5 },   // 清明
    { month: 5, day: 6 },   // 立夏
    { month: 6, day: 6 },   // 芒种
    { month: 7, day: 7 },   // 小暑
    { month: 8, day: 8 },   // 立秋
    { month: 9, day: 8 },   // 白露
    { month: 10, day: 8 },  // 寒露
    { month: 11, day: 8 },  // 立冬
    { month: 12, day: 7 },  // 大雪
    { month: 1, day: 6 },   // 小寒（下一年的）
  ];
  
  if (reverse) {
    // 逆排：找上一个节气
    for (let i = solarTerms.length - 1; i >= 0; i--) {
      const term = solarTerms[i]!;
      let termYear = year;
      if (term.month === 1) {
        termYear = year - 1; // 小寒是上一年的
      }
      const termDate = new Date(termYear, term.month - 1, term.day);
      if (termDate <= birthDate) {
        return termDate;
      }
    }
    // 如果没找到，返回上一年的小寒
    return new Date(year - 1, 0, 6);
  } else {
    // 顺排：找下一个节气
    // 先找今年的节气
    for (const term of solarTerms) {
      const termDate = new Date(year, term.month - 1, term.day);
      if (termDate > birthDate) {
        return termDate;
      }
    }
    // 如果今年的节气都过了，找下一年的第一个节气（立春）
    return new Date(year + 1, 1, 4);
  }
}

/**
 * 计算大运起始年龄
 * 规则：从出生日期到下一个（或上一个）节气的天数，每3天=1岁，每30天=10岁（一步大运）
 */
function calculateStartAge(
  step: number,
  birthDate: Date,
  reverse: boolean
): number {
  // 找到下一个（或上一个）节气
  const solarTermDate = getNextSolarTerm(birthDate, reverse);
  
  // 计算天数差
  const daysDiff = Math.abs(
    Math.floor((solarTermDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  
  // 每3天=1岁，每30天=10岁（一步大运）
  // 第一步大运的起始年龄 = 天数差 / 3（转换为岁）
  const firstStepStartAge = Math.floor(daysDiff / 3);
  
  // 每步大运10年
  const stepStartAge = firstStepStartAge + (step - 1) * 10;
  
  // 调试日志
  if (process.env.NODE_ENV === "development" || true) {
    console.log(`[Luck Pillars] Step ${step}: birthDate=${birthDate.toISOString()}, solarTerm=${solarTermDate.toISOString()}, daysDiff=${daysDiff}, firstStepStartAge=${firstStepStartAge}, stepStartAge=${stepStartAge}`);
  }
  
  return stepStartAge;
}

/**
 * 根据月柱和方向计算大运柱
 */
function calculateLuckPillar(
  monthStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  step: number,
  reverse: boolean
): Pillar {
  const monthStemIndex = HEAVENLY_STEMS.indexOf(monthStem);
  if (monthStemIndex === -1) {
    throw new Error(`Invalid month stem: ${monthStem}`);
  }
  const monthBranchIndex = EARTHLY_BRANCHES.indexOf(monthBranch);
  if (monthBranchIndex === -1) {
    throw new Error(`Invalid month branch: ${monthBranch}`);
  }

  const direction = reverse ? -1 : 1;
  const newStemIndex =
    (monthStemIndex + direction * step + 10) % 10;
  const newBranchIndex =
    (monthBranchIndex + direction * step + 12) % 12;

  const stem = HEAVENLY_STEMS[newStemIndex];
  const branch = EARTHLY_BRANCHES[newBranchIndex];
  
  if (!stem || !branch) {
    throw new Error(`Invalid stem or branch index: stem=${newStemIndex}, branch=${newBranchIndex}`);
  }

  // 计算藏干（简化：使用基础藏干表）
  const hiddenStemsData = getHiddenStemsForBranch(branch);
  const dayMaster = monthStem; // 简化：用月干作为参考（实际应使用日干）

  const hiddenStems = hiddenStemsData.map((h) => ({
    stem: h.stem,
    tenGod: calculateTenGod(dayMaster, h.stem),
    strength: h.strength,
  }));

  return {
    heavenlyStem: stem,
    earthlyBranch: branch,
    hiddenStems,
  };
}

/**
 * 计算所有大运柱（默认计算 8 步，每步 10 年）
 * @param birthDate 出生日期（用于计算起运时间）
 */
export function calculateLuckPillars(
  yearStem: HeavenlyStem,
  monthStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  gender: "male" | "female",
  dayMaster: HeavenlyStem,
  birthDate: Date
): LuckPillar[] {
  const reverse = shouldReverseLuck(yearStem, gender);
  const totalSteps = 8; // 默认 8 步大运

  const luckPillars: LuckPillar[] = [];

  for (let step = 1; step <= totalSteps; step++) {
    const pillar = calculateLuckPillar(monthStem, monthBranch, step, reverse);
    const startAge = calculateStartAge(step, birthDate, reverse);
    const endAge = startAge + 9; // 每步 10 年，所以结束年龄是起始年龄 + 9

    luckPillars.push({
      index: step,
      startAge,
      endAge,
      pillar,
    });
  }

  return luckPillars;
}

