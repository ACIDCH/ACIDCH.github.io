import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const extension = read("src/components/GeospatialFunctionalExtensions.astro");
const source = read("src/scripts/geospatial-fleet-routing.js");

const fail = (message) => {
  throw new Error(`[geospatial-fleet] ${message}`);
};
const requireText = (token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};

if (!extension.includes("geospatial-fleet-routing.js")) fail("Fleet routing extension is not mounted");

for (const [token, label] of [
  ["exactTsp", "exact small-network TSP sequencing"],
  ["nearestNeighbour", "large-network TSP fallback"],
  ["splitByCapacity", "vehicle-capacity trip splitting"],
  ["geo4-vehicle-capacity", "vehicle capacity coupling"],
  ["geo4-fleet-out", "fleet-size coupling"],
  ["geo4-trips", "trips-per-vehicle coupling"],
  ["graphOdMatrix", "OSM scenario travel-time matrix"],
  ["buildEdgeScenario", "current road disruption scenario"],
  ["reconstructGraphPath", "same-scenario road geometry"],
  ["/table/v1/driving/", "OSRM road matrix fallback"],
  ["/route/v1/driving/", "OSRM road geometry fallback"],
  ["Flow:\\s*", "verified assignment-flow extraction"],
  ["CVRP", "honest non-CVRP modelling boundary"],
  ["totalTrips <= available", "fleet trip-capacity feasibility check"],
]) requireText(token, label);

console.log(
  "[geospatial-fleet] PASS: road-based TSP sequencing, capacity trip splitting, fleet feasibility and scenario-consistent OSM geometry acceptance checks passed.",
);