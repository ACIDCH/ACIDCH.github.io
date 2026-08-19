const EPS = 1e-9;

function finite(value) {
  return Number.isFinite(value);
}

export function nearestNeighbourTour(matrix) {
  const n = matrix.length;
  if (n <= 1) {
    return {
      order: [0],
      cost: 0,
      method: "nearest-neighbour",
      complete: true,
      unvisited: [],
      returnBlocked: false,
    };
  }

  const remaining = new Set(Array.from({ length: n - 1 }, (_, index) => index + 1));
  const order = [0];
  let current = 0;
  let cost = 0;

  while (remaining.size) {
    let next = -1;
    let best = Infinity;
    for (const node of remaining) {
      const candidate = matrix[current]?.[node];
      if (finite(candidate) && candidate < best) {
        next = node;
        best = candidate;
      }
    }
    if (next < 0) {
      return {
        order,
        cost: Infinity,
        method: "nearest-neighbour",
        complete: false,
        unvisited: [...remaining],
        returnBlocked: false,
      };
    }
    order.push(next);
    remaining.delete(next);
    cost += best;
    current = next;
  }

  const back = matrix[current]?.[0];
  if (!finite(back)) {
    return {
      order,
      cost: Infinity,
      method: "nearest-neighbour",
      complete: false,
      unvisited: [],
      returnBlocked: true,
    };
  }

  order.push(0);
  cost += back;
  return {
    order,
    cost,
    method: "nearest-neighbour",
    complete: true,
    unvisited: [],
    returnBlocked: false,
  };
}

export function solveTspTour(matrix, { exactLimit = 11 } = {}) {
  const n = matrix.length;
  if (n <= 1) {
    return {
      order: [0],
      cost: 0,
      method: "exact",
      complete: true,
      unvisited: [],
      returnBlocked: false,
    };
  }
  if (n - 1 > exactLimit) return nearestNeighbourTour(matrix);

  const bits = n - 1;
  const size = 1 << bits;
  const dp = Array.from({ length: size }, () => Array(n).fill(Infinity));
  const previous = Array.from({ length: size }, () => Array(n).fill(-1));

  for (let node = 1; node < n; node += 1) {
    const startCost = matrix[0]?.[node];
    if (finite(startCost)) dp[1 << (node - 1)][node] = startCost;
  }

  for (let mask = 1; mask < size; mask += 1) {
    for (let end = 1; end < n; end += 1) {
      if (!(mask & (1 << (end - 1)))) continue;
      const prior = mask ^ (1 << (end - 1));
      if (!prior) continue;
      for (let before = 1; before < n; before += 1) {
        if (!(prior & (1 << (before - 1)))) continue;
        const leg = matrix[before]?.[end];
        if (!finite(dp[prior][before]) || !finite(leg)) continue;
        const candidate = dp[prior][before] + leg;
        if (candidate + EPS < dp[mask][end]) {
          dp[mask][end] = candidate;
          previous[mask][end] = before;
        }
      }
    }
  }

  const full = size - 1;
  let end = -1;
  let best = Infinity;
  for (let node = 1; node < n; node += 1) {
    const back = matrix[node]?.[0];
    if (!finite(dp[full][node]) || !finite(back)) continue;
    const candidate = dp[full][node] + back;
    if (candidate < best) {
      end = node;
      best = candidate;
    }
  }

  if (end < 0 || !finite(best)) {
    const diagnostic = nearestNeighbourTour(matrix);
    return {
      ...diagnostic,
      order: diagnostic.order,
      cost: Infinity,
      method: "exact",
      complete: false,
    };
  }

  const reversed = [];
  let mask = full;
  let current = end;
  while (current > 0) {
    reversed.push(current);
    const next = previous[mask][current];
    mask ^= 1 << (current - 1);
    current = next;
  }

  return {
    order: [0, ...reversed.reverse(), 0],
    cost: best,
    method: "exact",
    complete: true,
    unvisited: [],
    returnBlocked: false,
  };
}

export function splitByCapacity(order, deliveries, capacity) {
  const trips = [];
  let currentTrip = [];
  let remaining = Math.max(1, Number(capacity) || 1);

  for (const node of order) {
    if (node === 0) continue;
    const delivery = deliveries[node - 1];
    if (!delivery) continue;
    let flow = Math.max(0, Number(delivery.flow) || 0);
    while (flow > EPS) {
      if (remaining <= EPS) {
        if (currentTrip.length) trips.push(currentTrip);
        currentTrip = [];
        remaining = Math.max(1, Number(capacity) || 1);
      }
      const amount = Math.min(flow, remaining);
      currentTrip.push({ ...delivery, amount });
      flow -= amount;
      remaining -= amount;
      if (remaining <= EPS) {
        trips.push(currentTrip);
        currentTrip = [];
        remaining = Math.max(1, Number(capacity) || 1);
      }
    }
  }
  if (currentTrip.length) trips.push(currentTrip);
  return trips;
}

export function totalTripFlow(trips) {
  return trips.reduce(
    (total, trip) =>
      total + trip.reduce((tripTotal, stop) => tripTotal + (Number(stop.amount) || 0), 0),
    0,
  );
}
