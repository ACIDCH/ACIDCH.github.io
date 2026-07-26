import type { Locale } from "../../config/site";

export type NetworkNode = {
  id: string;
  label: Record<Locale, string>;
  kind: "supplier" | "distribution";
  x: number;
  y: number;
};

export type EdgeStatus = "standard" | "optimal" | "constrained";

export type NetworkEdge = {
  id: string;
  source: string;
  target: string;
  cost: number;
  capacity: number;
};

export type ScenarioEdge = {
  flow: number;
  status: EdgeStatus;
};

export type NetworkScenario = {
  id: "baseline" | "optimised";
  label: Record<Locale, string>;
  edges: Record<string, ScenarioEdge>;
};

export type SupplyChainDataset = {
  source: "demo" | "verified";
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  scenarios: NetworkScenario[];
};

export type NetworkEdgeView = NetworkEdge &
  ScenarioEdge & {
    sourceNode: NetworkNode;
    targetNode: NetworkNode;
  };

export type SupplyChainView = {
  source: SupplyChainDataset["source"];
  scenario: NetworkScenario;
  nodes: NetworkNode[];
  edges: NetworkEdgeView[];
  totalCostIndex: number;
  totalFlow: number;
};
