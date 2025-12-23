/**
 * 八字计算的基础工具函数
 */

import type { HeavenlyStem, EarthlyBranch } from "@/types/bazi";

// 天干数组（按顺序）
export const HEAVENLY_STEMS: HeavenlyStem[] = [
  "Jia",
  "Yi",
  "Bing",
  "Ding",
  "Wu",
  "Ji",
  "Geng",
  "Xin",
  "Ren",
  "Gui",
];

// 地支数组（按顺序）
export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  "Zi",
  "Chou",
  "Yin",
  "Mao",
  "Chen",
  "Si",
  "Wu",
  "Wei",
  "Shen",
  "You",
  "Xu",
  "Hai",
];

/**
 * 根据年份获取年柱天干（简化算法：基于公元年份）
 * 实际应基于农历年份，这里先用简化版本
 */
export function getYearStem(year: number): HeavenlyStem {
  // 简化：公元年份 - 4，然后 mod 10
  const index = (year - 4) % 10;
  const stem = HEAVENLY_STEMS[index < 0 ? index + 10 : index];
  if (!stem) {
    throw new Error(`Invalid year stem index: ${index}`);
  }
  return stem;
}

/**
 * 根据年份获取年柱地支
 */
export function getYearBranch(year: number): EarthlyBranch {
  // 简化：公元年份 - 4，然后 mod 12
  const index = (year - 4) % 12;
  const branch = EARTHLY_BRANCHES[index < 0 ? index + 12 : index];
  if (!branch) {
    throw new Error(`Invalid year branch index: ${index}`);
  }
  return branch;
}

/**
 * 根据月令（农历月份）和年干获取月柱天干（五虎遁）
 */
export function getMonthStem(
  monthBranch: EarthlyBranch,
  yearStem: HeavenlyStem
): HeavenlyStem {
  const yearIndex = HEAVENLY_STEMS.indexOf(yearStem);

  // 五虎遁口诀：甲己之年丙作首，乙庚之年戊为头，丙辛之年寻庚起，丁壬壬寅顺水流，若问戊癸何处起，甲寅之上好追求
  // 注意：五虎遁表是按农历月份顺序（寅、卯、辰、巳、午、未、申、酉、戌、亥、子、丑）排列的
  // 农历月份与地支的对应关系：
  // 正月=寅(2), 二月=卯(3), 三月=辰(4), 四月=巳(5), 五月=午(6), 六月=未(7),
  // 七月=申(8), 八月=酉(9), 九月=戌(10), 十月=亥(11), 十一月=子(0), 十二月=丑(1)
  const monthBranchToLunarMonth: Record<EarthlyBranch, number> = {
    Yin: 0,   // 正月（寅月）
    Mao: 1,   // 二月（卯月）
    Chen: 2,  // 三月（辰月）
    Si: 3,    // 四月（巳月）
    Wu: 4,    // 五月（午月）
    Wei: 5,   // 六月（未月）
    Shen: 6,  // 七月（申月）
    You: 7,   // 八月（酉月）
    Xu: 8,    // 九月（戌月）
    Hai: 9,   // 十月（亥月）
    Zi: 10,   // 十一月（子月）
    Chou: 11, // 十二月（丑月）
  };

  const lunarMonthIndex = monthBranchToLunarMonth[monthBranch];
  if (lunarMonthIndex === undefined) {
    throw new Error(`Invalid month branch: ${monthBranch}`);
  }

  // 五虎遁表：按农历月份顺序（正月到十二月）
  const monthStemMap: Record<number, number[]> = {
    0: [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3], // 甲己年：正月起丙(2)，二月丁(3)，三月戊(4)...
    1: [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5], // 乙庚年：正月起戊(4)，二月己(5)...
    2: [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7], // 丙辛年：正月起庚(6)，二月辛(7)...
    3: [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // 丁壬年：正月起壬(8)，二月癸(9)...
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1], // 戊癸年：正月起甲(0)，二月乙(1)...
  };

  const groupIndex = yearIndex % 5;
  const stemMap = monthStemMap[groupIndex];
  if (!stemMap) {
    throw new Error(`Invalid group index: ${groupIndex}`);
  }
  const stemIndex = stemMap[lunarMonthIndex];
  if (stemIndex === undefined) {
    throw new Error(`Invalid lunar month index: ${lunarMonthIndex}`);
  }
  const stem = HEAVENLY_STEMS[stemIndex];
  if (!stem) {
    throw new Error(`Invalid month stem index: ${stemIndex}`);
  }
  return stem;
}

/**
 * 根据日期获取日柱
 * 使用万年历算法，基于 1924-02-05 作为基准日
 * 通过调整偏移量来得到正确的日柱
 */
