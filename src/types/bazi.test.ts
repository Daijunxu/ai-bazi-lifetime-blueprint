import { describe, it, expect } from "vitest";
import type {
  ChartJSON,
  FourPillars,
  LuckPillar,
  InteractionMatrix,
  StarGod
} from "./bazi";

const sampleFourPillars: FourPillars = {
  year: {
    heavenlyStem: "Jia",
    earthlyBranch: "Zi",
    hiddenStems: []
  },
  month: {
    heavenlyStem: "Yi",
    earthlyBranch: "Chou",
    hiddenStems: []
  },
  day: {
    heavenlyStem: "Bing",
    earthlyBranch: "Yin",
    hiddenStems: []
  },
  hour: {
    heavenlyStem: "Ding",
    earthlyBranch: "Mao",
    hiddenStems: []
  }
};

const sampleLuckPillars: LuckPillar[] = [
  {
    index: 1,
    startAge: 8,
    endAge: 17,
    pillar: sampleFourPillars.year
  }
];

const sampleInteractionMatrix: InteractionMatrix = {
  entries: [
    {
      type: "chong",
      from: "year",
      to: "day",
      description: "年支与日支相冲"
    }
  ]
};

const sampleStarGods: StarGod[] = [
  {
    key: "TaoHua",
    pillar: "day",
    description: "日支桃花"
  }
];

describe("bazi types", () => {
  it("should allow constructing a valid ChartJSON object", () => {
    const chart: ChartJSON = {
      fourPillars: sampleFourPillars,
      luckPillars: sampleLuckPillars,
      interactionMatrix: sampleInteractionMatrix,
      starGods: sampleStarGods
    };

    expect(chart.fourPillars.day.heavenlyStem).toBe("Bing");
    expect(chart.luckPillars[0].index).toBe(1);
    expect(chart.interactionMatrix.entries[0].type).toBe("chong");
    expect(chart.starGods[0].key).toBe("TaoHua");
  });
});


