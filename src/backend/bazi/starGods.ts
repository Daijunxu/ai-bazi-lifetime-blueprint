/**
 * 神煞（Star Gods）计算模块
 * 简化版本，先实现部分常见神煞
 */

import type { FourPillars, StarGod, EarthlyBranch, HeavenlyStem } from "@/types/bazi";
import { EARTHLY_BRANCHES, HEAVENLY_STEMS } from "./utils";

/**
 * 计算桃花（简化：基于年支和日支）
 */
function calculateTaoHua(
  fourPillars: FourPillars
): StarGod[] {
  const stars: StarGod[] = [];

  // 桃花口诀：申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子
  const taoHuaMap: Record<EarthlyBranch, EarthlyBranch> = {
    Shen: "You",
    Zi: "You",
    Chen: "You",
    Yin: "Mao",
    Wu: "Mao",
    Xu: "Mao",
    Si: "Wu",
    You: "Wu",
    Chou: "Wu",
    Hai: "Zi",
    Mao: "Zi",
    Wei: "Zi",
  };

  // 检查年支和日支的桃花
  const yearBranch = fourPillars.year.earthlyBranch;
  const dayBranch = fourPillars.day.earthlyBranch;
  const taoHuaYear = taoHuaMap[yearBranch];
  const taoHuaDay = taoHuaMap[dayBranch];

  if (fourPillars.month.earthlyBranch === taoHuaYear) {
    stars.push({
      key: "TaoHua",
      pillar: "month",
      description: "年桃花在月柱",
    });
  }

  if (fourPillars.hour.earthlyBranch === taoHuaDay) {
    stars.push({
      key: "TaoHua",
      pillar: "hour",
      description: "日桃花在时柱",
    });
  }

  return stars;
}

/**
 * 计算天乙贵人（简化版本）
 */
function calculateTianYiGuiRen(
  fourPillars: FourPillars
): StarGod[] {
  const stars: StarGod[] = [];

  // 天乙贵人口诀（简化）：甲戊见牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，庚辛逢虎马
  const guiRenMap: Record<HeavenlyStem, EarthlyBranch[]> = {
    Jia: ["Chou", "Wei"],
    Yi: ["Zi", "Shen"],
    Bing: ["Hai", "You"],
    Ding: ["Hai", "You"],
    Wu: ["Chou", "Wei"],
    Ji: ["Zi", "Shen"],
    Geng: ["Yin", "Wu"],
    Xin: ["Yin", "Wu"],
    Ren: ["Mao", "Si"],
    Gui: ["Mao", "Si"],
  };

  const dayStem = fourPillars.day.heavenlyStem;
  const guiRenBranches = guiRenMap[dayStem];

  // 检查四柱中是否有天乙贵人
  const pillars: Array<{ key: keyof FourPillars; branch: EarthlyBranch }> = [
    { key: "year", branch: fourPillars.year.earthlyBranch },
    { key: "month", branch: fourPillars.month.earthlyBranch },
    { key: "day", branch: fourPillars.day.earthlyBranch },
    { key: "hour", branch: fourPillars.hour.earthlyBranch },
  ];

  pillars.forEach(({ key, branch }) => {
    if (guiRenBranches.includes(branch)) {
      stars.push({
        key: "TianYiGuiRen",
        pillar: key,
        description: "天乙贵人",
      });
    }
  });

  return stars;
}

/**
 * 计算所有神煞
 */
export function calculateStarGods(fourPillars: FourPillars): StarGod[] {
  const stars: StarGod[] = [];

  // 收集各类神煞
  stars.push(...calculateTaoHua(fourPillars));
  stars.push(...calculateTianYiGuiRen(fourPillars));

  // 未来可扩展：太极贵人、文昌、驿马等

  return stars;
}

