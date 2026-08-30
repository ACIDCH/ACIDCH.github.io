import { describe, expect, it } from "vitest";
import {
  assignTripsToVehicles,
  buildSplitDeliveryRoutes,
  validateFleetPlan,
} from "./fleetEngine.js";

const durationMatrix = [
  [0, 10, 12, 15],
  [10, 0, 5, 9],
  [12, 5, 0, 4],
  [15, 9, 4, 0],
];

describe("split-delivery fleet engine", () => {
  it("splits large deliveries and keeps every trip capacity-feasible", () => {
    const plan = buildSplitDeliveryRoutes({
      deliveries: [
        { id: "a", name: "A", demand: 150 },
        { id: "b", name: "B", demand: 70 },
        { id: "c", name: "C", demand: 40 },
      ],
      durationMatrix,
      distanceMatrix: durationMatrix.map((row) => row.map((value) => value / 2)),
      vehicleCapacity: 100,
    });
    expect(plan.feasible).toBe(true);
    expect(plan.solverMode).toBe("heuristic");
    expect(plan.routedDemand).toBeCloseTo(260);
    expect(plan.trips.every((trip) => trip.load <= 100)).toBe(true);
    expect(plan.trips.every((trip) => trip.depotStart && trip.depotReturn)).toBe(true);
    expect(validateFleetPlan(plan, 260).valid).toBe(true);
  });

  it("assigns real trips to individual vehicle shifts", () => {
    const schedule = assignTripsToVehicles(
      [
        { tripId: "a", durationMin: 120 },
        { tripId: "b", durationMin: 90 },
        { tripId: "c", durationMin: 60 },
      ],
      { vehicleCount: 2, shiftHours: 3, tripsPerVehicle: 2 },
    );
    expect(schedule.feasible).toBe(true);
    expect(schedule.vehicles.every((vehicle) => vehicle.durationMin <= 180)).toBe(true);
    expect(schedule.vehicles.every((vehicle) => vehicle.trips.length <= 2)).toBe(true);
  });

  it("reports unassigned trips instead of claiming aggregate feasibility", () => {
    const schedule = assignTripsToVehicles(
      [
        { tripId: "a", durationMin: 200 },
        { tripId: "b", durationMin: 200 },
      ],
      { vehicleCount: 2, shiftHours: 3, tripsPerVehicle: 2 },
    );
    expect(schedule.feasible).toBe(false);
    expect(schedule.unassigned).toHaveLength(2);
  });
});
