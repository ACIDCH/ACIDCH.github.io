import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  capacityNetValue,
  optimisationUniverse,
  productMixVertices,
  unconstrainedOptimum,
} from "../src/data/supply-chain-optimisation";
import { getLearningSeries } from "../src/data/learning-series";

const read = (path: string) => readFileSync(path, "utf8");
const noteFiles = [
  "optimisation-model-anatomy.zh.md",
  "unconstrained-optimisation.zh.md",
  "constrained-optimisation.zh.md",
  "optimisation-sensitivity-analysis.zh.md",
  "binary-milp-decisions.zh.md",
  "sets-indices-model-scale.zh.md",
  "pulp-model-architecture.zh.md",
  "multidimensional-optimisation.zh.md",
  "transportation-models.zh.md",
  "multi-period-production-inventory.zh.md",
];
const notes = noteFiles.map((file) => read(`src/content/notes/${file}`));
const route = read("src/components/NoteRenderer.astro");
const layout = read("src/layouts/DecisionModelNoteLayout.astro");
const dispatcher = read("src/components/learning/DecisionModelLearningBlocks.astro");

describe("Supply chain and decision model Learning Notes", () => {
  it("publishes a stable ten-module decision-model roadmap", () => {
    const series = getLearningSeries("decision-models");
    expect(series).toBeDefined();
    expect(series?.modules).toHaveLength(10);
    expect(series?.modules.map((module) => module.code)).toEqual([
      "DM 01",
      "DM 02",
      "DM 03",
      "DM 04",
      "DM 05",
      "DM 06",
      "DM 07",
      "DM 08",
      "DM 09",
      "DM 10",
    ]);
    expect(series?.tools).toEqual(["Excel Solver", "Python", "PuLP", "优化"]);
  });

  it("keeps all ten public notes published, ordered and substantial", () => {
    notes.forEach((note, index) => {
      const file = noteFiles[index];
      expect(note).toContain("seriesSlug: decision-models");
      expect(note).toContain(`order: ${index + 1}`);
      expect(note).toContain("status: published");
      expect(note).toContain("draft: false");
      expect
        .soft(note.length, `${file} should remain a substantial long-form note`)
        .toBeGreaterThan(4000);
      expect
        .soft(
          (note.match(/^## /gmu) || []).length,
          `${file} should retain a deep section hierarchy`,
        )
        .toBeGreaterThanOrEqual(9);
    });
  });

  it("locks the canonical unconstrained capacity trade-off", () => {
    expect(unconstrainedOptimum).toBe(600);
    expect(capacityNetValue(600)).toBe(10800);
    expect(capacityNetValue(575)).toBe(10750);
    expect(capacityNetValue(625)).toBe(10750);
    expect(capacityNetValue(600) - capacityNetValue(575)).toBe(50);
  });

  it("locks the canonical constrained product-mix optimum", () => {
    const best = [...productMixVertices].sort(
      (a, b) => b.contribution - a.contribution,
    )[0];
    expect(best.core).toBeCloseTo(200 / 7, 8);
    expect(best.premium).toBeCloseTo(270 / 7, 8);
    expect(best.contribution).toBeCloseTo(3437.142857, 5);
    expect(3 * best.core + 4 * best.premium).toBeCloseTo(240, 8);
    expect(2 * best.core + 5 * best.premium).toBeCloseTo(250, 8);
  });

  it("locks the carrier allocation demonstration", () => {
    const volumes = { a: 300, b: 300, c: 260 } as const;
    const total = optimisationUniverse.carriers.reduce(
      (sum, carrier) => sum + volumes[carrier.id],
      0,
    );
    const cost = optimisationUniverse.carriers.reduce(
      (sum, carrier) => sum + volumes[carrier.id] * carrier.unitCost,
      0,
    );
    expect(total).toBe(860);
    expect(cost).toBe(6198);
    optimisationUniverse.carriers.forEach((carrier) => {
      expect(volumes[carrier.id]).toBeGreaterThanOrEqual(carrier.minVolume);
      expect(volumes[carrier.id]).toBeLessThanOrEqual(carrier.maxVolume);
    });
  });

  it("locks the three multi-period planning comparisons", () => {
    const demand = optimisationUniverse.periods.map((period) => period.demand);
    const plans = {
      match: demand,
      smooth: [225, 225, 225, 225],
      batch: [440, 0, 460, 0],
    };

    function planCost(production: number[]) {
      let inventory = 0;
      let holdingUnits = 0;
      let setups = 0;
      let productionCost = 0;
      optimisationUniverse.periods.forEach((period, index) => {
        const qty = production[index] ?? 0;
        inventory += qty - period.demand;
        holdingUnits += Math.max(0, inventory);
        productionCost += qty * period.productionCost;
        if (qty > 0) setups += 1;
      });
      return (
        productionCost +
        setups * optimisationUniverse.periods[0].setupCost +
        holdingUnits * optimisationUniverse.periods[0].holdingCost
      );
    }

    expect(planCost(plans.match)).toBe(12480);
    expect(planCost(plans.smooth)).toBe(12648);
    expect(planCost(plans.batch)).toBe(12324);
  });

  it("routes decision-model notes through an isolated editorial layout", () => {
    expect(route).toContain('"decision-models": DecisionModelNoteLayout');
    expect(route).toContain("DecisionModelNoteLayout");
    expect(layout).toContain("LearningNoteHero");
    expect(layout).toContain("LearningNoteToc");
    expect(layout).toContain("DecisionModelLearningBlocks");
    expect(layout).toContain("decision-models.css");
  });

  it("places every topic-specific interactive learning block", () => {
    [
      "OptimisationAnatomyLab",
      "UnconstrainedTradeoffLab",
      "FeasibleRegionSensitivityLab",
      "FixedChargeMilpLab",
      "ModelScaleLab",
      "PulpModelAnatomyLab",
      "PlanningHorizonLab",
      "SupplyChainFlowLab",
    ].forEach((component) => expect(dispatcher).toContain(component));
    expect(dispatcher).toContain('defaultMode="carrier"');
    expect(dispatcher).toContain('defaultMode="period"');
  });

  it("keeps public decision-model content free of course-facing, private and first-person labels", () => {
    const publicSources = [
      ...notes,
      read("src/data/supply-chain-optimisation.ts"),
      read("src/components/learning/OptimisationAnatomyLab.astro"),
      read("src/components/learning/UnconstrainedTradeoffLab.astro"),
      read("src/components/learning/FeasibleRegionSensitivityLab.astro"),
      read("src/components/learning/FixedChargeMilpLab.astro"),
      read("src/components/learning/ModelScaleLab.astro"),
      read("src/components/learning/PulpModelAnatomyLab.astro"),
      read("src/components/learning/PlanningHorizonLab.astro"),
      read("src/components/learning/SupplyChainFlowLab.astro"),
    ];
    publicSources.forEach((source) => {
      expect(source).not.toMatch(
        /BUSINFO|Assignment|Submission|课程作业|课程项目|UPI|399162766/iu,
      );
      expect(source).not.toMatch(/Xintao Liu|LIU XINTAO|刘鑫涛/u);
    });
    notes.forEach((note) => {
      expect(note).not.toMatch(/我|我们|本人|作者|笔者/u);
    });
  });
});
