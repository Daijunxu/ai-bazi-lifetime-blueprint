"use client";

/**
 * 技术卡片组件
 * 显示 Analyst Agent 的技术分析结论（格局、身强身弱、用神等）
 * 满足"玻璃盒子"要求，让用户看到分析依据
 */

import type { AnalystVerdictJSON } from "@/types/analyst";

interface TechnicalCardProps {
  verdict: AnalystVerdictJSON;
}

export function TechnicalCard({ verdict }: TechnicalCardProps) {
  // 格局中文映射
  const structureNames: Record<string, string> = {
    NormalWealth: "正财格",
    IndirectWealth: "偏财格",
    SevenKillings: "七杀格",
    ProperAuthority: "正官格",
    EatingGod: "食神格",
    HurtingOfficer: "伤官格",
    SpecialStructure: "特殊格局",
    Unknown: "未确定",
  };

  // 身强身弱中文映射
  const strengthNames: Record<string, string> = {
    strong: "身强",
    weak: "身弱",
    follow: "从格",
    balanced: "平衡",
  };

  // 五行中文映射
  const elementNames: Record<string, string> = {
    Wood: "木",
    Fire: "火",
    Earth: "土",
    Metal: "金",
    Water: "水",
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">技术分析结论</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 格局 */}
        <div className="bg-white rounded-md p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">格局</div>
          <div className="text-lg font-semibold text-gray-900">
            {structureNames[verdict.structure] || verdict.structure}
          </div>
        </div>

        {/* 身强身弱 */}
        <div className="bg-white rounded-md p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">身强身弱</div>
          <div className="text-lg font-semibold text-gray-900">
            {strengthNames[verdict.dayMasterStrength] || verdict.dayMasterStrength}
          </div>
        </div>

        {/* 用神 */}
        {verdict.usefulGod && (
          <div className="bg-white rounded-md p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">喜用神</div>
            <div className="text-lg font-semibold text-green-600">
              {elementNames[verdict.usefulGod.element] || verdict.usefulGod.element}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {verdict.usefulGod.reason}
            </div>
          </div>
        )}

        {/* 忌神 */}
        {verdict.unfavorableElements.length > 0 && (
          <div className="bg-white rounded-md p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">不利元素</div>
            <div className="flex flex-wrap gap-2">
              {verdict.unfavorableElements.map((elem, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium"
                >
                  {elementNames[elem.element] || elem.element}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 分析推理 */}
      <div className="mt-4 bg-white rounded-md p-4 shadow-sm">
        <div className="text-sm text-gray-500 mb-2">分析推理</div>
        <div className="text-sm text-gray-700 leading-relaxed">
          {verdict.verdictReasoning}
        </div>
      </div>
    </div>
  );
}

