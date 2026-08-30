import { aStarGraph } from "./decisionEngine.js";

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
