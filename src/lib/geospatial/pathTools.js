import { aStarGraph } from "./decisionEngine.js";

const ROUTE_POINT_EPSILON = 1e-7;

function normaliseRoutePoint(point) {
  const rawLat = Array.isArray(point) ? point[0] : point?.lat;
  const rawLon = Array.isArray(point) ? point[1] : (point?.lon ?? point?.lng);
  if (rawLat == null || rawLon == null || rawLat === "" || rawLon === "") return null;
  const lat = Number(rawLat);
  const lon = Number(rawLon);
  return Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
    ? { lat, lon }
    : null;
}

function sameRoutePoint(left, right) {
  return (
    Math.abs(left.lat - right.lat) <= ROUTE_POINT_EPSILON &&
    Math.abs(left.lon - right.lon) <= ROUTE_POINT_EPSILON
  );
}

export function connectRouteEndpoints(
  pathCoordinates = [],
  sourcePoint,
  destinationPoint,
) {
  const source = normaliseRoutePoint(sourcePoint);
  const destination = normaliseRoutePoint(destinationPoint);
  if (!source || !destination) return [];

  const coordinates = [];
  const path = Array.isArray(pathCoordinates) ? pathCoordinates : [];
  for (const point of [source, ...path, destination]) {
    const normalised = normaliseRoutePoint(point);
    if (!normalised) continue;
    if (!coordinates.length || !sameRoutePoint(coordinates.at(-1), normalised)) {
      coordinates.push(normalised);
    }
  }
  return coordinates.length >= 2 ? coordinates : [];
}

export function reconstructGraphPath(
  graph,
  sourceNodeId,
  targetNodeId,
  scenario = {},
  metric = "time",
) {
  const source = String(sourceNodeId);
  const target = String(targetNodeId);
  const result = aStarGraph(graph, source, target, scenario, metric);
  const cost = result?.cost;
  if (!Number.isFinite(cost)) return null;

  const edges = [];
  let cursor = target;
  let guard = 0;
  const maxSteps = Math.max(
    1,
    graph.edges.length + (scenario.shortcuts?.length || 0) + 1,
  );
  while (cursor !== source) {
    const step = result.previous.get(cursor);
    if (!step || guard++ > maxSteps) return null;
    edges.push(step.edge);
    cursor = step.node;
  }
  edges.reverse();

  const first = graph.nodes.get(source);
  if (!first) return null;
  const coordinates = [{ lat: first.lat, lon: first.lon }];
  for (const edge of edges) {
    const point = graph.nodes.get(String(edge.to));
    if (!point) return null;
    coordinates.push({ lat: point.lat, lon: point.lon });
  }

  const distanceKm = edges.reduce((total, edge) => total + edge.lengthKm, 0);
  const travelTimeMin = edges.reduce((total, edge) => {
    const factor = edge.proposed ? 1 : scenario.factors?.get(edge.segmentKey) || 1;
    return total + edge.timeMin * factor;
  }, 0);

  return { cost, edges, coordinates, distanceKm, travelTimeMin };
}

export function routeGraphNeedsRefresh({ engine, graph, graphBounds, points = [] }) {
  if (engine !== "osm") return false;
  if (!graph) return true;
  if (!Array.isArray(graphBounds) || graphBounds.length !== 4) return true;
  const [south, west, north, east] = graphBounds.map(Number);
  if (![south, west, north, east].every(Number.isFinite)) return true;
  return points.some((point) => {
    const lat = Number(point?.lat);
    const lon = Number(point?.lon);
    return (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < south ||
      lat > north ||
      lon < west ||
      lon > east
    );
  });
}
