const EMPTY_SERVICE_HEALTH = Object.freeze({
  nominatim: Object.freeze({ state: "idle", message: "" }),
  osrm: Object.freeze({ state: "idle", message: "" }),
  overpass: Object.freeze({ state: "idle", message: "" }),
});

function initialState() {
  return {
    entities: { facilities: [], demands: [] },
    graph: null,
    graphVersion: "none",
    networkMatrices: {},
    mainSolution: null,
    fleetSolution: null,
    transshipmentSolution: null,
    monteCarloResult: null,
    criticalityResult: null,
    routeVisuals: [],
    serviceHealth: EMPTY_SERVICE_HEALTH,
    scenarioRevision: 0,
    freshness: {
      main: "stale",
      fleet: "stale",
      transshipment: "stale",
      monteCarlo: "stale",
      criticality: "stale",
      comparison: "stale",
    },
    scenarioSlots: { A: null, B: null },
    scenarioInputs: {},
    presentation: { map: null, leaflet: null },
  };
}

function downstreamFreshness(freshness, from) {
  const next = { ...freshness };
  const order = [
    "main",
    "fleet",
    "transshipment",
    "monteCarlo",
    "criticality",
    "comparison",
  ];
  const start = Math.max(0, order.indexOf(from));
  for (let index = start; index < order.length; index += 1)
    next[order[index]] = "stale";
  return next;
}

export function createGeospatialStore(seed = {}) {
  let state = { ...initialState(), ...seed };
  const listeners = new Set();
  let operationSequence = 0;

  const emit = (reason) => {
    for (const listener of listeners) listener(state, reason);
  };
  const replace = (patch, reason) => {
    state = { ...state, ...patch };
    emit(reason);
    return state;
  };
  const invalidate = (reason, from = "main") => {
    const revision = state.scenarioRevision + 1;
    const clearMain = from === "main";
    replace(
      {
        scenarioRevision: revision,
        freshness: downstreamFreshness(state.freshness, from),
        ...(clearMain ? { mainSolution: null } : {}),
        fleetSolution: null,
        transshipmentSolution: null,
        monteCarloResult: null,
        criticalityResult: null,
        routeVisuals: [],
      },
      reason,
    );
    return revision;
  };

  return Object.freeze({
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setEntities(entities) {
      state = { ...state, entities };
      invalidate("entities", "main");
    },
    setGraph(graph, version = graph?.version || `graph-${state.scenarioRevision + 1}`) {
      state = { ...state, graph, graphVersion: version, networkMatrices: {} };
      invalidate("graph", "main");
    },
    setNetworkMatrix(name, matrix) {
      replace(
        { networkMatrices: { ...state.networkMatrices, [name]: matrix } },
        `matrix:${name}`,
      );
    },
    updateInputs(reason = "inputs") {
      return invalidate(reason, "main");
    },
    begin(operation) {
      return Object.freeze({
        operation,
        operationId: ++operationSequence,
        scenarioRevision: state.scenarioRevision,
      });
    },
    commit(token, field, value, freshnessKey = null) {
      if (!token || token.scenarioRevision !== state.scenarioRevision) return false;
      const freshness = freshnessKey
        ? { ...state.freshness, [freshnessKey]: "current" }
        : state.freshness;
      replace({ [field]: value, freshness }, `commit:${field}`);
      return true;
    },
    setMainSolution(solution, token = null) {
      const active = token || {
        scenarioRevision: state.scenarioRevision,
        operation: "main",
      };
      if (active.scenarioRevision !== state.scenarioRevision) return false;
      replace(
        {
          mainSolution: solution,
          fleetSolution: null,
          transshipmentSolution: null,
          monteCarloResult: null,
          criticalityResult: null,
          routeVisuals: [],
          freshness: {
            ...downstreamFreshness(state.freshness, "fleet"),
            main: "current",
          },
        },
        "commit:mainSolution",
      );
      return true;
    },
    setScenarioSlot(slot, payload) {
      if (slot !== "A" && slot !== "B")
        throw new RangeError("Scenario slot must be A or B");
      replace(
        { scenarioSlots: { ...state.scenarioSlots, [slot]: payload } },
        `scenario:${slot}`,
      );
    },
    setScenarioInputs(inputs) {
      replace(
        { scenarioInputs: { ...state.scenarioInputs, ...inputs } },
        "scenario-inputs",
      );
    },
    setRouteVisuals(routes, token = null) {
      if (token && token.scenarioRevision !== state.scenarioRevision) return false;
      replace({ routeVisuals: Array.isArray(routes) ? routes : [] }, "route-visuals");
      return true;
    },
    setServiceHealth(service, health) {
      replace(
        {
          serviceHealth: {
            ...state.serviceHealth,
            [service]: { ...state.serviceHealth[service], ...health },
          },
        },
        `service:${service}`,
      );
    },
    attachPresentation(map, leaflet) {
      replace({ presentation: { map, leaflet } }, "presentation");
    },
    reset(seedState = {}) {
      state = {
        ...initialState(),
        ...seedState,
        scenarioRevision: state.scenarioRevision + 1,
      };
      emit("reset");
    },
  });
}

let singleton;

export function getGeospatialStore() {
  if (!singleton) singleton = createGeospatialStore();
  return singleton;
}
