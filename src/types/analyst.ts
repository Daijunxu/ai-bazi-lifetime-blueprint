/**
 * Layer 2：分析 Agent 使用的类型定义。
 * 仅消费 ChartJSON，输出分析结论 JSON。
 */

export type DayMasterStrength = "strong" | "weak" | "follow" | "balanced";

// 命局格局（示例，后续可扩展）
export type ChartStructure =
  | "NormalWealth"
  | "IndirectWealth"
  | "SevenKillings"
  | "ProperAuthority"
  | "EatingGod"
  | "HurtingOfficer"
  | "SpecialStructure"
  | "Unknown";

export interface UsefulGod {
  element: "Wood" | "Fire" | "Earth" | "Metal" | "Water";
  reason: string;
}

export interface UnfavorableElement {
  element: "Wood" | "Fire" | "Earth" | "Metal" | "Water";
  reason: string;
}

export interface AnalystVerdictJSON {
  structure: ChartStructure;
  dayMasterStrength: DayMasterStrength;
  usefulGod: UsefulGod | null;
  unfavorableElements: UnfavorableElement[];
  verdictReasoning: string;
}


