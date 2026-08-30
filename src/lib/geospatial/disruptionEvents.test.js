import { describe, expect, it } from "vitest";
import { createDisruptionEvent, listDisruptionEvents } from "./disruptionEvents.js";

const facilities = [
  { role: "factory", point: { lat: -36.9, lon: 174.75 } },
  { role: "factory", point: { lat: -36.87, lon: 174.76 } },
  { role: "warehouse", point: { lat: -36.84, lon: 174.77 } },
  { role: "warehouse", point: { lat: -36.91, lon: 174.79 } },
];
const demands = [
  { point: { lat: -36.85, lon: 174.76 } },
  { point: { lat: -36.91, lon: 174.81 } },
];

describe("disruption events", () => {
  it("creates deterministic seeded correlated events", () => {
    const a = createDisruptionEvent({
      eventId: "severe-weather",
      seed: 7,
      facilities,
      demands,
    });
    const b = createDisruptionEvent({
      eventId: "severe-weather",
      seed: 7,
      facilities,
      demands,
    });
    expect(a).toEqual(b);
    expect(a.networkScenario.mode).toBe("mixed");
    expect(a.demandMultipliers.every((value) => value === 1.05)).toBe(true);
    expect(a.facilityCapacityMultipliers.some((value) => value === 0.7)).toBe(true);
  });

  it("keeps the no-event profile neutral", () => {
    const event = createDisruptionEvent({ facilities, demands });
    expect(event.networkScenario).toEqual({});
    expect(event.demandMultipliers).toEqual([1, 1]);
    expect(event.facilityCapacityMultipliers).toEqual([1, 1, 1, 1]);
  });

  it("exposes only supported event ids", () => {
    expect(listDisruptionEvents()).toContain("harbour");
    expect(listDisruptionEvents()).toContain("warehouse-outage");
    expect(listDisruptionEvents()).toContain("access-improvement");
    expect(
      createDisruptionEvent({
        eventId: "access-improvement",
        facilities,
        demands,
      }).networkScenario.mode,
    ).toBe("newroad");
  });
});
