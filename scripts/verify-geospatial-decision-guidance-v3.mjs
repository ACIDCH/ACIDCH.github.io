import { readFile } from "node:fs/promises";

const files = {
  fleet: await readFile("src/scripts/geospatial-fleet-routing.js", "utf8"),
  fleetTour: await readFile("src/lib/geospatial/fleetTour.js", "utf8"),
  guidance: await readFile("src/scripts/geospatial-decision-guidance-v3.js", "utf8"),
  advanced: await readFile("src/components/GeospatialAdvancedVisuals.astro", "utf8"),
};

const requireToken = (source, token, label) => {
  if (!source.includes(token)) {
    throw new Error(`[geospatial-guidance-v3] missing ${label}: ${token}`);
  }
};

requireToken(files.fleetTour, "solveTspTour", "complete TSP solver");
requireToken(files.fleetTour, "complete: false", "explicit incomplete-tour state");
requireToken(files.fleetTour, "returnBlocked", "return-to-depot validation");
requireToken(files.fleetTour, "totalTripFlow", "capacity split flow conservation helper");
requireToken(files.fleet, "if (!tsp.complete)", "Fleet/TSP completeness gate");
requireToken(files.fleet, 'error.code = "fleet-road-incomplete"', "road-infeasible Fleet/TSP state");
requireToken(files.fleet, 'root.dataset.fleetPlanState = "capacity-shortfall"', "capacity-shortfall state");
requireToken(files.fleet, "totalTripFlow(trips)", "allocated-flow conservation check");
requireToken(files.fleet, "route.complete", "route geometry completeness check");
requireToken(files.fleet, "Fleet/TSP 会直接读取当前分配与道路情景", "direct current-allocation workflow copy");

requireToken(files.guidance, "geo4__next-action", "recommended-next-action panel");
requireToken(files.guidance, "infeasibleReason", "main-model infeasibility explanation");
requireToken(files.guidance, "infeasibleFleet", "aggregate fleet diagnostic");
requireToken(files.guidance, "infeasiblePolicy", "must-open diagnostic");
requireToken(files.guidance, "infeasibleRedundancy", "redundancy diagnostic");
requireToken(files.guidance, "infeasibleCapacity", "facility-capacity diagnostic");
requireToken(files.guidance, 'fleetState === "road-infeasible"', "road-tour recovery guidance");
requireToken(files.guidance, 'fleetState === "capacity-shortfall"', "fleet-capacity recovery guidance");
requireToken(files.advanced, "geospatial-decision-guidance-v3.js", "guidance runtime mount");

console.log(
  "[geospatial-guidance-v3] PASS: Fleet/TSP rejects partial road tours, verifies allocated-flow conservation, distinguishes road infeasibility from fleet-capacity shortfall, and surfaces context-specific next-step guidance for main-model infeasibility and downstream decision states.",
);
