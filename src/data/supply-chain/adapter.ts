import { demoSupplyChainDataset } from "./demo";
import type { SupplyChainDataset, SupplyChainView } from "./types";

export function adaptSupplyChainDataset(
  dataset: SupplyChainDataset,
  scenarioId: "baseline" | "optimised" = "baseline",
): SupplyChainView {
  const nodeMap = new Map(dataset.nodes.map((node) => [node.id, node]));
  const scenario = dataset.scenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    throw new Error(`Unknown supply-chain scenario: ${scenarioId}`);
  }

  const edges = dataset.edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const scenarioEdge = scenario.edges[edge.id];

    if (!sourceNode || !targetNode || !scenarioEdge) {
      throw new Error(`Invalid supply-chain edge: ${edge.id}`);
    }

    return { ...edge, ...scenarioEdge, sourceNode, targetNode };
  });

  return {
    source: dataset.source,
    scenario,
    nodes: dataset.nodes,
    edges,
    totalCostIndex: edges.reduce((total, edge) => total + edge.cost * edge.flow, 0),
    totalFlow: edges.reduce((total, edge) => total + edge.flow, 0),
  };
}

export function getDemoSupplyChainView(
  scenarioId: "baseline" | "optimised" = "baseline",
): SupplyChainView {
  return adaptSupplyChainDataset(demoSupplyChainDataset, scenarioId);
}
