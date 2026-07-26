import type { SupplyChainDataset } from "./types";

export const demoSupplyChainDataset: SupplyChainDataset = {
  source: "demo",
  nodes: [
    {
      id: "S1",
      label: { en: "Supplier North", zh: "北部供应点" },
      kind: "supplier",
      x: 100,
      y: 100,
    },
    {
      id: "S2",
      label: { en: "Supplier South", zh: "南部供应点" },
      kind: "supplier",
      x: 100,
      y: 265,
    },
    {
      id: "D1",
      label: { en: "Distribution A", zh: "配送点 A" },
      kind: "distribution",
      x: 650,
      y: 65,
    },
    {
      id: "D2",
      label: { en: "Distribution B", zh: "配送点 B" },
      kind: "distribution",
      x: 650,
      y: 180,
    },
    {
      id: "D3",
      label: { en: "Distribution C", zh: "配送点 C" },
      kind: "distribution",
      x: 650,
      y: 300,
    },
  ],
  edges: [
    { id: "S1-D1", source: "S1", target: "D1", cost: 4, capacity: 80 },
    { id: "S1-D2", source: "S1", target: "D2", cost: 6, capacity: 55 },
    { id: "S2-D2", source: "S2", target: "D2", cost: 3, capacity: 70 },
    { id: "S2-D3", source: "S2", target: "D3", cost: 5, capacity: 75 },
  ],
  scenarios: [
    {
      id: "baseline",
      label: { en: "Baseline demo", zh: "基准演示" },
      edges: {
        "S1-D1": { flow: 60, status: "standard" },
        "S1-D2": { flow: 55, status: "constrained" },
        "S2-D2": { flow: 45, status: "standard" },
        "S2-D3": { flow: 65, status: "standard" },
      },
    },
    {
      id: "optimised",
      label: { en: "Optimised demo", zh: "优化演示" },
      edges: {
        "S1-D1": { flow: 75, status: "optimal" },
        "S1-D2": { flow: 30, status: "standard" },
        "S2-D2": { flow: 70, status: "optimal" },
        "S2-D3": { flow: 75, status: "constrained" },
      },
    },
  ],
};
