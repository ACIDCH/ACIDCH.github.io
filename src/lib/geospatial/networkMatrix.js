const MATRIX_UNITS = Object.freeze({
  distanceKm: "km",
  durationMin: "min",
  generalizedCostNZD: "NZD",
});

function matrixShape(matrix, name) {
  if (!Array.isArray(matrix)) throw new TypeError(`${name} must be a matrix`);
  const rows = matrix.length;
  const columns = rows ? matrix[0]?.length : 0;
  if (!Number.isInteger(columns)) throw new TypeError(`${name} must contain rows`);
  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== columns) {
      throw new RangeError(`${name} must be rectangular`);
    }
    for (const value of row) {
      if (value !== Infinity && (!Number.isFinite(value) || value < 0)) {
        throw new RangeError(`${name} contains an invalid value`);
      }
    }
  }
  return { rows, columns };
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.map((value) => Number(value)));
}

function sameShape(a, b) {
  return a.rows === b.rows && a.columns === b.columns;
}

function costMatrix(distanceKm, durationMin, costPerKm, costPerMinute) {
  return distanceKm.map((row, i) =>
    row.map((distance, j) => {
      const duration = durationMin[i][j];
      if (!Number.isFinite(distance) || !Number.isFinite(duration)) return Infinity;
      return distance * costPerKm + duration * costPerMinute;
    }),
  );
}

export function createNetworkMatrix({
  distanceKm,
  durationMin,
  costPerKm = 0,
  costPerMinute = 0,
  source = "unknown",
  method = "unknown",
  version = "unversioned",
  scenario = "baseline",
} = {}) {
  const distanceShape = matrixShape(distanceKm, "distanceKm");
  const durationShape = matrixShape(durationMin, "durationMin");
  if (!sameShape(distanceShape, durationShape)) {
    throw new RangeError("distanceKm and durationMin dimensions must match");
  }
  const perKm = Math.max(0, Number(costPerKm) || 0);
  const perMinute = Math.max(0, Number(costPerMinute) || 0);
  const distance = cloneMatrix(distanceKm);
  const duration = cloneMatrix(durationMin);
  return Object.freeze({
    kind: "NetworkMatrix",
    distanceKm: distance,
    durationMin: duration,
    generalizedCostNZD: costMatrix(distance, duration, perKm, perMinute),
    dimensions: Object.freeze(distanceShape),
    units: MATRIX_UNITS,
    pricing: Object.freeze({ costPerKm: perKm, costPerMinute: perMinute }),
    provenance: Object.freeze({ source, method, version, scenario }),
  });
}

export function networkMatrixFromDistance(
  distanceKm,
  {
    assumedSpeedKph = 35,
    costPerKm = 0,
    costPerMinute = 0,
    source = "fast-od",
    method = "single-road-distance-baseline",
    version = "unversioned",
    scenario = "baseline",
  } = {},
) {
  const speed = Math.max(1, Number(assumedSpeedKph) || 35);
  const durationMin = distanceKm.map((row) =>
    row.map((distance) =>
      Number.isFinite(distance) ? (Number(distance) / speed) * 60 : Infinity,
    ),
  );
  return createNetworkMatrix({
    distanceKm,
    durationMin,
    costPerKm,
    costPerMinute,
    source,
    method,
    version,
    scenario,
  });
}

export function networkMatrixFromOsrm(
  payload,
  { costPerKm = 0, costPerMinute = 0, version = "live", scenario = "baseline" } = {},
) {
  if (!Array.isArray(payload?.distances) || !Array.isArray(payload?.durations)) {
    throw new TypeError("OSRM table must include distance and duration matrices");
  }
  return createNetworkMatrix({
    distanceKm: payload.distances.map((row) =>
      row.map((value) => (Number.isFinite(value) ? value / 1000 : Infinity)),
    ),
    durationMin: payload.durations.map((row) =>
      row.map((value) => (Number.isFinite(value) ? value / 60 : Infinity)),
    ),
    costPerKm,
    costPerMinute,
    source: "osrm",
    method: "road-table",
    version,
    scenario,
  });
}

