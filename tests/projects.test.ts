import { describe, expect, it } from "vitest";
import { getDemoSupplyChainView } from "../src/data/supply-chain/adapter";

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
