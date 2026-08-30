const EPS = 1e-9;

function flowValue(value) {
  return Math.max(0, Number(value) || 0);
}

export function buildTwoEchelonSankey(snapshot, { width = 760, height = 300 } = {}) {
  if (snapshot?.freshness?.main !== "current" || !snapshot.mainSolution) return null;
  const solution = snapshot.mainSolution;
  const facilities = snapshot.entities.facilities || [];
  const demands = snapshot.entities.demands || [];
  const rawLinks = [
    ...(solution.factoryAssignments || []).map((flow, index) => ({
      id: `fw-${index}`,
      source: `facility-${flow.factory}`,
      target: `facility-${flow.warehouse}`,
      stage: "factoryWarehouse",
      flow: flowValue(flow.flow),
    })),
    ...(solution.assignments || []).map((flow, index) => ({
      id: `wd-${index}`,
      source: `facility-${flow.hub}`,
      target: `demand-${flow.demand}`,
      stage: "warehouseDemand",
      flow: flowValue(flow.flow),
    })),
  ].filter((link) => link.flow > EPS);
  const ids = new Set(rawLinks.flatMap((link) => [link.source, link.target]));
  const nodes = [
    ...facilities
      .map((entity, index) => ({
        id: `facility-${index}`,
        entityIndex: index,
        type: entity.role,
        name: entity.name,
      }))
      .filter((node) => ids.has(node.id)),
    ...demands
      .map((entity, index) => ({
        id: `demand-${index}`,
        entityIndex: index,
        type: "demand",
        name: entity.name,
      }))
      .filter((node) => ids.has(node.id)),
  ];
  const incoming = new Map();
  const outgoing = new Map();
  rawLinks.forEach((link) => {
    incoming.set(link.target, (incoming.get(link.target) || 0) + link.flow);
    outgoing.set(link.source, (outgoing.get(link.source) || 0) + link.flow);
  });
  nodes.forEach((node) => {
    node.value = Math.max(incoming.get(node.id) || 0, outgoing.get(node.id) || 0);
  });
  const columns = ["factory", "warehouse", "demand"].map((type) =>
    nodes.filter((node) => node.type === type),
  );
  const columnTotal = Math.max(
    EPS,
    ...columns.map((column) => column.reduce((sum, node) => sum + node.value, 0)),
  );
  const availableHeight = Math.max(80, height - 32);
  const scale = Math.max(
    0.01,
    (availableHeight - 10 * Math.max(...columns.map((c) => c.length - 1), 0)) /
      columnTotal,
  );
  const xPositions = [36, Math.round(width * 0.48), width - 52];
  columns.forEach((column, columnIndex) => {
    const totalHeight =
      column.reduce((sum, node) => sum + Math.max(8, node.value * scale), 0) +
      Math.max(0, column.length - 1) * 10;
    let y = Math.max(16, (height - totalHeight) / 2);
    column
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
      .forEach((node) => {
        node.x = xPositions[columnIndex];
        node.y = y;
        node.height = Math.max(8, node.value * scale);
        node.width = 12;
        node.sourceOffset = 0;
        node.targetOffset = 0;
        y += node.height + 10;
      });
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links = rawLinks.map((link) => {
    const source = byId.get(link.source);
    const target = byId.get(link.target);
    const thickness = Math.max(1.5, link.flow * scale);
    const sourceY = source.y + source.sourceOffset + thickness / 2;
    const targetY = target.y + target.targetOffset + thickness / 2;
    source.sourceOffset += thickness;
    target.targetOffset += thickness;
    return {
      ...link,
      thickness,
      sourceX: source.x + source.width,
      sourceY,
      targetX: target.x,
      targetY,
    };
  });
  return {
    width,
    height,
    totalFlow: rawLinks
      .filter((link) => link.stage === "warehouseDemand")
      .reduce((sum, link) => sum + link.flow, 0),
    nodes: nodes.map((node) => ({
      id: node.id,
      entityIndex: node.entityIndex,
      type: node.type,
      name: node.name,
      value: node.value,
      x: node.x,
      y: node.y,
      height: node.height,
      width: node.width,
    })),
    links,
  };
}

function alternativeWarehouse(snapshot, demandIndex, assignedHub) {
  const matrix = snapshot.networkMatrices?.active;
  if (!matrix) return null;
  const warehouses = snapshot.entities.facilities
    .map((entity, index) => ({ entity, index }))
    .filter(
      ({ entity, index }) => entity.role === "warehouse" && index !== assignedHub,
    );
  return (
    warehouses
      .map(({ entity, index }) => ({
        index,
        name: entity.name,
        distanceKm: matrix.distanceKm[index]?.[demandIndex],
        durationMin: matrix.durationMin[index]?.[demandIndex],
        generalizedCostNZD: matrix.generalizedCostNZD[index]?.[demandIndex],
      }))
      .filter(
        (candidate) =>
          Number.isFinite(candidate.distanceKm) &&
          Number.isFinite(candidate.durationMin) &&
          Number.isFinite(candidate.generalizedCostNZD),
      )
      .sort(
        (a, b) => a.generalizedCostNZD - b.generalizedCostNZD || a.index - b.index,
      )[0] || null
  );
}

export function explainSupplyChainNode(snapshot, selection) {
  if (snapshot?.freshness?.main !== "current" || !snapshot.mainSolution) {
    return { state: "stale", type: selection?.type || "unknown", fields: {} };
  }
  const solution = snapshot.mainSolution;
  const facilities = snapshot.entities.facilities || [];
  const demands = snapshot.entities.demands || [];
  const index = Number(selection.index);
  if (selection.type === "demand") {
    const entity = demands[index];
    if (!entity) return null;
    const assignment = (solution.assignments || []).find(
      (flow) => flow.demand === index,
    );
    const assignedHub = assignment?.hub;
    const upstream = (solution.factoryAssignments || []).find(
      (flow) => flow.warehouse === assignedHub,
    );
    return {
      state: "current",
      type: "demand",
      title: entity.name,
      fields: {
        demandQuantity: entity.demand,
        assignedWarehouse: facilities[assignedHub]?.name || null,
        assignedFactory: facilities[upstream?.factory]?.name || null,
        distanceKm: assignment?.distanceKm ?? null,
        durationMin: assignment?.durationMin ?? null,
        generalizedCostNZD: assignment?.networkCost ?? null,
        coverageCount: solution.coverCounts?.[index] ?? 0,
        alternative: alternativeWarehouse(snapshot, index, assignedHub),
        disruptionEvent: solution.disruptionEvent || "none",
        expectedUnmetDemand: snapshot.monteCarloResult?.expectedUnmetDemand ?? null,
      },
    };
  }
  const entity = facilities[index];
  if (!entity) return null;
  if (entity.role === "warehouse") {
    const throughput = (solution.throughput || []).find(
      (item) =>
        item.warehouse ===
        facilities
          .filter((facility) => facility.role === "warehouse")
          .findIndex((facility) => facility.id === entity.id),
    );
    const assignments = (solution.assignments || []).filter(
      (flow) => flow.hub === index,
    );
    const incoming = (solution.factoryAssignments || []).filter(
      (flow) => flow.warehouse === index,
    );
    const trips = (snapshot.fleetSolution?.trips || []).filter(
      (trip) => trip.hubName === entity.name,
    );
    const stability = (snapshot.monteCarloResult?.facilityStability || []).find(
      (item) => item.index === index,
    );
    const criticality = snapshot.criticalityResult?.edges?.filter(
      (edge) => (edge.routedFlow || 0) > 0,
    );
    const assignedDemand = assignments.reduce((sum, flow) => sum + flow.flow, 0);
    return {
      state: "current",
      type: "warehouse",
      title: entity.name,
      fields: {
        open: solution.selected?.includes(index) || false,
        physicalCapacity: snapshot.scenarioInputs.facilityCapacity ?? null,
        effectiveCapacity: throughput?.capacity ?? null,
        assignedDemand,
        utilisation: throughput?.utilisation ?? 0,
        factories: incoming
          .map((flow) => facilities[flow.factory]?.name)
          .filter(Boolean),
        customers: assignments
          .map((flow) => demands[flow.demand]?.name)
          .filter(Boolean),
        fleetTrips: trips.length,
        averageDeliveryTimeMin:
          assignedDemand > EPS
            ? assignments.reduce((sum, flow) => sum + flow.flow * flow.durationMin, 0) /
              assignedDemand
            : null,
        fixedCostNZD: snapshot.scenarioInputs.fixedCost ?? null,
        transportContributionNZD: assignments.reduce(
          (sum, flow) => sum + flow.flow * flow.networkCost,
          0,
        ),
        selectionProbability: stability?.probability ?? null,
        disruptionSensitivity: criticality?.length
          ? Math.max(...criticality.map((edge) => edge.score))
          : null,
      },
    };
  }
  const outgoing = (solution.factoryAssignments || []).filter(
    (flow) => flow.factory === index,
  );
  const outflow = outgoing.reduce((sum, flow) => sum + flow.flow, 0);
  const capacity = snapshot.scenarioInputs.facilityCapacity ?? null;
  return {
    state: "current",
    type: "factory",
    title: entity.name,
    fields: {
      supplyCapacity: capacity,
      currentOutflow: outflow,
      utilisation:
        Number.isFinite(capacity) && capacity > 0 ? outflow / capacity : null,
      warehouses: outgoing
        .map((flow) => facilities[flow.warehouse]?.name)
        .filter(Boolean),
      flowContribution:
        solution.totalDemand > EPS ? outflow / solution.totalDemand : null,
      disruptionEvent: solution.disruptionEvent || "none",
    },
  };
}
