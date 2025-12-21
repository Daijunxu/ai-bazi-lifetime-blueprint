"use client";

/**
 * 四柱详细表格展示组件（接近截图风格）
 * - 列：年柱 / 月柱 / 日柱 / 时柱
 * - 行：天干+十神、地支、藏干+十神
 * - 五行配色：火=红、水=蓝、金=金、木=绿、土=棕（使用内联样式，避免依赖 Tailwind）
 */

import type { CSSProperties } from "react";
import type { ChartJSON, HeavenlyStem, EarthlyBranch, TenGod } from "@/types/bazi";
import { calculateTenGod } from "@/backend/bazi/tenGod";

interface FourPillarsTableProps {
  chart: ChartJSON;
  gender?: "male" | "female";
}

// 天干中文
const STEM_NAMES: Record<HeavenlyStem, string> = {
  Jia: "甲",
  Yi: "乙",
  Bing: "丙",
  Ding: "丁",
  Wu: "戊",
  Ji: "己",
  Geng: "庚",
  Xin: "辛",
  Ren: "壬",
  Gui: "癸",
};

// 地支中文
const BRANCH_NAMES: Record<EarthlyBranch, string> = {
  Zi: "子",
  Chou: "丑",
  Yin: "寅",
  Mao: "卯",
  Chen: "辰",
  Si: "巳",
  Wu: "午",
  Wei: "未",
  Shen: "申",
  You: "酉",
  Xu: "戌",
  Hai: "亥",
};

// 十神中文
const TEN_GOD_NAMES: Record<TenGod, string> = {
  BiJian: "比肩",
  JieCai: "劫财",
  ShiShen: "食神",
  ShangGuan: "伤官",
  // 按用户期望对换 正/偏（财、官、印）
  ZhengCai: "偏财",
  PianCai: "正财",
  ZhengGuan: "七杀",
  QiSha: "正官",
  ZhengYin: "偏印",
  PianYin: "正印",
};

// 天干五行（与 tenGod 模块保持一致）
type Element = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