export function getDayPillar(date: Date): {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
} {
  // 使用 1924-02-05 作为基准日
  // 注意：这里使用本地时间，因为输入的 date 也是本地时间
  const baseDate = new Date(1924, 1, 5, 0, 0, 0, 0);
  
  // 将输入日期标准化为本地时间的 00:00:00
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  );
  
  // 计算天数差
  const daysDiff = Math.floor(
    (localDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 通过验证1989-03-16是乙亥（1, 11），反推出1924-02-05的偏移量
  // 从1924-02-05到1989-03-16的天数差是23781
  // 23781 % 10 = 1, 23781 % 12 = 9
  // 如果1989-03-16是乙亥（1, 11），那么1924-02-05应该是：
  // 天干：从1往前推1个，得到0（甲）
  // 地支：从11往前推9个，得到 (11 - 9 + 12) % 12 = 2（寅）
  // 所以1924-02-05是甲寅日，偏移量是天干0，地支2
  const stemOffset = 0; // 甲
  const branchOffset = 2; // 寅
  
  const stemIndex = ((daysDiff + stemOffset) % 10 + 10) % 10;
  const branchIndex = ((daysDiff + branchOffset) % 12 + 12) % 12;

  const stem = HEAVENLY_STEMS[stemIndex];
  const branch = EARTHLY_BRANCHES[branchIndex];
  if (!stem || !branch) {
    throw new Error(`Invalid day pillar: stemIndex=${stemIndex}, branchIndex=${branchIndex}, daysDiff=${daysDiff}`);
  }
  return {
    stem,
    branch,
  };
}

/**
 * 根据时支和日干获取时柱天干（五鼠遁）
 */
export function getHourStem(
  hourBranch: EarthlyBranch,
  dayStem: HeavenlyStem
): HeavenlyStem {
  const dayIndex = HEAVENLY_STEMS.indexOf(dayStem);
  const hourIndex = EARTHLY_BRANCHES.indexOf(hourBranch);

  // 五鼠遁口诀：甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途
  const hourStemMap: Record<number, number[]> = {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1], // 甲己日
    1: [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3], // 乙庚日
    2: [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5], // 丙辛日
    3: [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7], // 丁壬日
    4: [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // 戊癸日
  };

  const groupIndex = dayIndex % 5;
  const stemMap = hourStemMap[groupIndex];
  if (!stemMap) {
    throw new Error(`Invalid group index: ${groupIndex}`);
  }
  const stemIndex = stemMap[hourIndex];
  if (stemIndex === undefined) {
    throw new Error(`Invalid hour index: ${hourIndex}`);
  }
  const stem = HEAVENLY_STEMS[stemIndex];
  if (!stem) {
    throw new Error(`Invalid hour stem index: ${stemIndex}`);
  }
  return stem;
}

/**
 * 根据小时数（0-23）转换为时支
 */
export function hourToBranch(hour: number): EarthlyBranch {
  // 子时：23-1, 丑时：1-3, ..., 亥时：21-23
  const adjustedHour = hour === 0 ? 24 : hour;
  const branchIndex = Math.floor((adjustedHour + 1) / 2) % 12;
  const branch = EARTHLY_BRANCHES[branchIndex];
  if (!branch) {
    throw new Error(`Invalid hour branch index: ${branchIndex}`);
  }
  return branch;
}

/**
 * 获取地支对应的藏干（简化版本，每个地支最多 3 个藏干）
 */
export function getHiddenStemsForBranch(
  branch: EarthlyBranch
): Array<{ stem: HeavenlyStem; strength: "weak" | "medium" | "strong" }> {
  // 藏干表（简化）
  const hiddenStemMap: Record<
    EarthlyBranch,
    Array<{ stem: HeavenlyStem; strength: "weak" | "medium" | "strong" }>
  > = {
    Zi: [{ stem: "Gui", strength: "strong" }],
    Chou: [
      { stem: "Ji", strength: "medium" },
      { stem: "Gui", strength: "weak" },
      { stem: "Xin", strength: "weak" },
    ],
    Yin: [
      { stem: "Jia", strength: "strong" },
      { stem: "Bing", strength: "medium" },
      { stem: "Wu", strength: "weak" },
    ],
    Mao: [{ stem: "Yi", strength: "strong" }],
    Chen: [
      { stem: "Wu", strength: "medium" },
      { stem: "Yi", strength: "weak" },
      { stem: "Gui", strength: "weak" },
    ],
    Si: [
      { stem: "Bing", strength: "strong" },
      { stem: "Wu", strength: "medium" },
      { stem: "Geng", strength: "weak" },
    ],
    Wu: [
      { stem: "Ding", strength: "strong" },
      { stem: "Ji", strength: "medium" },
    ],
    Wei: [
      { stem: "Ji", strength: "medium" },
      { stem: "Ding", strength: "weak" },
      { stem: "Yi", strength: "weak" },
    ],
    Shen: [
      { stem: "Geng", strength: "strong" },
      { stem: "Ren", strength: "medium" },
      { stem: "Wu", strength: "weak" },
    ],
    You: [{ stem: "Xin", strength: "strong" }],
    Xu: [
      { stem: "Wu", strength: "medium" },
      { stem: "Xin", strength: "weak" },
      { stem: "Ding", strength: "weak" },
    ],
    Hai: [
      { stem: "Ren", strength: "strong" },
      { stem: "Jia", strength: "medium" },
    ],
  };

  const result = hiddenStemMap[branch];
  if (!result) {
    // 如果找不到对应的藏干，返回空数组（不应该发生，但为了安全）
    console.warn(`未找到地支 ${branch} 的藏干数据`);
    return [];
  }
  return result;
}

