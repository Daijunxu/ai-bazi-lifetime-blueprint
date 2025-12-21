/**
 * 报告层（前端展示 + Writer Agent 输出）的数据结构。
 */

// 基础报告的章节 ID，方便前端锚点导航
export type BasicReportSectionId =
  | "core-personality"
  | "career-wealth"
  | "relationship"
  | "health"
  | "current-luck"
  | "current-year";

export interface BasicReportSection {
  id: BasicReportSectionId;
  title: string; // 简体中文标题
  markdown: string;
}

// Writer Agent 输出的基础报告（简化版本，包含完整 Markdown）
export interface BasicReport {
  content: string; // 完整的 Markdown 内容
  language: "zh-CN";
  sections: BasicReportSectionId[]; // 章节 ID 列表，用于前端导航
}

// 前端解析后的报告结构（可选，用于更复杂的展示）
export interface ParsedBasicReport {
  language: "zh-CN";
  generatedAt: string; // ISO 字符串
  sections: BasicReportSection[];
}

// 年度详细报告
export interface YearReport {
  year: number;
  language: "zh-CN";
  content: string; // Markdown 内容
}


