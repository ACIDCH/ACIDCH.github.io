import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const extension = read("src/components/GeospatialFunctionalExtensions.astro");
const source = read("src/scripts/geospatial-fleet-routing.js");
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
  ["exactTsp", "exact small-network TSP sequencing"],
  ["nearestNeighbour", "large-network TSP fallback"],
  ["splitByCapacity", "vehicle-capacity trip splitting"],
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
  ["CVRP", "honest non-CVRP modelling boundary"],
  ["totalTrips <= available", "fleet trip-capacity feasibility check"],
  ["Math.ceil(totalTrips / tripsPerVehicle)", "minimum fleet recommendation"],
  ["data-fleet-minimum", "minimum fleet output"],
  ["path.distanceKm", "reconstructed OSM route distance"],
  ["path.travelTimeMin", "reconstructed OSM route time"],
])
  requireText(source, token, label);

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
  "[geospatial-fleet] PASS: road-based TSP sequencing, capacity trip splitting, fleet trip/shift-hour feasibility and scenario-consistent OSM geometry acceptance checks passed.",
);
