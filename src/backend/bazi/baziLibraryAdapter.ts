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
 * 注意：由于库是 TypeScript 源代码，我们需要使用特殊方法加载
 */
export async function calculateFourPillarsWithLibrary(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0
): Promise<FourPillars> {
  // 使用子进程调用 tsx 来运行 TypeScript 文件（已验证可行）
  // 因为 Next.js 无法直接处理 node_modules 中的 TypeScript 文件
  const { execSync } = require("child_process");
  const path = require("path");
  const fs = require("fs");
  
  // 创建临时脚本文件
  const tempScript = `
import { BaziCalculator } from 'bazi-calculator-by-alvamind/src/bazi-calculator';
const calc = new BaziCalculator(${year}, ${month}, ${day}, ${hour});
const pillars = calc.calculatePillars();
console.log(JSON.stringify(pillars));
`;
  
  const tempPath = path.join(process.cwd(), ".temp-bazi-calc.ts");
  let pillars: any;
  
  try {
    fs.writeFileSync(tempPath, tempScript);
    
    // 使用 tsx 运行 TypeScript 文件
    const result = execSync(`npx tsx ${tempPath}`, {
      encoding: "utf8",
      cwd: process.cwd(),
      timeout: 10000, // 10秒超时
      stdio: ["pipe", "pipe", "pipe"], // 捕获所有输出
    });
    
    // 解析 JSON 结果
    const output = result.trim();
    // 可能有多行输出，取最后一行（JSON）
    const jsonLine = output.split("\n").filter((line: string) => 
      line.trim().startsWith("{")
    ).pop() || output;
    
    pillars = JSON.parse(jsonLine);
  } catch (e) {
    // 清理临时文件
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw new Error(
      `无法使用 bazi-calculator-by-alvamind 库计算四柱。` +
      `错误: ${e instanceof Error ? e.message : String(e)}。` +
      `请确保已安装 tsx: npm install tsx --save-dev`
    );
  } finally {
    // 清理临时文件
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        // 忽略清理错误
      }
    }
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

