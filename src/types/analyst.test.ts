import { describe, it, expect } from "vitest";
import type {
  AnalystVerdictJSON,
  ChartStructure,
  DayMasterStrength,
  UsefulGod,
  UnfavorableElement
} from "./analyst";

describe("analyst types", () => {
  it("should allow constructing a valid AnalystVerdictJSON object", () => {
    const structure: ChartStructure = "HurtingOfficer";
    const strength: DayMasterStrength = "weak";

    const usefulGod: UsefulGod = {
      element: "Water",
      reason: "日主身弱喜印比，水能滋木。"
    };

    const unfavorable: UnfavorableElement = {
      element: "Fire",
      reason: "火旺泄身过度，增加压力与波动。"
    };

    const verdict: AnalystVerdictJSON = {
      structure,
      dayMasterStrength: strength,
      usefulGod,
      unfavorableElements: [unfavorable],
      verdictReasoning:
        "根据四柱组合判断为身弱伤官格，喜水木生扶，忌火土再来耗身。"
    };

    expect(verdict.structure).toBe("HurtingOfficer");
    expect(verdict.usefulGod?.element).toBe("Water");
    expect(verdict.unfavorableElements[0].element).toBe("Fire");
  });
});


