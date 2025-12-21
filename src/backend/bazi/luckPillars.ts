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
 * 计算大运起始年龄（简化：每步大运 10 年，从出生后开始）
 */
function calculateStartAge(step: number): number {
  return (step - 1) * 10;
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
  const monthBranchIndex = EARTHLY_BRANCHES.indexOf(monthBranch);

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
 */
export function calculateLuckPillars(
  yearStem: HeavenlyStem,
  monthStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  gender: "male" | "female",
  dayMaster: HeavenlyStem
): LuckPillar[] {
  const reverse = shouldReverseLuck(yearStem, gender);
  const totalSteps = 8; // 默认 8 步大运

  const luckPillars: LuckPillar[] = [];

  for (let step = 1; step <= totalSteps; step++) {
    const pillar = calculateLuckPillar(monthStem, monthBranch, step, reverse);
    const startAge = calculateStartAge(step);
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

