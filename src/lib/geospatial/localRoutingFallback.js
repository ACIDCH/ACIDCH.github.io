import {
  buildEdgeScenario,
  graphOdMatrix,
  nearestGraphNode,
} from "./decisionEngine.js";
import { reconstructGraphPath } from "./pathTools.js";

function parseIndexes(value, length) {
  if (!value) return Array.from({ length }, (_, index) => index);
  return value
    .split(";")
    .map(Number)
    .filter((index) => Number.isInteger(index) && index >= 0 && index < length);
}

function parseDrivingPoints(input, marker) {
  try {
    const url = new globalThis.URL(String(input));
    const at = url.pathname.indexOf(marker);
    if (at < 0) return null;
    const raw = decodeURIComponent(url.pathname.slice(at + marker.length));
    const points = raw.split(";").map((pair) => {
      const [lon, lat] = pair.split(",").map(Number);
      return { lat, lon };
    });
    if (
      !points.length ||
      points.some((point) => !Number.isFinite(point.lat) || !Number.isFinite(point.lon))
    ) {
      return null;
    }
    return { url, points };
  } catch {
    return null;
  }
}

export function parseOsrmTableRequest(input) {
  const parsed = parseDrivingPoints(input, "/table/v1/driving/");
  if (!parsed) return null;
  const sources = parseIndexes(parsed.url.searchParams.get("sources"), parsed.points.length);
  const destinations = parseIndexes(
    parsed.url.searchParams.get("destinations"),
    parsed.points.length,
  );
  return { points: parsed.points, sources, destinations };
}

export function parseOsrmRouteRequest(input) {
  const parsed = parseDrivingPoints(input, "/route/v1/driving/");
  return parsed ? { points: parsed.points } : null;
}

export function buildLocalTablePayload(input, graph, scenarioParams = { mode: "baseline" }) {
  const request = parseOsrmTableRequest(input);
  if (!request || !graph?.edges?.length) return null;
  const sources = request.sources.map((index) => request.points[index]);
  const destinations = request.destinations.map((index) => request.points[index]);
  const distance = graphOdMatrix({
    graph,
    sources,
    destinations,
    scenarioParams,
    metric: "distance",
  }).matrix;
  const time = graphOdMatrix({
    graph,
    sources,
    destinations,
    scenarioParams,
    metric: "time",
  }).matrix;
  return {
    code: "Ok",
    distances: distance.map((row) =>
      row.map((value) => (Number.isFinite(value) ? value * 1000 : null)),
    ),
    durations: time.map((row) =>
      row.map((value) => (Number.isFinite(value) ? value * 60 : null)),
    ),
  };
}

export function buildLocalRoutePayload(input, graph, scenarioParams = { mode: "baseline" }) {
  const request = parseOsrmRouteRequest(input);
  if (!request || request.points.length < 2 || !graph?.edges?.length) return null;

  const coordinates = [];
  const waypoints = [];
  let distanceKm = 0;
  let travelTimeMin = 0;
  const scenario = buildEdgeScenario(graph, scenarioParams);

  for (const point of request.points) {
    const snap = nearestGraphNode(graph, point);
    if (!snap?.nodeId) return null;
    const node = graph.nodes.get(String(snap.nodeId));
    if (!node) return null;
    waypoints.push({
      location: [node.lon, node.lat],
      name: "OSM graph node",
      distance: Number.isFinite(snap.distanceKm) ? snap.distanceKm * 1000 : 0,
    });
  }

  for (let index = 0; index < request.points.length - 1; index += 1) {
    const source = nearestGraphNode(graph, request.points[index]);
    const target = nearestGraphNode(graph, request.points[index + 1]);
    if (!source?.nodeId || !target?.nodeId) return null;
    const path = reconstructGraphPath(
      graph,
      source.nodeId,
      target.nodeId,
      scenario,
      "time",
    );
    if (!path) return null;
    const leg = path.coordinates.map((point) => [point.lon, point.lat]);
    if (coordinates.length && leg.length) leg.shift();
    coordinates.push(...leg);
    distanceKm += path.distanceKm || 0;
    travelTimeMin += path.travelTimeMin || 0;
  }

  if (coordinates.length < 2) {
    coordinates.splice(
      0,
      coordinates.length,
      ...request.points.map((point) => [point.lon, point.lat]),
    );
  }

  return {
    code: "Ok",
    routes: [
      {
        distance: distanceKm * 1000,
        duration: travelTimeMin * 60,
        geometry: { type: "LineString", coordinates },
      },
    ],
    waypoints,
  };
}
