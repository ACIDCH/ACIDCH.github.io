import { describe, expect, it } from "vitest";
import { reconstructGraphPath } from "./pathTools.js";

function graphFixture() {
  const nodes = new Map([
    ["a", { id: "a", lat: -36.85, lon: 174.75 }],
    ["b", { id: "b", lat: -36.86, lon: 174.76 }],
    ["c", { id: "c", lat: -36.87, lon: 174.77 }],
  ]);
  const edges = [
    {
      id: 0,
      from: "a",
      to: "b",
      segmentKey: "a:b",
      lengthKm: 1,
      timeMin: 1,
    },
    {
      id: 1,
      from: "b",
      to: "c",
      segmentKey: "b:c",
      lengthKm: 2,
      timeMin: 2,
    },
    {
      id: 2,
      from: "a",
      to: "c",
      segmentKey: "a:c",
      lengthKm: 10,
      timeMin: 10,
    },
  ];
  return {
    nodes,
    nodeList: [...nodes.values()],
    edges,
    adjacency: new Map([
      ["a", [0, 2]],
      ["b", [1]],
    ]),
  };
}

describe("reconstructGraphPath", () => {
  it("returns scenario-consistent distance and travel time with the route geometry", () => {
    const scenario = {
      factors: new Map([["b:c", 2]]),
      disabled: new Set(),
      shortcuts: [],
    };
    const path = reconstructGraphPath(graphFixture(), "a", "c", scenario, "time");

    expect(path).not.toBeNull();
    expect(path.cost).toBe(5);
    expect(path.distanceKm).toBe(3);
    expect(path.travelTimeMin).toBe(5);
    expect(path.coordinates).toHaveLength(3);
  });
});
