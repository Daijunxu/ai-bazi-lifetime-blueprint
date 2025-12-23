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
    // 在导入库之前，尝试设置文件路径
    // 库使用 __dirname 来查找 dates_mapping.json，但在 Next.js serverless 环境中可能不正确
    const path = require("path");
    const fs = require("fs");
    
    // 查找 dates_mapping.json 文件的正确路径
    let datesMappingPath: string | null = null;
    const possiblePaths = [
      path.join(process.cwd(), "node_modules", "bazi-calculator-by-alvamind", "src", "dates_mapping.json"),
      path.join(process.cwd(), ".next", "server", "node_modules", "bazi-calculator-by-alvamind", "src", "dates_mapping.json"),
      path.resolve(process.cwd(), "node_modules/bazi-calculator-by-alvamind/src/dates_mapping.json"),
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        datesMappingPath = possiblePath;
        break;
      }
    }
    
    if (!datesMappingPath) {
      throw new Error("无法找到 dates_mapping.json 文件");
    }
    
    // 在 Next.js serverless 环境中，需要将文件复制到库期望的位置
    // 库期望文件在 __dirname/../dates_mapping.json
    // 但我们可以通过修改库的加载逻辑来解决这个问题
    // 由于无法直接修改第三方库，我们需要使用一个 workaround
    
    // 尝试直接 import 库
    // @ts-ignore - 忽略第三方库的类型错误
    const baziModule = await import("bazi-calculator-by-alvamind/src/bazi-calculator");
    // @ts-ignore
    const BaziCalculator = baziModule.BaziCalculator || (baziModule as any).default?.BaziCalculator;
    
    if (!BaziCalculator) {
      throw new Error("无法找到 BaziCalculator 类");
    }
    
    // 尝试创建计算器
    // 如果失败，可能是因为文件路径问题
    try {
      // @ts-ignore
      const calc = new BaziCalculator(year, month, day, hour);
      // @ts-ignore
      pillars = calc.calculatePillars();
    } catch (fileError: any) {
      // 如果是因为文件路径问题，尝试将文件复制到期望的位置
      if (fileError.message && fileError.message.includes("dates_mapping.json")) {
        // 获取库期望的文件路径（基于 __dirname）
        const utilsModule = await import("bazi-calculator-by-alvamind/src/utils/date-mapping");
        // 库期望的路径是 __dirname/../dates_mapping.json
        // 在 Next.js 中，__dirname 可能指向 .next/server/chunks/ 或类似位置
        // 我们需要将文件复制到那里，或者修改库的行为
        
        // 由于无法直接修改库，我们只能抛出错误，让调用者使用 fallback
        throw new Error(
          `库无法找到 dates_mapping.json 文件。` +
          `文件存在于: ${datesMappingPath}，` +
          `但库期望的位置可能不同。` +
          `在 Next.js serverless 环境中，建议使用简化算法作为后备方案。`
        );
      }
      throw fileError;
    }
    
    if (!pillars) {
      throw new Error("库返回空结果");
    }

    // 调试：输出库返回的原始数据
    // 注意：在生产环境也输出，以便排查问题
    console.log("[Bazi Library] 输入参数:", { year, month, day, hour, minute });
    console.log("[Bazi Library] 返回数据（完整）:", JSON.stringify(pillars, null, 2));
    console.log("[Bazi Library] 返回数据（各柱）:", {
      year: pillars.year,
      month: pillars.month,
      day: pillars.day,
      time: pillars.time,
    });
    // 检查 pillars 对象的所有键
    console.log("[Bazi Library] pillars 对象的所有键:", Object.keys(pillars || {}));
    // 检查每个柱的所有属性
    if (pillars.year) console.log("[Bazi Library] year 属性:", Object.keys(pillars.year));
    if (pillars.month) console.log("[Bazi Library] month 属性:", Object.keys(pillars.month));
    if (pillars.day) console.log("[Bazi Library] day 属性:", Object.keys(pillars.day));
    if (pillars.time) console.log("[Bazi Library] time 属性:", Object.keys(pillars.time));
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

  // 提取天干地支
  // 库可能返回多种格式：chinese 字符串（如 "己巳"）或 stem/branch 对象
  const extractPillar = (pillar: any): { stem: string; branch: string } => {
    // 如果库直接返回 stem 和 branch 字段
    if (pillar.stem && pillar.branch) {
      const stemStr: string = typeof pillar.stem === "string" 
        ? pillar.stem 
        : (pillar.stem as any)?.chinese || String(pillar.stem);
      const branchStr: string = typeof pillar.branch === "string" 
        ? pillar.branch 
        : (pillar.branch as any)?.chinese || String(pillar.branch);
      return {
        stem: stemStr,
        branch: branchStr,
      };
    }
    
    // 如果返回 chinese 字符串（如 "己巳"）
    if (pillar.chinese && typeof pillar.chinese === "string") {
      const chars = Array.from(pillar.chinese);
      if (chars.length < 2) {
        throw new Error(`Invalid pillar chinese string: ${pillar.chinese}`);
      }
      const stemChar = chars[0];
      const branchChar = chars[1];
      if (!stemChar || !branchChar || typeof stemChar !== "string" || typeof branchChar !== "string") {
        throw new Error(`Invalid pillar chinese string: ${pillar.chinese}`);
      }
      return {
        stem: stemChar,
        branch: branchChar,
      };
    }
    
    throw new Error(`Unknown pillar format: ${JSON.stringify(pillar)}`);
  };

  const yearPillar = extractPillar(pillars.year);
  const monthPillar = extractPillar(pillars.month);
  const dayPillar = extractPillar(pillars.day);
  const hourPillar = extractPillar(pillars.time);

  // 调试：输出提取的柱数据
  if (process.env.NODE_ENV === "development") {
    console.log("[Bazi Library] 提取的柱数据:", {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    });
  }

  // 解析天干地支
  const yearStem = convertStem(yearPillar.stem);
  const yearBranch = convertBranch(yearPillar.branch);
  const monthStem = convertStem(monthPillar.stem);
  const monthBranch = convertBranch(monthPillar.branch);
  const dayStem = convertStem(dayPillar.stem);
  const dayBranch = convertBranch(dayPillar.branch);
  const hourStem = convertStem(hourPillar.stem);
  const hourBranch = convertBranch(hourPillar.branch);

  // 调试：输出转换后的天干地支
  if (process.env.NODE_ENV === "development") {
    console.log("[Bazi Library] 转换后的天干地支:", {
      year: `${yearStem}${yearBranch}`,
      month: `${monthStem}${monthBranch}`,
      day: `${dayStem}${dayBranch}`,
      hour: `${hourStem}${hourBranch}`,
    });
  }

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

