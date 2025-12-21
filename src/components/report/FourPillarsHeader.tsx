"use client";

/**
 * 四柱 Sticky Header 组件
 * 桌面端：显示完整四柱 + 当前大运
 * 移动端：显示简化栏（日主 + 当前大运），点击展开完整视图
 */

import { useState } from "react";
import type { ChartJSON } from "@/types/bazi";

interface FourPillarsHeaderProps {
  chart: ChartJSON;
  currentAge?: number;
}

export function FourPillarsHeader({ chart, currentAge = 30 }: FourPillarsHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 找到当前大运
  const currentLuck = chart.luckPillars.find(
    (luck) => currentAge >= luck.startAge && currentAge <= luck.endAge
  ) || chart.luckPillars[0];

  // 天干地支中文映射（简化）
  const stemNames: Record<string, string> = {
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

  const branchNames: Record<string, string> = {
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

  const FullHeader = () => (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-5 gap-4 items-center">
          {/* 年柱 */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">年柱</div>
            <div className="text-lg font-semibold">
              {stemNames[chart.fourPillars.year.heavenlyStem] || chart.fourPillars.year.heavenlyStem}
              {branchNames[chart.fourPillars.year.earthlyBranch] || chart.fourPillars.year.earthlyBranch}
            </div>
          </div>

          {/* 月柱 */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">月柱</div>
            <div className="text-lg font-semibold">
              {stemNames[chart.fourPillars.month.heavenlyStem] || chart.fourPillars.month.heavenlyStem}
              {branchNames[chart.fourPillars.month.earthlyBranch] || chart.fourPillars.month.earthlyBranch}
            </div>
          </div>

          {/* 日柱 */}
          <div className="text-center border-l border-r border-gray-200 px-4">
            <div className="text-xs text-gray-500 mb-1">日柱（日主）</div>
            <div className="text-xl font-bold text-blue-600">
              {stemNames[chart.fourPillars.day.heavenlyStem] || chart.fourPillars.day.heavenlyStem}
              {branchNames[chart.fourPillars.day.earthlyBranch] || chart.fourPillars.day.earthlyBranch}
            </div>
          </div>

          {/* 时柱 */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">时柱</div>
            <div className="text-lg font-semibold">
              {stemNames[chart.fourPillars.hour.heavenlyStem] || chart.fourPillars.hour.heavenlyStem}
              {branchNames[chart.fourPillars.hour.earthlyBranch] || chart.fourPillars.hour.earthlyBranch}
            </div>
          </div>

          {/* 当前大运 */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">当前大运</div>
            <div className="text-lg font-semibold text-green-600">
              {currentLuck && (
                <>
                  {stemNames[currentLuck.pillar.heavenlyStem] || currentLuck.pillar.heavenlyStem}
                  {branchNames[currentLuck.pillar.earthlyBranch] || currentLuck.pillar.earthlyBranch}
                  <div className="text-xs text-gray-500 mt-1">
                    {currentLuck.startAge}-{currentLuck.endAge}岁
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CompactHeader = () => (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-gray-500">日主</div>
              <div className="text-lg font-bold text-blue-600">
                {stemNames[chart.fourPillars.day.heavenlyStem] || chart.fourPillars.day.heavenlyStem}
                {branchNames[chart.fourPillars.day.earthlyBranch] || chart.fourPillars.day.earthlyBranch}
              </div>
            </div>
            {currentLuck && (
              <div>
                <div className="text-xs text-gray-500">大运</div>
                <div className="text-lg font-semibold text-green-600">
                  {stemNames[currentLuck.pillar.heavenlyStem] || currentLuck.pillar.heavenlyStem}
                  {branchNames[currentLuck.pillar.earthlyBranch] || currentLuck.pillar.earthlyBranch}
                </div>
              </div>
            )}
          </div>
          <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 桌面端：始终显示完整 Header（通过 CSS sticky） */}
      <div className="hidden md:block sticky top-0 z-50">
        <FullHeader />
      </div>

      {/* 移动端：显示简化栏，点击展开 */}
      <div className="md:hidden sticky top-0 z-50">
        <CompactHeader />
        {isExpanded && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="p-4">
              <button
                onClick={() => setIsExpanded(false)}
                className="mb-4 text-gray-500 hover:text-gray-700"
              >
                ✕ 关闭
              </button>
              <FullHeader />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

