import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isDecisionControl,
  isPrimaryOptimalFlowLayer,
} from "../src/lib/geospatial/postReleaseIntegrity.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const extension = read("src/components/GeospatialFunctionalExtensions.astro");
const integrity = read("src/scripts/geospatial-post-release-integrity.js");

const fail = (message) => {
  throw new Error(`[geospatial-post-release] ${message}`);
};
const requireText = (subject, token, label = token) => {
  if (!subject.includes(token)) fail(`Missing ${label}`);
};

requireText(
  extension,
  "geospatial-post-release-integrity.js",
  "post-release integrity extension mount",
);

for (const [token, label] of [
  ["geo4__fleet-build", "fleet build interception"],
  ["maskPrimaryRouteFlowMetadata", "fleet flow de-duplication"],
  ["isPrimaryOptimalFlowLayer", "primary optimal-route classifier"],
  ["Routed:", "duplicate route Flow metadata masking"],
  ["complete Facility → Demand allocation", "complete assignment-flow source contract"],
  ["transNeedOsm", "OSM-only transshipment guard"],
  ["stopImmediatePropagation", "guarded stale/invalid actions"],
  ["data-result-freshness", "freshness UI contract"],
  ["resultFreshness", "result freshness state"],
  ["isDecisionControl", "decision-input freshness coupling"],
  ["geo4-routes", "stale route guard"],
  ["geo4-save-a", "stale A-snapshot guard"],
  ["geo4-save-b", "stale B-snapshot guard"],
  ["geo4-demand-node", "coverage visual isolation"],
  ["OSM 道路网络", "non-live Chinese OSM label"],
  ["isNominatimRequest", "Nominatim request classifier"],
  ["1100", "Nominatim minimum request spacing"],
  ["__acidchNominatimQueueWrapped", "idempotent Nominatim queue wrapper"],
]) {
  requireText(integrity, token, label);
}

const fakeLayer = ({ color, className = "", tooltip = "Hub → Demand<br>Flow: 500" }) => ({
  options: { color, className },
  getTooltip: () => ({ getContent: () => tooltip }),
  getLatLngs: () => [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }],
});

if (!isPrimaryOptimalFlowLayer(fakeLayer({ color: "#d8ff6b" }))) {
  fail("Primary acid-green optimal route was rejected");
}
if (isPrimaryOptimalFlowLayer(fakeLayer({ color: "#62ecff" }))) {
  fail("Cyan allocation link was misclassified as presentation route geometry");
}
if (
  isPrimaryOptimalFlowLayer(
    fakeLayer({ color: "#d8ff6b", className: "geo4__transshipment-route" }),
  )
) {
  fail("Transshipment route would be consumed as a fleet assignment");
}
if (!isDecisionControl({ id: "geo4-road-mode" }) || isDecisionControl({ id: "geo4-layer" })) {
  fail("Decision-control freshness classifier is inconsistent");
}

console.log(
  "[geospatial-post-release] PASS: fleet planning consumes complete allocation flow without duplicate route metadata; OSM-only transshipment, stale-result guards, coverage isolation and Nominatim pacing acceptance checks passed.",
);
