import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assignTripsToVehicles,
  buildSplitDeliveryRoutes,
  validateFleetPlan,
} from "../src/lib/geospatial/fleetEngine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const extension = read("src/components/GeospatialFunctionalExtensions.astro");
const source = read("src/scripts/geospatial-fleet-routing.js");
const engine = read("src/lib/geospatial/fleetEngine.js");
const shift = read("src/scripts/geospatial-fleet-shift.js");
const fail = (message) => {
  throw new Error(`[geospatial-fleet] ${message}`);
};
const requireText = (subject, token, label = token) => {
  if (!subject.includes(token)) fail(`Missing ${label}`);
};

requireText(extension, "geospatial-fleet-routing.js", "fleet routing mount");
requireText(extension, "geospatial-fleet-shift.js", "fleet shift mount");
for (const [token, label] of [
  ["buildSplitDeliveryRoutes", "split-delivery routing"],
  ["assignTripsToVehicles", "actual vehicle scheduling"],
  ["validateFleetPlan", "route-demand integrity"],
  ["snapshot.mainSolution.assignments", "structured assignment source"],
  ['store.begin("fleet")', "stale-result token"],
  ["services.osrmTable", "centralised OSRM matrix"],
  ["services.osrmRoute", "centralised OSRM geometry"],
  ["reconstructGraphPath", "same-scenario graph geometry"],
])
  requireText(source, token, label);
for (const token of [
  "split-delivery-clarke-wright+2opt",
  "shiftMinutes",
  "tripsPerVehicle",
])
  requireText(engine, token);
if (/querySelectorAll\([^\n]*geo4__open|Flow:\\s\*/.test(source))
  fail("Fleet routing must not infer assignments from rendered DOM");
if (source.includes("globalThis.fetch ="))
  fail("Fleet routing must not monkey-patch fetch");
for (const token of [
  "getGeospatialStore",
  "fleetSolution?.schedule",
  "vehicle.durationMin",
  "vehicle.trips.length",
])
  requireText(shift, token, `structured shift check: ${token}`);

const duration = [
  [0, 10, 12],
  [10, 0, 5],
  [12, 5, 0],
];
const plan = buildSplitDeliveryRoutes({
  deliveries: [
    { id: "A", demand: 7 },
    { id: "B", demand: 6 },
  ],
  durationMatrix: duration,
  distanceMatrix: duration,
  vehicleCapacity: 5,
});
if (!plan.feasible || plan.trips.some((trip) => trip.load > 5 + 1e-9))
  fail("Split-delivery capacity acceptance failed");
if (!validateFleetPlan(plan, 13).valid)
  fail("Routed demand does not equal assigned demand");
const schedule = assignTripsToVehicles(plan.trips, {
  vehicleCount: 3,
  shiftHours: 2,
  tripsPerVehicle: 2,
});
if (
  !schedule.feasible ||
  schedule.vehicles.some(
    (vehicle) => vehicle.durationMin > 120 || vehicle.trips.length > 2,
  )
)
  fail("Per-vehicle shift/trip assignment acceptance failed");

console.log(
  "[geospatial-fleet] PASS: structured assignments, split deliveries, Clarke-Wright + 2-opt, per-trip capacity, per-vehicle shift/trip limits and central GIS services passed.",
);