export function repriceNetworkMatrix(
  matrix,
  {
    costPerKm = matrix?.pricing?.costPerKm,
    costPerMinute = matrix?.pricing?.costPerMinute,
  } = {},
) {
  assertNetworkMatrix(matrix);
  return createNetworkMatrix({
    distanceKm: matrix.distanceKm,
    durationMin: matrix.durationMin,
    costPerKm,
    costPerMinute,
    ...matrix.provenance,
  });
}

function scenarioRandom(seed = 1) {
  let value = Math.abs(Math.trunc(Number(seed) || 1)) % 2147483647;
  if (value === 0) value = 1;
  return () => ((value = (value * 48271) % 2147483647) - 1) / 2147483646;
}

export function applyNetworkScenario(matrix, params = {}) {
  assertNetworkMatrix(matrix);
  const {
    mode = "baseline",
    congestionSeverity = 0.35,
    congestionShare = 0.6,
    closureShare = 0.1,
    improvement = 0.2,
    improvementShare = 0.3,
    seed = 1,
  } = params;
  const random = scenarioRandom(seed);
  const distanceKm = matrix.distanceKm.map((row) => [...row]);
  const durationMin = matrix.durationMin.map((row) => [...row]);
  for (let i = 0; i < distanceKm.length; i += 1) {
    for (let j = 0; j < distanceKm[i].length; j += 1) {
      if (!Number.isFinite(distanceKm[i][j]) || !Number.isFinite(durationMin[i][j])) {
        distanceKm[i][j] = Infinity;
        durationMin[i][j] = Infinity;
        continue;
      }
      if ((mode === "congestion" || mode === "mixed") && random() < congestionShare) {
        durationMin[i][j] *= 1 + congestionSeverity * (0.45 + 0.55 * random());
      }
      if ((mode === "closure" || mode === "mixed") && random() < closureShare) {
        distanceKm[i][j] = Infinity;
        durationMin[i][j] = Infinity;
        continue;
      }
      if ((mode === "newroad" || mode === "mixed") && random() < improvementShare) {
        const factor = Math.max(0.05, 1 - improvement * (0.55 + 0.45 * random()));
        distanceKm[i][j] *= factor;
        durationMin[i][j] *= factor;
      }
    }
  }
  return createNetworkMatrix({
    distanceKm,
    durationMin,
    costPerKm: matrix.pricing.costPerKm,
    costPerMinute: matrix.pricing.costPerMinute,
    ...matrix.provenance,
    scenario: mode,
  });
}

export function assertNetworkMatrix(matrix) {
  if (matrix?.kind !== "NetworkMatrix") {
    throw new TypeError("Expected a NetworkMatrix with explicit physical units");
  }
  const distanceShape = matrixShape(matrix.distanceKm, "distanceKm");
  const durationShape = matrixShape(matrix.durationMin, "durationMin");
  const costShape = matrixShape(matrix.generalizedCostNZD, "generalizedCostNZD");
  if (
    !sameShape(distanceShape, durationShape) ||
    !sameShape(distanceShape, costShape)
  ) {
    throw new RangeError("NetworkMatrix dimensions are inconsistent");
  }
  if (
    matrix.units?.distanceKm !== "km" ||
    matrix.units?.durationMin !== "min" ||
    matrix.units?.generalizedCostNZD !== "NZD"
  ) {
    throw new RangeError("NetworkMatrix units are inconsistent");
  }
  return matrix;
}

export function serviceMetricMatrix(matrix, metric) {
  assertNetworkMatrix(matrix);
  if (metric === "distanceKm") return matrix.distanceKm;
  if (metric === "durationMin") return matrix.durationMin;
  if (metric === "generalizedCostNZD") return matrix.generalizedCostNZD;
  throw new RangeError(`Unsupported network metric: ${metric}`);
}

export function networkMatricesComparable(a, b) {
  try {
    assertNetworkMatrix(a);
    assertNetworkMatrix(b);
  } catch {
    return false;
  }
  return (
    a.units.generalizedCostNZD === b.units.generalizedCostNZD &&
    a.pricing.costPerKm === b.pricing.costPerKm &&
    a.pricing.costPerMinute === b.pricing.costPerMinute
  );
}
