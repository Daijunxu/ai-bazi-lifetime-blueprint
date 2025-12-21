/**
 * 十神计算模块
 */

import type { HeavenlyStem, TenGod } from "@/types/bazi";
import { HEAVENLY_STEMS } from "./utils";

/**
 * 天干的五行属性
 */
function getStemElement(stem: HeavenlyStem): "Wood" | "Fire" | "Earth" | "Metal" | "Water" {
  const elementMap: Record<HeavenlyStem, "Wood" | "Fire" | "Earth" | "Metal" | "Water"> = {
    Jia: "Wood",
    Yi: "Wood",
    Bing: "Fire",
    Ding: "Fire",
    Wu: "Earth",
    Ji: "Earth",
    Geng: "Metal",
    Xin: "Metal",
    Ren: "Water",
    Gui: "Water",
  };
  return elementMap[stem];
}

/**
 * 判断天干阴阳
 */
function isStemYang(stem: HeavenlyStem): boolean {
  const index = HEAVENLY_STEMS.indexOf(stem);
  return index % 2 === 0; // 甲丙戊庚壬为阳
}

/**
 * 根据日主和另一天干计算十神关系
 */
export function calculateTenGod(
  dayMaster: HeavenlyStem,
  otherStem: HeavenlyStem
): TenGod {
  const dayElement = getStemElement(dayMaster);
  const otherElement = getStemElement(otherStem);
  const dayIsYang = isStemYang(dayMaster);
  const otherIsYang = isStemYang(otherStem);

  // 同我者为比肩/劫财
  if (dayElement === otherElement) {
    return dayIsYang === otherIsYang ? "BiJian" : "JieCai";
  }

  // 我生者为食神/伤官
  const generateMap: Record<string, string> = {
    Wood: "Fire",
    Fire: "Earth",
    Earth: "Metal",
    Metal: "Water",
    Water: "Wood",
  };
  if (generateMap[dayElement] === otherElement) {
    return dayIsYang === otherIsYang ? "ShiShen" : "ShangGuan";
  }

  // 我克者为正财/偏财
  const overcomeMap: Record<string, string> = {
    Wood: "Earth",
    Fire: "Metal",
    Earth: "Water",
    Metal: "Wood",
    Water: "Fire",
  };
  if (overcomeMap[dayElement] === otherElement) {
    return dayIsYang === otherIsYang ? "ZhengCai" : "PianCai";
  }

  // 克我者为正官/七杀
  const overcomeByMap: Record<string, string> = {
    Wood: "Metal",
    Fire: "Water",
    Earth: "Wood",
    Metal: "Fire",
    Water: "Earth",
  };
  if (overcomeByMap[dayElement] === otherElement) {
    return dayIsYang === otherIsYang ? "ZhengGuan" : "QiSha";
  }

  // 生我者为正印/偏印
  const generateByMap: Record<string, string> = {
    Wood: "Water",
    Fire: "Wood",
    Earth: "Fire",
    Metal: "Earth",
    Water: "Metal",
  };
  if (generateByMap[dayElement] === otherElement) {
    return dayIsYang === otherIsYang ? "ZhengYin" : "PianYin";
  }

  // 理论上不会到这里，但为了类型安全
  throw new Error(`无法计算十神: ${dayMaster} vs ${otherStem}`);
}

