const EPS = 1e-9;

function value(matrix, from, to) {
  const next = matrix?.[from]?.[to];
  return Number.isFinite(next) ? next : Infinity;
}

function routeCost(stops, matrix) {
  let total = 0;
  let previous = 0;
  for (const stop of stops) {
    total += value(matrix, previous, stop.stopIndex);
    previous = stop.stopIndex;
  }
  total += value(matrix, previous, 0);
  return total;
}

function improveTwoOpt(stops, matrix) {
  let best = [...stops];
  let bestCost = routeCost(best, matrix);
  let improved = true;
  while (improved) {
    improved = false;
    for (let from = 0; from < best.length - 1; from += 1) {
      for (let to = from + 1; to < best.length; to += 1) {
        const candidate = [
          ...best.slice(0, from),
          ...best.slice(from, to + 1).reverse(),
          ...best.slice(to + 1),
        ];
        const candidateCost = routeCost(candidate, matrix);
        if (candidateCost + EPS < bestCost) {
          best = candidate;
          bestCost = candidateCost;
          improved = true;
        }
      }
    }
  }
  return best;
}

function splitDeliveries(deliveries, capacity) {
  const fragments = [];
  deliveries.forEach((delivery, deliveryIndex) => {
    let remaining = Math.max(0, Number(delivery.demand) || 0);
    while (remaining > EPS) {
      const amount = Math.min(capacity, remaining);
      fragments.push({
        fragmentId: fragments.length,
        deliveryIndex,
        stopIndex: deliveryIndex + 1,
        id: delivery.id ?? deliveryIndex,
        name: delivery.name || `Demand ${deliveryIndex + 1}`,
        amount,
      });
      remaining -= amount;
    }
  });
  return fragments;
}

function tryMerge(left, right, first, second, capacity, matrix) {
  if (left.load + right.load > capacity + EPS) return null;
  const orientations = [];
  const leftVariants = [left.stops, [...left.stops].reverse()];
  const rightVariants = [right.stops, [...right.stops].reverse()];
  for (const a of leftVariants) {
    for (const b of rightVariants) {
      if (a.at(-1).fragmentId !== first || b[0].fragmentId !== second) continue;
      const stops = [...a, ...b];
      orientations.push({ stops, cost: routeCost(stops, matrix) });
    }
  }
  return orientations.sort((a, b) => a.cost - b.cost)[0] || null;
}

