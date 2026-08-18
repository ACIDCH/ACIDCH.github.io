import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const fail = (message) => {
  throw new Error(`[geospatial-osm-first] ${message}`);
};
const requireText = (source, token, label = token) => {
  if (!source.includes(token)) fail(`Missing ${label}`);
};

const controller = read("src/scripts/geospatial-v4.js");
const runtime = read("src/lib/geospatial/serviceRuntime.js");
const ux = read("src/scripts/geospatial-production-ux.js");
const extension = read("src/components/GeospatialFunctionalExtensions.astro");
const home = read("src/components/HomePage.astro");

for (const [token, label] of [
  ["COMPACT_SCENES", "compact initial scene presets"],
  ["hubs: [3, 0], demands: [2, 8]", "four-entity scene preset"],
  ["acidch-geo-v4-scene-index", "session-stable random scene selection"],
  ['q("geo4-engine").value = "osm"', "OSM-first engine default"],
  ['q("geo4-threshold").value = "30"', "OSM service-time default"],
  ["HCPOOL", "static Auckland facility coordinates"],
  ["NCPOOL", "static Auckland demand coordinates"],
  ["data-remove-entity", "model-backed entity delete controls"],
  ["data-demand-edit", "editable demand entities"],
  ["removeEntity", "physical entity removal"],
  ["sessionStorage", "browser-session OSM graph cache"],
  ["acidch-osm-compact-v2", "compact graph cache key"],
  ["access\"!=\"private", "private-road exclusion"],
  ["motor_vehicle\"!=\"no", "motor-vehicle access exclusion"],
  ["maps.mail.ru", "secondary Overpass endpoint"],
  ["loadGraph(true)", "automatic compact OSM graph load"],
]) {
  requireText(controller, token, label);
}

for (const [token, label] of [
  ["https://overpass-api.de/api/interpreter", "primary Overpass endpoint"],
  ["https://maps.mail.ru/osm/tools/overpass/api/interpreter", "secondary Overpass endpoint"],
  ['service === "overpass") return 12_000', "fast Overpass failover budget"],
]) {
  requireText(runtime, token, label);
}

for (const [token, label] of [
  ["网络实体与设施决策", "unified Chinese entity/facility module"],
  ["Network entities & facility decisions", "unified English entity/facility module"],
  ["点击地图添加", "requested Chinese map-add wording"],
  ["geo4__entity-remove", "visible delete action styling"],
  ["geo4__service-chip strong{font-size:.58rem}", "larger service labels"],
  ["geo4__field,#geo-v4 .geo4__range", "larger panel controls"],
  ["scheduleSolve", "OSM input auto re-optimisation"],
]) {
  requireText(ux, token, label);
}
requireText(extension, "geospatial-production-ux.js", "production UX extension mount");

for (const [token, label] of [
  ["color: var(--color-text)", "theme-aware featured-project text"],
  ["background: color-mix(in srgb, var(--color-surface) 92%", "high-contrast featured-project surface"],
  ["font-size: max(var(--font-size-md), 1rem)", "larger featured-project title"],
]) {
  requireText(home, token, label);
}

if (home.includes(".home-hero__featured-project {\n") && home.includes("color: white;")) {
  fail("Featured project entry still hard-codes white text and may disappear in light theme");
}

const sceneMatch = controller.match(/const HPOOL[\s\S]*?COMPACT_SCENES = \[([\s\S]*?)\];/);
if (!sceneMatch) fail("Unable to inspect compact scene presets");
const presets = [...sceneMatch[1].matchAll(/\{ hubs: \[([^\]]+)\], demands: \[([^\]]+)\] \}/g)];
if (presets.length !== 4) fail(`Expected four compact scene presets, found ${presets.length}`);
for (const preset of presets) {
  const hubs = preset[1].split(",").filter((value) => value.trim()).length;
  const demands = preset[2].split(",").filter((value) => value.trim()).length;
  if (hubs + demands < 3 || hubs + demands > 4) {
    fail(`Compact scene must contain three or four entities, found ${hubs + demands}`);
  }
}

console.log(
  "[geospatial-osm-first] PASS: OSM-first compact scenes, editable entities, faster Overpass fallback, unified panel UX and light-theme featured-project contrast verified.",
);
