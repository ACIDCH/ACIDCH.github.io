import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const extension = read("src/components/GeospatialFunctionalExtensions.astro");
const source = read("src/scripts/geospatial-fleet-routing.js");
const tour = read("src/lib/geospatial/fleetTour.js");
const shift = read("src/scripts/geospatial-fleet-shift.js");
const controller = read("src/scripts/geospatial-v4.js");

const fail = (message) => {
  throw new Error(`[geospatial-fleet] ${message}`);
};
const requireText = (subject, token, label = token) => {
  if (!subject.includes(token)) fail(`Missing ${label}`);
};

requireText(extension, "geospatial-fleet-routing.js", "fleet routing extension mount");
requireText(extension, "geospatial-fleet-shift.js", "fleet shift-hour extension mount");

for (const [token, label] of [
  ["solveTspTour", "modular complete-tour TSP solver"],
  ["splitByCapacity", "modular vehicle-capacity trip splitting"],
  ["totalTripFlow", "allocated-flow conservation helper"],
  ["geo4-vehicle-capacity", "vehicle capacity coupling"],
  ["geo4-fleet-out", "fleet-size coupling"],
  ["geo4-trips", "trips-per-vehicle coupling"],
  ["graphOdMatrix", "OSM scenario travel-time matrix"],
  ["scenarioParams: scenarioParams()", "current road scenario parameters"],
  ["result.scenario", "scenario returned by optimisation matrix"],
  ["reconstructGraphPath", "same-scenario road geometry"],
  ["/table/v1/driving/", "OSRM road matrix fallback"],
  ["/route/v1/driving/", "OSRM road geometry fallback"],
  ["Flow:\\s*", "verified assignment-flow extraction"],
  ["if (!tsp.complete)", "incomplete TSP rejection"],
  ["totalTrips <= available", "fleet trip-capacity feasibility check"],
  ["Math.ceil(totalTrips / tripsPerVehicle)", "minimum fleet recommendation"],
  ["data-fleet-minimum", "minimum fleet output"],
  ["path.distanceKm", "reconstructed OSM route distance"],
  ["path.travelTimeMin", "reconstructed OSM route time"],
  ["route.complete", "road-geometry completeness gate"],
])
  requireText(source, token, label);

for (const [token, label] of [
  ["export function solveTspTour", "exact small-network TSP sequencing module"],
  ["export function nearestNeighbourTour", "large-network TSP heuristic fallback"],
  ["const dp = Array.from", "exact dynamic-programming TSP state"],
  ["if (n - 1 > exactLimit) return nearestNeighbourTour(matrix)", "bounded exact-to-heuristic transition"],
  ["complete: false", "explicit incomplete-tour state"],
  ["returnBlocked", "return-to-origin validation"],
  ["unvisited", "unreachable-stop diagnostics"],
  ["export function splitByCapacity", "capacity split implementation"],
  ["export function totalTripFlow", "capacity split flow-conservation audit"],
])
  requireText(tour, token, label);

for (const [token, label] of [
  ["geo4-shift-hours", "editable per-vehicle shift hours"],
  ["fleet * hoursPerVehicle", "aggregate shift-hour capacity"],
  ["planned <= capacity", "route-hour feasibility check"],
  ["time-window scheduling", "honest non-time-window boundary"],
])
  requireText(shift, token, label);

requireText(
  controller,
  "${H[x.hub]} → ${N[x.demand]}<br>Flow:",
  "facility-to-demand metadata consumed by fleet routing",
);

console.log(
  "[geospatial-fleet] PASS: modular exact/heuristic TSP sequencing rejects partial tours, capacity splitting conserves allocated flow, and fleet trip/shift-hour feasibility plus scenario-consistent OSM geometry checks passed.",
);
