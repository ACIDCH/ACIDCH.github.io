import { describe, expect, it } from "vitest";
import {
  isDecisionControl,
  isNominatimRequest,
  isPrimaryOptimalFlowLayer,
} from "./postReleaseIntegrity.js";

function layer({ color = "#d8ff6b", className = "", tooltip = "Hub → Demand<br>Flow: 400" } = {}) {
  return {
    options: { color, className },
    getTooltip: () => ({ getContent: () => tooltip }),
    getLatLngs: () => [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }],
  };
}

describe("post-release geospatial integrity", () => {
  it("accepts only the acid-green primary optimal route as fleet input", () => {
    expect(isPrimaryOptimalFlowLayer(layer())).toBe(true);
    expect(isPrimaryOptimalFlowLayer(layer({ color: "#62ecff" }))).toBe(false);
    expect(
      isPrimaryOptimalFlowLayer(
        layer({ color: "#d8ff6b", className: "geo4__transshipment-route" }),
      ),
    ).toBe(false);
    expect(
      isPrimaryOptimalFlowLayer(layer({ color: "#d8ff6b", className: "geo4__fleet-route" })),
    ).toBe(false);
    expect(isPrimaryOptimalFlowLayer(layer({ tooltip: "Hub → Demand<br>NZ$2,000" }))).toBe(false);
  });

  it("recognises decision controls including compact demand edits but not presentation layers", () => {
    expect(isDecisionControl({ id: "geo4-road-mode" })).toBe(true);
    expect(isDecisionControl({ id: "geo4-demand-multiplier" })).toBe(true);
    expect(
      isDecisionControl({
        id: "",
        matches: (selector) => selector.includes("[data-demand-edit]"),
      }),
    ).toBe(true);
    expect(isDecisionControl({ id: "geo4-layer" })).toBe(false);
  });

  it("recognises public Nominatim requests", () => {
    expect(isNominatimRequest("https://nominatim.openstreetmap.org/search?q=Auckland")).toBe(true);
    expect(isNominatimRequest("https://router.project-osrm.org/table/v1/driving/0,0;1,1")).toBe(false);
  });
});
