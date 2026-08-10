export const optimisationUniverse = {
  products: [
    { id: "core", name: "Core Kit", unitContribution: 42, materialUse: 3, labourUse: 2 },
    { id: "premium", name: "Premium Kit", unitContribution: 58, materialUse: 4, labourUse: 5 },
  ],
  resources: {
    materialCapacity: 240,
    labourCapacity: 250,
  },
  facilities: [
    { id: "north", name: "North Plant", capacity: 520 },
    { id: "south", name: "South Plant", capacity: 420 },
  ],
  regions: [
    { id: "metro", name: "Metro", demand: 360 },
    { id: "coast", name: "Coast", demand: 280 },
    { id: "inland", name: "Inland", demand: 220 },
  ],
  transportCost: {
    north: { metro: 4.2, coast: 5.4, inland: 6.1 },
    south: { metro: 5.1, coast: 3.9, inland: 4.6 },
  },
  candidateHubs: [
    { id: "central", name: "Central Hub", capacity: 620, fixedCost: 1450 },
    { id: "harbour", name: "Harbour Hub", capacity: 480, fixedCost: 1120 },
  ],
  capacityContract: {
    linearValuePerUnit: 96,
    congestionCoefficient: 0.08,
    fixedBase: 18000,
    operationalChoices: [575, 600, 625],
  },
  carriers: [
    { id: "a", name: "Carrier A", minVolume: 180, maxVolume: 420, unitCost: 7.2 },
    { id: "b", name: "Carrier B", minVolume: 120, maxVolume: 360, unitCost: 6.7 },
    { id: "c", name: "Carrier C", minVolume: 0, maxVolume: 300, unitCost: 7.8 },
  ],
  periods: [
    { period: 1, demand: 180, productionCost: 12, holdingCost: 1.2, setupCost: 420 },
    { period: 2, demand: 260, productionCost: 12, holdingCost: 1.2, setupCost: 420 },
    { period: 3, demand: 150, productionCost: 12, holdingCost: 1.2, setupCost: 420 },
    { period: 4, demand: 310, productionCost: 12, holdingCost: 1.2, setupCost: 420 },
  ],
  planningCases: [
    {
      horizon: "Strategic",
      decision: "Choose network footprint",
      example: "Open a distribution hub",
      reversibility: "Low",
    },
    {
      horizon: "Tactical",
      decision: "Allocate medium-term capacity",
      example: "Select carrier capacity",
      reversibility: "Medium",
    },
    {
      horizon: "Operational",
      decision: "Execute short-term flows",
      example: "Set weekly production and fulfilment",
      reversibility: "High",
    },
  ],
} as const;

export type OptimisationUniverse = typeof optimisationUniverse;

export function capacityNetValue(capacity: number) {
  const { linearValuePerUnit, congestionCoefficient, fixedBase } =
    optimisationUniverse.capacityContract;
  return linearValuePerUnit * capacity - congestionCoefficient * capacity ** 2 - fixedBase;
}

export const unconstrainedOptimum =
  optimisationUniverse.capacityContract.linearValuePerUnit /
  (2 * optimisationUniverse.capacityContract.congestionCoefficient);

export const productMixVertices = [
  { core: 0, premium: 0 },
  { core: 80, premium: 0 },
  { core: 0, premium: 50 },
  { core: 200 / 7, premium: 270 / 7 },
].map((point) => ({
  ...point,
  contribution:
    point.core * optimisationUniverse.products[0].unitContribution +
    point.premium * optimisationUniverse.products[1].unitContribution,
}));
