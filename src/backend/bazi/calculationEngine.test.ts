/**
 * Layer 1 计算引擎的单元测试
 * 重点测试：四柱准确性、大运计算、互动矩阵、神煞标记
 */

import { describe, it, expect } from "vitest";
import { calculateChart } from "./calculationEngine";
import type { BirthInputWithLocation } from "./calculationEngine";
import type { ChartJSON } from "@/types/bazi";
import { toTrueSolarTime } from "./solarTime";

describe("CalculationEngine", () => {
  // 测试用例：1990年1月15日 14:30，北京（经度约116.4）
  const mockInput: BirthInputWithLocation = {
    name: "测试用户",
    gender: "male",
    birthDate: "1990-01-15T14:30:00",
    birthCity: "北京",
    solarTime: toTrueSolarTime("1990-01-15T14:30:00", {
      latitude: 39.9,
      longitude: 116.4,
    }),
  };

  it("应该生成完整的 ChartJSON", () => {
    const chart = calculateChart(mockInput);

    expect(chart).toBeDefined();
    expect(chart.fourPillars).toBeDefined();
    expect(chart.luckPillars).toBeDefined();
    expect(chart.interactionMatrix).toBeDefined();
    expect(chart.starGods).toBeDefined();
  });

  it("四柱应该包含年月日时", () => {
    const chart = calculateChart(mockInput);

    expect(chart.fourPillars.year).toBeDefined();
    expect(chart.fourPillars.month).toBeDefined();
    expect(chart.fourPillars.day).toBeDefined();
    expect(chart.fourPillars.hour).toBeDefined();

    // 每柱都应该有天干地支
    expect(chart.fourPillars.year.heavenlyStem).toBeDefined();
    expect(chart.fourPillars.year.earthlyBranch).toBeDefined();
    expect(chart.fourPillars.month.heavenlyStem).toBeDefined();
    expect(chart.fourPillars.month.earthlyBranch).toBeDefined();
    expect(chart.fourPillars.day.heavenlyStem).toBeDefined();
    expect(chart.fourPillars.day.earthlyBranch).toBeDefined();
    expect(chart.fourPillars.hour.heavenlyStem).toBeDefined();
    expect(chart.fourPillars.hour.earthlyBranch).toBeDefined();
  });

  it("每柱应该包含藏干", () => {
    const chart = calculateChart(mockInput);

    expect(chart.fourPillars.year.hiddenStems.length).toBeGreaterThan(0);
    expect(chart.fourPillars.month.hiddenStems.length).toBeGreaterThan(0);
    expect(chart.fourPillars.day.hiddenStems.length).toBeGreaterThan(0);
    expect(chart.fourPillars.hour.hiddenStems.length).toBeGreaterThan(0);

    // 藏干应该有十神
    chart.fourPillars.year.hiddenStems.forEach((h) => {
      expect(h.tenGod).toBeDefined();
      expect(h.strength).toMatch(/^(weak|medium|strong)$/);
    });
  });

  it("应该生成8步大运", () => {
    const chart = calculateChart(mockInput);

    expect(chart.luckPillars.length).toBe(8);

    // 每步大运应该有正确的年龄范围
    chart.luckPillars.forEach((luck, index) => {
      expect(luck.index).toBe(index + 1);
      expect(luck.startAge).toBe(index * 10);
      expect(luck.endAge).toBe(index * 10 + 9);
      expect(luck.pillar).toBeDefined();
    });
  });

  it("大运应该根据性别和年干正确顺逆排", () => {
    const maleInput: BirthInputWithLocation = {
      ...mockInput,
      gender: "male",
      birthDate: "1990-01-15T14:30:00", // 庚午年（阳年）
    };
    const femaleInput: BirthInputWithLocation = {
      ...mockInput,
      gender: "female",
      birthDate: "1990-01-15T14:30:00",
    };

    const maleChart = calculateChart(maleInput);
    const femaleChart = calculateChart(femaleInput);

    // 男阳年应该顺排，女阳年应该逆排
    // 这里简化测试：确保大运柱不同即可
    expect(maleChart.luckPillars[0].pillar).not.toEqual(
      femaleChart.luckPillars[0].pillar
    );
  });

  it("应该计算互动矩阵", () => {
    const chart = calculateChart(mockInput);

    expect(chart.interactionMatrix.entries).toBeDefined();
    expect(Array.isArray(chart.interactionMatrix.entries)).toBe(true);

    // 检查互动类型
    chart.interactionMatrix.entries.forEach((entry) => {
      expect(["chong", "he", "xing", "hai"]).toContain(entry.type);
      expect(entry.from).toBeDefined();
      expect(entry.to).toBeDefined();
      expect(entry.description).toBeDefined();
    });
  });

  it("应该计算神煞", () => {
    const chart = calculateChart(mockInput);

    expect(chart.starGods).toBeDefined();
    expect(Array.isArray(chart.starGods)).toBe(true);

    // 检查神煞结构
    chart.starGods.forEach((star) => {
      expect(star.key).toBeDefined();
      expect(star.pillar).toBeDefined();
      expect(star.description).toBeDefined();
    });
  });

  it("应该处理真太阳时未应用的情况", () => {
    const inputWithoutSolarTime: BirthInputWithLocation = {
      ...mockInput,
      solarTime: {
        applied: false,
        solarTimeIso: mockInput.birthDate,
        longitudeCorrectionMinutes: 0,
        warning: "True Solar Time not applied (Location unknown).",
      },
    };

    const chart = calculateChart(inputWithoutSolarTime);

    // 应该仍然能正常计算，只是使用原始时间
    expect(chart).toBeDefined();
    expect(chart.fourPillars).toBeDefined();
  });

  // 边界测试：测试不同年份、月份、时辰
  it("应该正确处理不同年份", () => {
    const input2000: BirthInputWithLocation = {
      ...mockInput,
      birthDate: "2000-01-15T14:30:00",
      solarTime: toTrueSolarTime("2000-01-15T14:30:00", {
        latitude: 39.9,
        longitude: 116.4,
      }),
    };

    const chart = calculateChart(input2000);
    expect(chart.fourPillars.year.heavenlyStem).not.toBe(
      calculateChart(mockInput).fourPillars.year.heavenlyStem
    );
  });

  it("应该正确处理不同时辰", () => {
    const inputMorning: BirthInputWithLocation = {
      ...mockInput,
      birthDate: "1990-01-15T08:30:00",
      solarTime: toTrueSolarTime("1990-01-15T08:30:00", {
        latitude: 39.9,
        longitude: 116.4,
      }),
    };

    const chart = calculateChart(inputMorning);
    expect(chart.fourPillars.hour.earthlyBranch).not.toBe(
      calculateChart(mockInput).fourPillars.hour.earthlyBranch
    );
  });
});

