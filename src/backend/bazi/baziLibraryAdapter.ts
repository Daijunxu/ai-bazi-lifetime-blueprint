/**
 * 八字库适配器
 * 使用 bazi-calculator-by-alvamind 库进行准确的八字计算
 * 解决月柱基于节气、日柱准确计算等问题
 */

import type {
  ChartJSON,
  FourPillars,
  Pillar,
  HeavenlyStem,
  EarthlyBranch,
} from "@/types/bazi";
import { calculateTenGod } from "./tenGod";
import { getHiddenStemsForBranch } from "./utils";

// 天干地支映射表（中文 -> 英文）
const STEM_MAP: Record<string, HeavenlyStem> = {
  甲: "Jia",
  乙: "Yi",
  丙: "Bing",
  丁: "Ding",
  戊: "Wu",
  己: "Ji",
  庚: "Geng",
  辛: "Xin",
  壬: "Ren",
  癸: "Gui",
};

const BRANCH_MAP: Record<string, EarthlyBranch> = {
  子: "Zi",
  丑: "Chou",
  寅: "Yin",
  卯: "Mao",
  辰: "Chen",
  巳: "Si",
  午: "Wu",
  未: "Wei",
  申: "Shen",
  酉: "You",
  戌: "Xu",
  亥: "Hai",
};

/**
 * 将库返回的中文天干地支转换为我们的类型
 */
function convertStem(stem: string): HeavenlyStem {
  const mapped = STEM_MAP[stem];
  if (!mapped) {
    throw new Error(`Unknown stem: ${stem}`);
  }
  return mapped;
}

function convertBranch(branch: string): EarthlyBranch {
  const mapped = BRANCH_MAP[branch];
  if (!mapped) {
    throw new Error(`Unknown branch: ${branch}`);
  }
  return mapped;
}

/**
 * 使用 bazi-calculator-by-alvamind 库计算四柱
 * 这个库使用准确的日期映射表，正确处理节气和日柱计算
 * 
 * 注意：在 serverless 环境中（如 Vercel），文件系统是只读的，
 * 因此我们直接尝试 import 库，如果失败则抛出错误让调用者使用 fallback
 */
export async function calculateFourPillarsWithLibrary(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0
): Promise<FourPillars> {
  let pillars: any;
  
  try {
    // 尝试直接 import 库（在构建时应该已经编译）
    // 使用动态 import 和类型断言以避免构建时的类型错误
    // @ts-ignore - 忽略第三方库的类型错误
    const baziModule = await import("bazi-calculator-by-alvamind/src/bazi-calculator");
    // @ts-ignore
    const BaziCalculator = baziModule.BaziCalculator || (baziModule as any).default?.BaziCalculator;
    
    if (!BaziCalculator) {
      throw new Error("无法找到 BaziCalculator 类");
    }
    
    // @ts-ignore
    const calc = new BaziCalculator(year, month, day, hour);
    // @ts-ignore
    pillars = calc.calculatePillars();
    
    if (!pillars) {
      throw new Error("库返回空结果");
    }
  } catch (e) {
    // 在 serverless 环境中，如果直接 import 失败，抛出错误让调用者使用 fallback
    throw new Error(
      `无法使用 bazi-calculator-by-alvamind 库计算四柱。` +
      `错误: ${e instanceof Error ? e.message : String(e)}。` +
      `将使用简化算法作为后备方案。`
    );
  }
  
  if (!pillars) {
    throw new Error("无法计算四柱：库返回空结果");
  }

  // 提取中文表示（例如 "己巳"）
  const yearPillarStr = pillars.year.chinese; // "己巳"
  const monthPillarStr = pillars.month.chinese; // "丁卯"
  const dayPillarStr = pillars.day.chinese; // "乙亥"
  const hourPillarStr = pillars.time.chinese; // "庚辰"

  // 解析天干地支（每个 pillar.chinese 是两字符字符串，如 "己巳"）
  const yearStem = convertStem(yearPillarStr[0]);
  const yearBranch = convertBranch(yearPillarStr[1]);
  const monthStem = convertStem(monthPillarStr[0]);
  const monthBranch = convertBranch(monthPillarStr[1]);
  const dayStem = convertStem(dayPillarStr[0]);
  const dayBranch = convertBranch(dayPillarStr[1]);
  const hourStem = convertStem(hourPillarStr[0]);
  const hourBranch = convertBranch(hourPillarStr[1]);

  // 构建藏干
  const buildPillar = (
    stem: HeavenlyStem,
    branch: EarthlyBranch,
    dayMaster: HeavenlyStem
  ): Pillar => {
    const hiddenStemsData = getHiddenStemsForBranch(branch);
    return {
      heavenlyStem: stem,
      earthlyBranch: branch,
      hiddenStems: hiddenStemsData.map((h) => ({
        stem: h.stem,
        tenGod: calculateTenGod(dayMaster, h.stem),
        strength: h.strength,
      })),
    };
  };

  const dayMaster = dayStem;

  return {
    year: buildPillar(yearStem, yearBranch, dayMaster),
    month: buildPillar(monthStem, monthBranch, dayMaster),
    day: buildPillar(dayStem, dayBranch, dayMaster),
    hour: buildPillar(hourStem, hourBranch, dayMaster),
  };
}

