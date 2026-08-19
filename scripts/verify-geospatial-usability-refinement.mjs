import { readFile } from "node:fs/promises";

const files = {
  refinement: await readFile("src/scripts/geospatial-usability-refinement.js", "utf8"),
  queryPolish: await readFile("src/scripts/geospatial-overpass-query-polish.js", "utf8"),
  fallback: await readFile("src/scripts/geospatial-osm-fallback.js", "utf8"),
  advanced: await readFile("src/components/GeospatialAdvancedVisuals.astro", "utf8"),
  lab: await readFile("src/components/GeospatialSupplyChainLabV4.astro", "utf8"),
  leafletLoader: await readFile("src/scripts/geospatial-leaflet-loader.js", "utf8"),
  service: await readFile("src/lib/geospatial/serviceRuntime.js", "utf8"),
  home: await readFile("src/components/HomePage.astro", "utf8"),
};

const requireToken = (source, token, label) => {
  if (!source.includes(token))
    throw new Error(`[geospatial-usability] missing ${label}: ${token}`);
};

requireToken(files.advanced, "geospatial-usability-refinement.js", "refinement mount");
requireToken(files.advanced, "geospatial-overpass-query-polish.js", "Overpass query-polish mount");
requireToken(files.advanced, "geospatial-osm-fallback.js", "OSM fallback mount");
requireToken(files.lab, "geospatial-leaflet-loader.js", "resilient Leaflet loader mount");
if (files.lab.includes('src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"')) {
  throw new Error("[geospatial-usability] blocking unpkg Leaflet script must not remain in the lab component");
}
if (files.lab.includes('href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"')) {
  throw new Error("[geospatial-usability] blocking external Leaflet stylesheet must be owned by the runtime loader");
}
requireToken(
  files.leafletLoader,
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
  "primary Leaflet CDN",
);
requireToken(
  files.leafletLoader,
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "fallback Leaflet CDN",
);
requireToken(files.leafletLoader, "LOAD_BUDGET_MS = 7_000", "bounded Leaflet source budget");
requireToken(files.leafletLoader, 'setState("failed")', "visible Leaflet failure state");
requireToken(
  files.refinement,
  'mergedTitle: "设施、覆盖与网络实体"',
  "merged facility/entity panel",
);
requireToken(files.refinement, 'mapAdd: "点击地图添加"', "Chinese map-add label");
requireToken(files.refinement, 'engine.value = "osm"', "OSM-first engine selection");
requireToken(files.refinement, 'threshold.value = "30"', "OSM default threshold");
requireToken(files.refinement, "BUNDLED_AUCKLAND_COORDS", "bundled fast-start GIS coordinates");
requireToken(files.refinement, "compactFacilityPreset", "compact facility preset");
requireToken(
  files.refinement,
  'button.textContent = removed ? copy.restore : copy.delete',
  "facility remove/restore control",
);
requireToken(files.refinement, "syncExcludedFacilityMarkers", "removed-facility map visibility");
requireToken(files.refinement, "loadButton?.click()", "run-triggered OSM graph loading");
requireToken(files.refinement, "responseCache", "in-page GIS response cache");
requireToken(
  files.refinement,
  ".geo4__service-chip strong{font-size:.58rem!important}",
  "service-health readability",
);
requireToken(
  files.refinement,
  ".geo4__micro{font-size:.71rem!important",
  "micro-copy readability",
);
requireToken(files.queryPolish, "motorway_link|trunk|trunk_link|primary", "drivable Overpass road filter");
requireToken(files.queryPolish, '.replace("[timeout:35]", "[timeout:16]")', "narrowed Overpass query budget");
requireToken(files.queryPolish, '.replace("out body;", "out body qt;")', "quick Overpass output");
requireToken(files.fallback, "run.click()", "automatic Fast OD fallback solve");
requireToken(
  files.service,
  'overpassPrimary: "https://overpass.private.coffee/api/interpreter"',
  "primary Overpass endpoint",
);
requireToken(
  files.service,
  'overpassSecondary: "https://overpass-api.de/api/interpreter"',
  "secondary Overpass endpoint",
);
requireToken(
  files.service,
  'if (service === "overpass") return 18_000;',
  "Overpass failover budget",
);
requireToken(
  files.home,
  ':global(html[data-theme="light"]) .home-hero__featured-project',
  "light-theme featured-project contrast",
);
requireToken(
  files.home,
  "background: rgb(248 252 253 / 0.92);",
  "light-theme featured card background",
);

console.log(
  "[geospatial-usability] PASS: OSM-first workflow, non-blocking resilient Leaflet loading, bundled fast-start coordinates, narrower drivable-road Overpass queries, faster endpoint failover, automatic Fast OD recovery, compact editable facilities, merged entity controls and readability improvements are wired into the release gate.",
);
