import { describe, expect, it } from "vitest";
import { getDemoSupplyChainView } from "../src/data/supply-chain/adapter";
import { matchesProjectFilters } from "../src/utils/projects";

describe("project filtering", () => {
  const project = {
    tools: ["Python", "Excel Solver"],
    topic: "transportation",
    status: "planned",
  };

  it("matches tool names without case sensitivity", () => {
    expect(matchesProjectFilters(project, { tool: "python" })).toBe(true);
  });

  it("combines tool, topic and status filters", () => {
    expect(
      matchesProjectFilters(project, {
        tool: "Excel Solver",
        topic: "transportation",
        status: "planned",
      }),
    ).toBe(true);
    expect(matchesProjectFilters(project, { status: "completed" })).toBe(false);
  });
});

describe("supply-chain demo adapter", () => {
  it("produces complete edge views for each scenario", () => {
    const baseline = getDemoSupplyChainView("baseline");
    const optimised = getDemoSupplyChainView("optimised");

    expect(baseline.source).toBe("demo");
    expect(baseline.edges).toHaveLength(4);
    expect(optimised.edges.some((edge) => edge.status === "optimal")).toBe(true);
    expect(optimised.edges.some((edge) => edge.status === "constrained")).toBe(true);
  });
});
