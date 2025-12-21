/**
 * 八字与运势相关的核心类型定义。
 * 仅负责「数据形状」，不包含任何计算逻辑。
 */

// 天干
export type HeavenlyStem =
  | "Jia"
  | "Yi"
  | "Bing"
  | "Ding"
  | "Wu"
  | "Ji"
  | "Geng"
  | "Xin"
  | "Ren"
  | "Gui";

// 地支
export type EarthlyBranch =
  | "Zi"
  | "Chou"
  | "Yin"
  | "Mao"
  | "Chen"
  | "Si"
  | "Wu"
  | "Wei"
  | "Shen"
  | "You"
  | "Xu"
  | "Hai";

// 五行
export type FiveElement = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

// 十神（简化，具体映射由计算引擎负责）
export type TenGod =
  | "BiJian"
  | "JieCai"
  | "ShiShen"
  | "ShangGuan"
  | "ZhengCai"
  | "PianCai"
  | "ZhengGuan"
  | "QiSha"
  | "ZhengYin"
  | "PianYin";

// 藏干
export interface HiddenStem {
  stem: HeavenlyStem;
  tenGod: TenGod;
  strength: "weak" | "medium" | "strong";
}

// 单柱
export interface Pillar {
  heavenlyStem: HeavenlyStem;
  earthlyBranch: EarthlyBranch;
  hiddenStems: HiddenStem[];
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
}

// 大运
export interface LuckPillar {
  index: number; // 第几步大运，从 1 开始
  startAge: number;
  endAge: number;
  pillar: Pillar;
}

// 冲合刑害等关系的简化表示
export type InteractionType = "chong" | "he" | "xing" | "hai";

export interface InteractionEntry {
  type: InteractionType;
  from: keyof FourPillars | "luck";
  to: keyof FourPillars | "luck";
  description: string;
}

export interface InteractionMatrix {
  entries: InteractionEntry[];
}

// 神煞（先用通用 key，后续可细分枚举）
export interface StarGod {
  key: string; // 例如: "TaiJiGuiRen", "TaoHua"
  pillar: keyof FourPillars | "luck";
  description: string;
}

// Layer 1 计算引擎输出的标准化 Chart JSON
export interface ChartJSON {
  fourPillars: FourPillars;
  luckPillars: LuckPillar[];
  interactionMatrix: InteractionMatrix;
  starGods: StarGod[];
  // 未来可扩展：节气、流年信息等
}


