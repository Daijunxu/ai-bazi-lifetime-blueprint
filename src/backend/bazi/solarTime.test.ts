import { describe, it, expect } from "vitest";
import {
  computeLongitudeCorrectionMinutes,
  fallbackSolarTime,
  toTrueSolarTime
} from "./solarTime";

describe("solarTime", () => {
  it("computes longitude correction minutes for a given longitude and timezone", () => {
    // 构造一个假设：本地时区为 UTC+8（典型中国时区），经度略偏东
    const timezoneOffsetMinutes = -8 * 60; // Date.getTimezoneOffset 规则（GMT+8 => -480）
    const longitude = 121.5; // 接近上海

    const correction = computeLongitudeCorrectionMinutes(
      longitude,
      timezoneOffsetMinutes
    );

    // 只检查方向和数量级，不做绝对值强约束
    expect(correction).toBeGreaterThan(0);
    expect(Math.abs(correction)).toBeLessThan(60);
  });

  it("converts local time to true solar time with correction applied", () => {
    const localIso = "2025-01-01T08:00:00.000Z";
    const result = toTrueSolarTime(localIso, {
      latitude: 31.23,
      longitude: 121.47
    });

    expect(result.applied).toBe(true);
    expect(result.longitudeCorrectionMinutes).not.toBe(0);
    expect(typeof result.solarTimeIso).toBe("string");
  });

  it("fallbackSolarTime returns original time when no coordinates are available", () => {
    const localIso = "2025-01-01T08:00:00.000Z";
    const result = fallbackSolarTime(localIso);

    expect(result.applied).toBe(false);
    expect(result.longitudeCorrectionMinutes).toBe(0);
    expect(result.warning).toMatch(/True Solar Time not applied/);
  });

  it("throws on invalid date input", () => {
    expect(() => toTrueSolarTime("invalid-date", { latitude: 0, longitude: 0 })).toThrow(
      "INVALID_DATE"
    );
    expect(() => fallbackSolarTime("invalid-date")).toThrow("INVALID_DATE");
  });
});


