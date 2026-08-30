import { describe, expect, it } from "vitest";
import { createGeospatialStore } from "./geospatialStore.js";

describe("geospatial store", () => {
  it("invalidates every downstream result on an entity change", () => {
    const store = createGeospatialStore();
    const token = store.begin("main");
    expect(store.setMainSolution({ score: 1 }, token)).toBe(true);
    const fleet = store.begin("fleet");
    expect(store.commit(fleet, "fleetSolution", { feasible: true }, "fleet")).toBe(
      true,
    );
    store.setEntities({ facilities: [{ id: "f" }], demands: [] });
    expect(store.getState().mainSolution).toBeNull();
    expect(store.getState().fleetSolution).toBeNull();
    expect(store.getState().freshness.main).toBe("stale");
  });

  it("discards an async result from an older scenario revision", () => {
    const store = createGeospatialStore();
    const old = store.begin("monte-carlo");
    store.updateInputs("parameter");
    expect(store.commit(old, "monteCarloResult", { runs: 100 }, "monteCarlo")).toBe(
      false,
    );
    expect(store.getState().monteCarloResult).toBeNull();
  });

  it("keeps structured scenario slots separate from rendered content", () => {
    const store = createGeospatialStore();
    store.setScenarioSlot("A", { metricSignature: "NZD:1:0.2", score: 10 });
    expect(store.getState().scenarioSlots.A.score).toBe(10);
    expect(() => store.setScenarioSlot("C", {})).toThrow(/A or B/);
  });

  it("invalidates structured route visuals with the main scenario", () => {
    const store = createGeospatialStore();
    const token = store.begin("routes");
    expect(store.setRouteVisuals([{ flow: 10 }], token)).toBe(true);
    store.updateInputs("cost-change");
    expect(store.getState().routeVisuals).toEqual([]);
    expect(store.setRouteVisuals([{ flow: 20 }], token)).toBe(false);
  });

  it("invalidates criticality together with other downstream analysis", () => {
    const store = createGeospatialStore();
    const main = store.begin("main");
    store.setMainSolution({ score: 10 }, main);
    const criticality = store.begin("criticality");
    expect(
      store.commit(
        criticality,
        "criticalityResult",
        { edges: [{ score: 1 }] },
        "criticality",
      ),
    ).toBe(true);
    store.updateInputs("road-change");
    expect(store.getState().criticalityResult).toBeNull();
    expect(store.getState().freshness.criticality).toBe("stale");
  });
});
