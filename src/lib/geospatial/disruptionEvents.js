const EVENT_IDS = Object.freeze([
  "none",
  "harbour",
  "cbd",
  "warehouse-outage",
  "factory-loss",
  "demand-surge",
  "access-improvement",
  "severe-weather",
]);

function seededIndex(seed, length, salt = 0) {
  if (!length) return -1;
  let value = (Math.abs(Math.trunc(Number(seed) || 1)) + salt * 2654435761) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) % length;
}

function pointOf(entity) {
  return entity?.point || entity || {};
}

function baseProfile(eventId, facilities, demands) {
  return {
    id: EVENT_IDS.includes(eventId) ? eventId : "none",
    networkScenario: {},
    demandMultipliers: demands.map(() => 1),
    facilityCapacityMultipliers: facilities.map(() => 1),
    affected: { facilities: [], demands: [] },
  };
}

export function createDisruptionEvent({
  eventId = "none",
  seed = 708709,
  facilities = [],
  demands = [],
} = {}) {
  const profile = baseProfile(eventId, facilities, demands);
  const warehouses = facilities
    .map((entity, index) => ({ entity, index }))
    .filter(({ entity }) => entity.role === "warehouse");
  const factories = facilities
    .map((entity, index) => ({ entity, index }))
    .filter(({ entity }) => entity.role === "factory");

  if (profile.id === "harbour") {
    profile.networkScenario = {
      mode: "mixed",
      congestionSeverity: 0.6,
      congestionShare: 0.2,
      closureShare: 0.018,
    };
    demands.forEach((entity, index) => {
      if (Number(pointOf(entity).lat) > -36.86) {
        profile.demandMultipliers[index] = 1.1;
        profile.affected.demands.push(index);
      }
    });
    const northern = [...warehouses].sort(
      (a, b) => Number(pointOf(b.entity).lat) - Number(pointOf(a.entity).lat),
    )[0];
    if (northern) {
      profile.facilityCapacityMultipliers[northern.index] = 0.8;
      profile.affected.facilities.push(northern.index);
    }
  } else if (profile.id === "cbd") {
    profile.networkScenario = {
      mode: "congestion",
      congestionSeverity: 0.75,
      congestionShare: 0.3,
    };
    demands.forEach((entity, index) => {
      const point = pointOf(entity);
      if (
        Number(point.lat) > -36.89 &&
        Number(point.lat) < -36.84 &&
        Number(point.lon) > 174.74 &&
        Number(point.lon) < 174.79
      ) {
        profile.demandMultipliers[index] = 1.08;
        profile.affected.demands.push(index);
      }
    });
  } else if (profile.id === "warehouse-outage") {
    const target = warehouses[seededIndex(seed, warehouses.length, 11)];
    if (target) {
      profile.facilityCapacityMultipliers[target.index] = 0;
      profile.affected.facilities.push(target.index);
    }
  } else if (profile.id === "factory-loss") {
    const target = factories[seededIndex(seed, factories.length, 23)];
    if (target) {
      profile.facilityCapacityMultipliers[target.index] = 0.5;
      profile.affected.facilities.push(target.index);
    }
  } else if (profile.id === "demand-surge") {
    profile.demandMultipliers.fill(1.15);
    profile.affected.demands = demands.map((_, index) => index);
  } else if (profile.id === "access-improvement") {
    profile.networkScenario = {
      mode: "newroad",
      improvement: 0.35,
      improvementShare: 0.4,
      newRoadLinks: 8,
      maxNewRoadKm: 0.8,
      newRoadSpeedKph: 55,
    };
  } else if (profile.id === "severe-weather") {
    profile.networkScenario = {
      mode: "mixed",
      congestionSeverity: 0.85,
      congestionShare: 0.42,
      closureShare: 0.035,
    };
    profile.demandMultipliers.fill(1.05);
    profile.affected.demands = demands.map((_, index) => index);
    const target = warehouses[seededIndex(seed, warehouses.length, 37)];
    if (target) {
      profile.facilityCapacityMultipliers[target.index] = 0.7;
      profile.affected.facilities.push(target.index);
    }
  }
  return Object.freeze({
    ...profile,
    networkScenario: Object.freeze(profile.networkScenario),
    demandMultipliers: Object.freeze(profile.demandMultipliers),
    facilityCapacityMultipliers: Object.freeze(profile.facilityCapacityMultipliers),
    affected: Object.freeze({
      facilities: Object.freeze(profile.affected.facilities),
      demands: Object.freeze(profile.affected.demands),
    }),
  });
}

export function listDisruptionEvents() {
  return [...EVENT_IDS];
}
