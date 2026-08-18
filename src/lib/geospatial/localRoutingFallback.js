import { graphOdMatrix } from "./decisionEngine.js";

function parseIndexes(value, length) {
  if (!value) return Array.from({ length }, (_, index) => index);
  return value
    .split(";")
    .map(Number)
    .filter((index) => Number.isInteger(index) && index >= 0 && index < length);
}

export function parseOsrmTableRequest(input) {
  try {
    const url = new globalThis.URL(String(input));
    const marker = "/table/v1/driving/";
    const at = url.pathname.indexOf(marker);
    if (at < 0) return null;
    const raw = decodeURIComponent(url.pathname.slice(at + marker.length));
    const points = raw.split(";").map((pair) => {
      const [lon, lat] = pair.split(",").map(Number);
      return { lat, lon };
    });
    if (!points.length || points.some((point) => !Number.isFinite(point.lat) || !Number.isFinite(point.lon)))
      return null;
    const sources = parseIndexes(url.searchParams.get("sources"), points.length);
    const destinations = parseIndexes(url.searchParams.get("destinations"), points.length);
    return { points, sources, destinations };
  } catch {
    return null;
  }
}

export function buildLocalTablePayload(input, graph) {
  const request = parseOsrmTableRequest(input);
  if (!request || !graph?.edges?.length) return null;
  const sources = request.sources.map((index) => request.points[index]);
  const destinations = request.destinations.map((index) => request.points[index]);
  const distance = graphOdMatrix({
    graph,
    sources,
    destinations,
    scenarioParams: { mode: "baseline" },
    metric: "distance",
  }).matrix;
  const time = graphOdMatrix({
    graph,
    sources,
    destinations,
    scenarioParams: { mode: "baseline" },
    metric: "time",
  }).matrix;
  return {
    code: "Ok",
    distances: distance.map((row) => row.map((value) => (Number.isFinite(value) ? value * 1000 : null))),
    durations: time.map((row) => row.map((value) => (Number.isFinite(value) ? value * 60 : null))),
  };
}
