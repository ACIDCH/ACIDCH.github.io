import { readFile } from "node:fs/promises";

const files = {
  refinement: await readFile("src/scripts/geospatial-usability-refinement.js", "utf8"),
  advanced: await readFile("src/components/GeospatialAdvancedVisuals.astro", "utf8"),
  service: await readFile("src/lib/geospatial/serviceRuntime.js", "utf8"),
  home: await readFile("src/components/HomePage.astro", "utf8"),
};

const requireToken = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`[geospatial-usability] missing ${label}: ${token}`);
};

requireToken(files.advanced, "geospatial-usability-refinement.js", "refinement mount");
requireToken(files.refinement, 'mergedTitle: "设施、覆盖与网络实体"', "merged facility/entity panel");
requireToken(files.refinement, 'mapAdd: "点击地图添加"', "Chinese map-add label");
requireToken(files.refinement, 'engine.value = "osm"', "OSM-first engine selection");
requireToken(files.refinement, 'threshold.value = "30"', "OSM default threshold");
requireToken(files.refinement, "compactFacilityPreset", "compact facility preset");
requireToken(files.refinement, 'button.textContent = removed ? copy.restore : copy.delete', "facility remove/restore control");
requireToken(files.refinement, "loadButton?.click()", "run-triggered OSM graph loading");
requireToken(files.refinement, "responseCache", "in-page GIS response cache");
requireToken(files.refinement, ".geo4__service-chip strong{font-size:.58rem!important}", "service-health readability");
requireToken(files.refinement, ".geo4__micro{font-size:.71rem!important", "micro-copy readability");
requireToken(files.service, 'overpassPrimary: "https://overpass.private.coffee/api/interpreter"', "primary Overpass endpoint");
requireToken(files.service, 'overpassSecondary: "https://overpass-api.de/api/interpreter"', "secondary Overpass endpoint");
requireToken(files.service, 'if (service === "overpass") return 18_000;', "Overpass failover budget");
requireToken(files.home, ':global(html[data-theme="light"]) .home-hero__featured-project', "light-theme featured-project contrast");
requireToken(files.home, "background: rgb(248 252 253 / 0.92);", "light-theme featured card background");

console.log(
  "[geospatial-usability] PASS: OSM-first workflow, faster Overpass failover, compact editable facilities, merged entity controls and readability improvements are wired into the release gate.",
);
