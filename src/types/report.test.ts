import { describe, it, expect } from "vitest";
import type {
  BasicReport,
  BasicReportSection,
  BasicReportSectionId,
  YearReport
} from "./report";

describe("report types", () => {
  it("should allow constructing a BasicReport with sections", () => {
    const sectionId: BasicReportSectionId = "core-personality";

    const section: BasicReportSection = {
      id: sectionId,
      title: "核心性格分析",
      markdown: "这是关于日主性格与行为模式的说明。"
    };

    const report: BasicReport = {
      language: "zh-CN",
      generatedAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
      sections: [section]
    };

    expect(report.language).toBe("zh-CN");
    expect(report.sections[0].id).toBe("core-personality");
    expect(report.sections[0].title).toContain("核心性格");
  });

  it("should allow constructing a YearReport", () => {
    const yearReport: YearReport = {
      year: 2025,
      language: "zh-CN",
      markdown: "这是 2025 年的流年重点说明。"
    };

    expect(yearReport.year).toBe(2025);
    expect(yearReport.markdown).toMatch("2025 年");
  });
});