export function buildSplitDeliveryRoutes({
  deliveries,
  durationMatrix,
  distanceMatrix = null,
  vehicleCapacity,
} = {}) {
  const capacity = Math.max(EPS, Number(vehicleCapacity) || 0);
  if (
    !Array.isArray(deliveries) ||
    !deliveries.length ||
    !Array.isArray(durationMatrix)
  ) {
    return { feasible: false, reason: "missing-input", trips: [] };
  }
  const fragments = splitDeliveries(deliveries, capacity);
  let routes = fragments.map((fragment) => ({
    id: fragment.fragmentId,
    stops: [fragment],
    load: fragment.amount,
  }));
  const savings = [];
  for (const first of fragments) {
    for (const second of fragments) {
      if (first.fragmentId === second.fragmentId) continue;
      const saving =
        value(durationMatrix, first.stopIndex, 0) +
        value(durationMatrix, 0, second.stopIndex) -
        value(durationMatrix, first.stopIndex, second.stopIndex);
      if (Number.isFinite(saving)) {
        savings.push({ first: first.fragmentId, second: second.fragmentId, saving });
      }
    }
  }
  savings.sort(
    (a, b) => b.saving - a.saving || a.first - b.first || a.second - b.second,
  );
  for (const candidate of savings) {
    const leftIndex = routes.findIndex((route) =>
      route.stops.some((stop) => stop.fragmentId === candidate.first),
    );
    const rightIndex = routes.findIndex((route) =>
      route.stops.some((stop) => stop.fragmentId === candidate.second),
    );
    if (leftIndex < 0 || rightIndex < 0 || leftIndex === rightIndex) continue;
    const merged = tryMerge(
      routes[leftIndex],
      routes[rightIndex],
      candidate.first,
      candidate.second,
      capacity,
      durationMatrix,
    );
    if (!merged) continue;
    const next = {
      id: Math.min(routes[leftIndex].id, routes[rightIndex].id),
      stops: merged.stops,
      load: routes[leftIndex].load + routes[rightIndex].load,
    };
    routes = routes.filter((_, index) => index !== leftIndex && index !== rightIndex);
    routes.push(next);
  }

  const trips = routes
    .map((route, index) => {
      const stops = improveTwoOpt(route.stops, durationMatrix);
      const durationMin = routeCost(stops, durationMatrix);
      const distanceKm = distanceMatrix ? routeCost(stops, distanceMatrix) : null;
      return {
        tripId: `trip-${index + 1}`,
        depotStart: true,
        depotReturn: true,
        stops,
        load: route.load,
        loadUtilisation: route.load / capacity,
        durationMin,
        distanceKm,
        reachable:
          Number.isFinite(durationMin) &&
          (distanceKm == null || Number.isFinite(distanceKm)),
      };
    })
    .sort((a, b) => b.durationMin - a.durationMin || a.tripId.localeCompare(b.tripId));
  const feasible = trips.every(
    (trip) =>
      trip.load <= capacity + EPS &&
      trip.depotStart &&
      trip.depotReturn &&
      trip.reachable,
  );
  return {
    feasible,
    reason: feasible ? null : "route-integrity",
    solverMode: "heuristic",
    method: "split-delivery-clarke-wright+2opt",
    vehicleCapacity: capacity,
    trips,
    routedDemand: trips.reduce((sum, trip) => sum + trip.load, 0),
  };
}

export function assignTripsToVehicles(
  trips,
  { vehicleCount, shiftHours, tripsPerVehicle } = {},
) {
  const count = Math.max(0, Math.trunc(Number(vehicleCount) || 0));
  const shiftMinutes = Math.max(0, Number(shiftHours) || 0) * 60;
  const maximumTrips = Math.max(0, Math.trunc(Number(tripsPerVehicle) || 0));
  const vehicles = Array.from({ length: count }, (_, index) => ({
    vehicleId: `vehicle-${index + 1}`,
    trips: [],
    durationMin: 0,
  }));
  const unassigned = [];
  for (const trip of [...trips].sort((a, b) => b.durationMin - a.durationMin)) {
    const candidate = vehicles
      .filter(
        (vehicle) =>
          vehicle.trips.length < maximumTrips &&
          vehicle.durationMin + trip.durationMin <= shiftMinutes + EPS,
      )
      .sort(
        (a, b) =>
          a.durationMin - b.durationMin || a.vehicleId.localeCompare(b.vehicleId),
      )[0];
    if (!candidate) unassigned.push(trip);
    else {
      candidate.trips.push(trip);
      candidate.durationMin += trip.durationMin;
    }
  }
  return {
    feasible: unassigned.length === 0,
    vehicles: vehicles.map((vehicle) => ({
      ...vehicle,
      remainingShiftMin: Math.max(0, shiftMinutes - vehicle.durationMin),
      remainingTrips: Math.max(0, maximumTrips - vehicle.trips.length),
    })),
    unassigned,
    shiftMinutes,
    tripsPerVehicle: maximumTrips,
  };
}

export function validateFleetPlan(plan, assignedDemand) {
  const routed = plan?.trips?.reduce((sum, trip) => sum + trip.load, 0) || 0;
  return {
    valid:
      plan?.feasible === true &&
      Math.abs(routed - Math.max(0, Number(assignedDemand) || 0)) <= 1e-6,
    routedDemand: routed,
    assignedDemand: Math.max(0, Number(assignedDemand) || 0),
  };
}
