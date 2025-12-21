/**
 * 互动矩阵（冲合刑害）计算模块
 */

import type {
  FourPillars,
  InteractionMatrix,
  InteractionEntry,
  EarthlyBranch,
} from "@/types/bazi";
import { EARTHLY_BRANCHES } from "./utils";

/**
 * 地支六冲关系
 */
const CHONG_MAP: Record<EarthlyBranch, EarthlyBranch> = {
  Zi: "Wu",
  Chou: "Wei",
  Yin: "Shen",
  Mao: "You",
  Chen: "Xu",
  Si: "Hai",
  Wu: "Zi",
  Wei: "Chou",
  Shen: "Yin",
  You: "Mao",
  Xu: "Chen",
  Hai: "Si",
};

/**
 * 地支六合关系（简化：只处理主要六合）
 */
const HE_MAP: Record<EarthlyBranch, EarthlyBranch | null> = {
  Zi: "Chou",
  Chou: "Zi",
  Yin: "Hai",
  Mao: null,
  Chen: "You",
  Si: null,
  Wu: "Wei",
  Wei: "Wu",
  Shen: "Si",
  You: "Chen",
  Xu: "Mao",
  Hai: "Yin",
};

/**
 * 检查两个地支是否相冲
 */
function isChong(branch1: EarthlyBranch, branch2: EarthlyBranch): boolean {
  return CHONG_MAP[branch1] === branch2;
}

/**
 * 检查两个地支是否相合
 */
function isHe(branch1: EarthlyBranch, branch2: EarthlyBranch): boolean {
  return HE_MAP[branch1] === branch2;
}

/**
 * 检查两个地支是否相刑（简化版本，只处理主要三刑）
 */
function isXing(branch1: EarthlyBranch, branch2: EarthlyBranch): boolean {
  // 简化：只处理无恩之刑（寅巳申）、恃势之刑（丑未戌）、无礼之刑（子卯）
  const xingGroups: EarthlyBranch[][] = [
    ["Yin", "Si", "Shen"],
    ["Chou", "Wei", "Xu"],
    ["Zi", "Mao"],
  ];

  return xingGroups.some(
    (group) => group.includes(branch1) && group.includes(branch2) && branch1 !== branch2
  );
}

/**
 * 检查两个地支是否相害（简化版本）
 */
function isHai(branch1: EarthlyBranch, branch2: EarthlyBranch): boolean {
  // 六害：子未、丑午、寅巳、卯辰、申亥、酉戌
  const haiPairs: Array<[EarthlyBranch, EarthlyBranch]> = [
    ["Zi", "Wei"],
    ["Chou", "Wu"],
    ["Yin", "Si"],
    ["Mao", "Chen"],
    ["Shen", "Hai"],
    ["You", "Xu"],
  ];

  return haiPairs.some(
    ([a, b]) =>
      (a === branch1 && b === branch2) || (a === branch2 && b === branch1)
  );
}

/**
 * 计算四柱之间的互动关系
 */
export function calculateInteractionMatrix(
  fourPillars: FourPillars
): InteractionMatrix {
  const entries: InteractionEntry[] = [];
  const pillars = [
    { key: "year" as const, pillar: fourPillars.year },
    { key: "month" as const, pillar: fourPillars.month },
    { key: "day" as const, pillar: fourPillars.day },
    { key: "hour" as const, pillar: fourPillars.hour },
  ];

  // 检查所有柱之间的冲合刑害关系
  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const pillar1 = pillars[i];
      const pillar2 = pillars[j];
      if (!pillar1 || !pillar2) continue;
      const branch1 = pillar1.pillar.earthlyBranch;
      const branch2 = pillar2.pillar.earthlyBranch;

      if (isChong(branch1, branch2)) {
        entries.push({
          type: "chong",
          from: pillar1.key,
          to: pillar2.key,
          description: `${pillar1.key}冲${pillar2.key}`,
        });
      }

      if (isHe(branch1, branch2)) {
        entries.push({
          type: "he",
          from: pillar1.key,
          to: pillar2.key,
          description: `${pillar1.key}合${pillar2.key}`,
        });
      }

      if (isXing(branch1, branch2)) {
        entries.push({
          type: "xing",
          from: pillar1.key,
          to: pillar2.key,
          description: `${pillar1.key}刑${pillar2.key}`,
        });
      }

      if (isHai(branch1, branch2)) {
        entries.push({
          type: "hai",
          from: pillar1.key,
          to: pillar2.key,
          description: `${pillar1.key}害${pillar2.key}`,
        });
      }
    }
  }

  return { entries };
}