const STEM_ELEMENT_MAP: Record<HeavenlyStem, Element> = {
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

// 地支主五行（简化，根据常见主气）
const BRANCH_ELEMENT_MAP: Record<EarthlyBranch, Element> = {
  Zi: "Water",
  Chou: "Earth",
  Yin: "Wood",
  Mao: "Wood",
  Chen: "Earth",
  Si: "Fire",
  Wu: "Fire",
  Wei: "Earth",
  Shen: "Metal",
  You: "Metal",
  Xu: "Earth",
  Hai: "Water",
};

// 五行对应颜色（inline style）
const ELEMENT_COLOR_STYLE: Record<Element, CSSProperties> = {
  Fire: { color: "#ef4444" }, // 红
  Water: { color: "#3b82f6" }, // 蓝
  Metal: { color: "#d97706" }, // 金黄
  Wood: { color: "#16a34a" }, // 绿
  Earth: { color: "#92400e" }, // 棕
};

function stemElement(stem: HeavenlyStem): Element {
  return STEM_ELEMENT_MAP[stem];
}

function branchElement(branch: EarthlyBranch): Element {
  return BRANCH_ELEMENT_MAP[branch];
}

export function FourPillarsTable({ chart, gender }: FourPillarsTableProps) {
  const { fourPillars } = chart;
  const dayMaster = fourPillars.day.heavenlyStem;
  
  // 根据性别确定"元男"或"元女"
  const genderLabel = gender === "female" ? "元女" : "元男";

  const pillars = [
    { key: "year", label: "年柱" },
    { key: "month", label: "月柱" },
    { key: "day", label: "日柱" },
    { key: "hour", label: "时柱" },
  ] as const;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
        padding: "clamp(12px, 3vw, 16px)",
        marginBottom: 20,
        width: "100%",
        overflowX: "hidden", // 移除横向滚动，让表格自适应
      }}
    >
      <div
        style={{
          fontSize: "clamp(14px, 3.5vw, 16px)",
          fontWeight: 700,
          color: "#111827",
          marginBottom: 12,
        }}
      >
        命盘排盘（四柱）
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "center",
          fontSize: "clamp(11px, 2.5vw, 13px)",
          tableLayout: "fixed", // 固定表格布局，让列宽平均分配
        }}
      >
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "clamp(10px, 2.2vw, 11px)" }}>
            <th style={{ padding: "clamp(4px, 1vw, 6px) clamp(2px, 0.5vw, 4px)", textAlign: "left" }}>层级</th>
            {pillars.map((p) => (
              <th key={p.key} style={{ padding: "clamp(4px, 1vw, 6px) clamp(2px, 0.5vw, 4px)" }}>
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 天干 + 十神 */}
          <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
            <td style={{ padding: "clamp(4px, 1vw, 6px) clamp(2px, 0.5vw, 4px)", fontSize: "clamp(10px, 2.2vw, 11px)", color: "#6b7280", textAlign: "left" }}>
              天干 / 十神
            </td>
            {pillars.map((p) => {
              const pillar = fourPillars[p.key];
              const stem = pillar.heavenlyStem;
              const el = stemElement(stem);
              const tenGod = calculateTenGod(dayMaster, stem);
              return (
                <td key={p.key} style={{ padding: "clamp(4px, 1vw, 6px) clamp(2px, 0.5vw, 4px)", verticalAlign: "top" }}>
                  <div
                    style={{
                      fontSize: "clamp(16px, 4vw, 20px)",
                      fontWeight: 700,
                      lineHeight: 1.1,
                      ...ELEMENT_COLOR_STYLE[el],
                    }}
                  >
                    {STEM_NAMES[stem]}
                  </div>
                  <div style={{ fontSize: "clamp(9px, 2vw, 10px)", color: "#6b7280", marginTop: 2 }}>
                    {/* 日柱天干下方标注"日主（元男/元女）"，其余柱显示十神 */}
                    {p.key === "day" ? `日主（${genderLabel}）` : TEN_GOD_NAMES[tenGod]}
                  </div>
                </td>
              );
            })}
          </tr>

          {/* 地支 */}
          <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
            <td style={{ padding: "clamp(4px, 1vw, 6px) clamp(2px, 0.5vw, 4px)", fontSize: "clamp(10px, 2.2vw, 11px)", color: "#6b7280", textAlign: "left" }}>
              地支
            </td>
            {pillars.map((p) => {
              const pillar = fourPillars[p.key];
              const branch = pillar.earthlyBranch;
              const el = branchElement(branch);
              return (
                <td key={p.key} style={{ padding: "clamp(4px, 1vw, 6px) clamp(2px, 0.5vw, 4px)" }}>
                  <div
                    style={{
                      fontSize: "clamp(14px, 3.5vw, 18px)",
                      fontWeight: 700,
                      lineHeight: 1.1,
                      ...ELEMENT_COLOR_STYLE[el],
                    }}
                  >
                    {BRANCH_NAMES[branch]}
                  </div>
                </td>
              );
            })}
          </tr>

          {/* 藏干 + 十神 */}
          <tr>
            <td
              style={{
                padding: "clamp(4px, 1vw, 6px) clamp(2px, 0.5vw, 4px)",
                fontSize: "clamp(10px, 2.2vw, 11px)",
                color: "#6b7280",
                textAlign: "left",
                verticalAlign: "top",
              }}
            >
              藏干 / 十神
            </td>
            {pillars.map((p) => {
              const pillar = fourPillars[p.key];
              return (
                <td key={p.key} style={{ padding: "clamp(4px, 1vw, 6px) clamp(2px, 0.5vw, 4px)", verticalAlign: "top" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    {pillar.hiddenStems.map((h, idx) => {
                      const el = stemElement(h.stem);
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            lineHeight: 1.1,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "clamp(12px, 3vw, 14px)",
                              fontWeight: 600,
                              ...ELEMENT_COLOR_STYLE[el],
                            }}
                          >
                            {STEM_NAMES[h.stem]}
                          </span>
                          <span style={{ fontSize: "clamp(8px, 1.8vw, 9px)", color: "#6b7280", marginTop: 1 }}>
                            {TEN_GOD_NAMES[h.tenGod]}{" "}
                            {h.strength === "strong"
                              ? "旺"
                              : h.strength === "medium"
                              ? "平"
                              : "弱"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
