const D = globalThis.document;

const wait = (ms) =>
  new globalThis.Promise((resolve) => globalThis.setTimeout(resolve, ms));

const BUNDLED_AUCKLAND_COORDS = Object.freeze({
  hubs: [
    { lat: -36.8552, lon: 174.7465, label: "328 Ponsonby Road" },
    { lat: -36.8617, lon: 174.7355, label: "322 Great North Road" },
    { lat: -36.889, lon: 174.797, label: "214 Green Lane West" },
    { lat: -36.8475, lon: 174.7755, label: "151 Beach Road" },
    { lat: -36.8585, lon: 174.811, label: "76 Coates Avenue" },
    { lat: -36.92, lon: 174.786, label: "151 Neilson Street" },
  ],
  demands: [
    { lat: -36.8485, lon: 174.7633, label: "Auckland CBD" },
    { lat: -36.8875, lon: 174.775, label: "Epsom" },
    { lat: -36.8617, lon: 174.7355, label: "Grey Lynn" },
    { lat: -36.8795, lon: 174.7615, label: "Mount Eden" },
    { lat: -36.871, lon: 174.778, label: "Newmarket" },
    { lat: -36.921, lon: 174.785, label: "Onehunga" },
    { lat: -36.86, lon: 174.81, label: "Orakei" },
    { lat: -36.8552, lon: 174.7465, label: "Ponsonby" },
    { lat: -36.879, lon: 174.8, label: "Remuera" },
    { lat: -36.91, lon: 174.756, label: "Three Kings" },
  ],
});

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const engine = D?.getElementById("geo4-engine");
  const graphStatus = D?.getElementById("geo4-graph-status");
  const policyList = D?.getElementById("geo4-policy-list");
  const addressInput = D?.getElementById("geo4-address");
  if (!root || !shell || !engine || !graphStatus || !policyList || !addressInput) {
    globalThis.setTimeout(boot, 90);
    return;
  }
  if (root.dataset.usabilityRefinementReady === "true") return;
  root.dataset.usabilityRefinementReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        mergedTitle: "设施、覆盖与网络实体",
        entities: "网络实体",
        delete: "删除",
        restore: "恢复",
        active: "当前候选",
        mapAdd: "点击地图添加",
        osmPreferred:
          "默认使用 OSM 道路网络。内置 Auckland 基准点位用于快速启动；首次运行优化会自动加载路网，公共服务暂时不可用时仍可切换快速 OD 网络。",
        loadingOsm: "正在加载 OSM 道路网络，请稍候…",
        reloadGraph: "加载 / 刷新 OSM 路网",
        initialise: "加载 GIS 基准点位",
      }
    : {
        mergedTitle: "Facilities, coverage & network entities",
        entities: "Network entities",
        delete: "Remove",
        restore: "Restore",
        active: "Active candidates",
        mapAdd: "Click map to add",
        osmPreferred:
          "OSM Road Network is the default. Bundled Auckland reference points provide a fast start; the first optimisation run loads the road graph automatically, with Fast OD available if the public service is temporarily unavailable.",
        loadingOsm: "Loading the OSM road network…",
        reloadGraph: "Load / refresh OSM graph",
        initialise: "Load GIS reference points",
      };

  const style = D.createElement("style");
  style.textContent = `
    @media (min-width:821px){
      .geo4__console{width:410px!important}
      .geo4__results{width:410px!important;max-width:410px!important}
      .geo4__scenario-ribbon{max-width:410px!important}
    }
    .geo4__block{padding:.92rem 1rem!important}
    .geo4__block-title strong{font-size:.84rem!important;letter-spacing:.025em!important}
    .geo4__block-title span{font-size:.71rem!important}
    .geo4__field,.geo4__range,.geo4__check,.geo4__step-row{font-size:.77rem!important;line-height:1.4!important}
    .geo4__field input,.geo4__field select{font-size:.78rem!important;padding:.52rem .55rem!important;min-height:36px}
    .geo4 button{font-size:.78rem!important;line-height:1.3!important;padding:.62rem .68rem!important;min-height:38px}
    .geo4__micro{font-size:.71rem!important;line-height:1.55!important;color:#88a6b2!important}
    .geo4__subhead{font-size:.69rem!important;color:#8eabb5!important}
    .geo4__policy-row{grid-template-columns:minmax(0,1fr) 108px 66px!important;padding:.56rem!important;gap:.42rem!important}
    .geo4__custom-row{grid-template-columns:minmax(0,1fr) 78px!important;padding:.56rem!important;gap:.42rem!important}
    .geo4__policy-row strong,.geo4__custom-row strong{font-size:.73rem!important;line-height:1.35!important}
    .geo4__policy-row small,.geo4__custom-row small{font-size:.65rem!important;line-height:1.4!important;color:#86a2ac!important}
    .geo4__policy-row select{font-size:.69rem!important;min-height:34px!important}
    .geo4__policy-row.is-removed{opacity:.58;background:rgba(48,29,36,.36)!important}
    .geo4__entity-toggle{padding:.34rem .38rem!important;min-height:34px!important;font-size:.66rem!important;background:rgba(88,34,48,.35)!important;border-color:rgba(255,117,154,.28)!important;color:#ff9ab7!important}
    .geo4__policy-row.is-removed .geo4__entity-toggle{background:rgba(55,78,29,.3)!important;border-color:rgba(216,255,107,.3)!important;color:#d8ff6b!important}
    .geo4__merged-editor{margin-top:.8rem;padding-top:.78rem;border-top:1px solid rgba(116,190,213,.18)}
    .geo4__merged-editor-heading{display:flex;justify-content:space-between;gap:.8rem;align-items:center;margin:0 0 .52rem;color:#9bb5be;font-size:.72rem}.geo4__merged-editor-heading strong{color:#62ecff;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase}
    .geo4__service-health-head{font-size:.58rem!important}
    .geo4__service-chip strong{font-size:.58rem!important}.geo4__service-chip small{font-size:.52rem!important}.geo4__service-policy{font-size:.54rem!important;line-height:1.45!important}
    .geo4__results-head strong{font-size:.8rem!important}.geo4__results-head span{font-size:.7rem!important}
    .geo4__kpis span,.geo4__cost span{font-size:.65rem!important}.geo4__status{font-size:.71rem!important}.geo4__open-list strong{font-size:.71rem!important}.geo4__open-list small{font-size:.63rem!important}
    .geo4__fleet-note,.geo4__fleet-status,.geo4__trans-note,.geo4__trans-status{font-size:.62rem!important;line-height:1.5!important}
    .geo4__fleet-summary span,.geo4__trans-summary span{font-size:.54rem!important}.geo4__fleet-summary b,.geo4__trans-summary b{font-size:.69rem!important}
    .geo4__osm-preferred{display:flex;gap:.42rem;align-items:flex-start;margin:.5rem 0 0;padding:.48rem .52rem;border:1px solid rgba(98,236,255,.16);background:rgba(8,38,50,.38);color:#8eabb5;font-size:.67rem;line-height:1.45}.geo4__osm-preferred i{flex:0 0 auto;width:7px;height:7px;margin-top:.28rem;border-radius:50%;background:#62ecff;box-shadow:0 0 10px rgba(98,236,255,.55)}
  `;
  D.head.appendChild(style);

  function seedReferenceCoordinates() {
    try {
      const key = "acidch-geo-v4-base-coords";
      const existing = JSON.parse(globalThis.localStorage?.getItem(key) || "null");
      if (existing?.hubs?.length === 6 && existing?.demands?.length === 10) return;
      globalThis.localStorage?.setItem(key, JSON.stringify(BUNDLED_AUCKLAND_COORDS));
    } catch {
      // Storage is an acceleration only; normal GIS services remain available.
    }
  }

  function mergeFacilityEditor() {
    if (root.dataset.entityEditorMerged === "true") return;
    const facilityBlock = policyList.closest(".geo4__block");
    const editorBlock = addressInput.closest(".geo4__block");
    if (!facilityBlock || !editorBlock || facilityBlock === editorBlock) return;
    const facilityTitle = facilityBlock.querySelector(".geo4__block-title strong");
    if (facilityTitle) facilityTitle.textContent = copy.mergedTitle;

    const merged = D.createElement("div");
    merged.className = "geo4__merged-editor";
    merged.innerHTML = `<div class="geo4__merged-editor-heading"><strong>${copy.entities}</strong><span>${copy.active}</span></div>`;
    [...editorBlock.children]
      .filter((child) => !child.classList.contains("geo4__block-title"))
      .forEach((child) => merged.appendChild(child));
    facilityBlock.appendChild(merged);
    editorBlock.remove();
    root.dataset.entityEditorMerged = "true";

    [...root.querySelectorAll(".geo4__scroll > .geo4__block")].forEach((block, index) => {
      const number = block.querySelector(".geo4__block-title > span");
      if (number) number.textContent = String(index + 1).padStart(2, "0");
    });
  }

  function setMapAddLabel() {
    const button = D.getElementById("geo4-map-add");
    if (!button || button.classList.contains("is-active")) return;
    if (button.textContent?.trim() !== copy.mapAdd) button.textContent = copy.mapAdd;
  }

  function syncExcludedFacilityMarkers() {
    const selects = [...policyList.querySelectorAll("select[data-policy]")];
    const markers = [...D.querySelectorAll("#geo4-map path.geo4-facility-node")];
    selects.forEach((select, index) => {
      const marker = markers[index];
      if (!marker) return;
      const removed = select.value === "exclude";
      marker.style.display = removed ? "none" : "";
      marker.setAttribute("aria-hidden", removed ? "true" : "false");
    });
  }

  function decoratePolicyRows() {
    const rows = [...policyList.querySelectorAll(".geo4__policy-row")];
    let activeCount = 0;
    rows.forEach((row) => {
      const select = row.querySelector("select[data-policy]");
      if (!select) return;
      const removed = select.value === "exclude";
      if (!removed) activeCount += 1;
      row.classList.toggle("is-removed", removed);
      let button = row.querySelector(".geo4__entity-toggle");
      if (!button) {
        button = D.createElement("button");
        button.type = "button";
        button.className = "geo4__entity-toggle";
        row.appendChild(button);
        button.addEventListener("click", () => {
          const next = select.value === "exclude" ? "auto" : "exclude";
          select.value = next;
          select.dispatchEvent(new globalThis.Event("change", { bubbles: true }));
          decoratePolicyRows();
        });
      }
      button.textContent = removed ? copy.restore : copy.delete;
    });
    const count = D.getElementById("geo4-facility-count");
    if (count) count.textContent = `${activeCount}/${rows.length}`;
    globalThis.requestAnimationFrame(syncExcludedFacilityMarkers);
  }

  function compactFacilityPreset() {
    if (root.dataset.compactFacilityPreset === "true") return;
    const selects = [...policyList.querySelectorAll("select[data-policy]")];
    if (selects.length < 6) return;
    const seed = Number(D.getElementById("geo4-seed")?.value || 708709);
    const optional = [0, 4, 5];
    const fourth = optional[Math.abs(Math.trunc(seed)) % optional.length];
    const keep = new Set([1, 2, 3, fourth]);
    selects.forEach((select, index) => {
      const next = keep.has(index) ? "auto" : "exclude";
      if (select.value === next) return;
      select.value = next;
      select.dispatchEvent(new globalThis.Event("change", { bubbles: true }));
    });
    root.dataset.compactFacilityPreset = "true";
    decoratePolicyRows();
  }

  const policyObserver = new globalThis.MutationObserver(() => {
    decoratePolicyRows();
    if (root.dataset.compactFacilityPreset !== "true") compactFacilityPreset();
  });
  policyObserver.observe(policyList, { childList: true, subtree: true });

  const mapBox = D.getElementById("geo4-map");
  const mapObserver = new globalThis.MutationObserver(syncExcludedFacilityMarkers);
  if (mapBox) mapObserver.observe(mapBox, { childList: true, subtree: true });

  const mapAddButton = D.getElementById("geo4-map-add");
  const mapAddObserver = new globalThis.MutationObserver(setMapAddLabel);
  if (mapAddButton) mapAddObserver.observe(mapAddButton, { childList: true, subtree: true });

  function graphReady() {
    return /nodes\s*\/\s*[\d,]+\s*edges/i.test(graphStatus.textContent || "");
  }

  function setOsmPreferred() {
    if (graphReady()) return;
    engine.value = "osm";
    shell.dataset.networkEngine = "osm";
    const threshold = D.getElementById("geo4-threshold");
    if (threshold) threshold.value = "30";
    const thresholdOut = D.getElementById("geo4-threshold-out");
    if (thresholdOut) thresholdOut.textContent = "30 min";
    const runs = D.getElementById("geo4-runs");
    if (runs) {
      runs.innerHTML = [5, 10, 15, 25]
        .map(
          (value) =>
            `<option value="${value}" ${value === 10 ? "selected" : ""}>${value} edge-level</option>`,
        )
        .join("");
    }
  }

  const scenarioBlock = engine.closest(".geo4__block");
  const preference = D.createElement("p");
  preference.className = "geo4__osm-preferred";
  preference.innerHTML = `<i></i><span>${copy.osmPreferred}</span>`;
  graphStatus.insertAdjacentElement("afterend", preference);
  const loadButton = D.getElementById("geo4-load-graph");
  const initButton = D.getElementById("geo4-init");
  if (loadButton) loadButton.textContent = copy.reloadGraph;
  if (initButton) initButton.textContent = copy.initialise;

  engine.addEventListener(
    "change",
    (event) => {
      if (engine.value !== "osm" || graphReady()) return;
      event.stopImmediatePropagation();
      setOsmPreferred();
      root.dataset.resultFreshness = "stale";
      const freshness = root.querySelector(".geo4__freshness");
      if (freshness)
        freshness.textContent = zh
          ? "OSM 路网尚未加载 · 运行优化时会自动加载"
          : "OSM graph not loaded · Run optimisation to load it automatically";
    },
    true,
  );

  const runButton = D.getElementById("geo4-run");
  runButton?.addEventListener(
    "click",
    (event) => {
      if (engine.value !== "osm" || graphReady() || loadButton?.disabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      graphStatus.textContent = copy.loadingOsm;
      loadButton?.click();
    },
    true,
  );

  const graphObserver = new globalThis.MutationObserver(() => {
    if (graphReady()) {
      engine.value = "osm";
      shell.dataset.networkEngine = "osm";
      preference.hidden = true;
    } else if (/失败|failed/i.test(graphStatus.textContent || "")) {
      preference.hidden = false;
    }
  });
  graphObserver.observe(graphStatus, { childList: true, characterData: true, subtree: true });

  const responseCache = new Map();
  const originalFetch = globalThis.fetch;
  if (typeof originalFetch === "function" && !originalFetch.__acidchUsabilityCacheWrapped) {
    const wrappedFetch = async (input, init = {}) => {
      const url = typeof input === "string" ? input : input?.url || "";
      const method = String(
        init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET",
      ).toUpperCase();
      const overpass =
        /overpass.*api\/interpreter|api\/interpreter/i.test(url) && method === "POST";
      const osrm = /router\.project-osrm\.org/i.test(url) && method === "GET";
      const key = overpass
        ? `overpass:${String(init?.body || "")}`
        : osrm
          ? `osrm:${url}`
          : null;
      const cached = key ? responseCache.get(key) : null;
      if (cached) {
        return new globalThis.Response(cached.body, {
          status: cached.status,
          headers: cached.headers,
        });
      }
      const response = await originalFetch.call(globalThis, input, init);
      if (key && response.ok && typeof response.clone === "function") {
        try {
          const clone = response.clone();
          const body = await clone.text();
          if (responseCache.size >= 80)
            responseCache.delete(responseCache.keys().next().value);
          responseCache.set(key, {
            body,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          });
        } catch {
          // Cache is opportunistic; the live response remains authoritative.
        }
      }
      return response;
    };
    wrappedFetch.__acidchUsabilityCacheWrapped = true;
    wrappedFetch.__acidchUsabilityCacheOriginal = originalFetch;
    globalThis.fetch = wrappedFetch;
  }

  D.getElementById("geo4-reset")?.addEventListener("click", async () => {
    root.dataset.compactFacilityPreset = "false";
    await wait(220);
    compactFacilityPreset();
    setOsmPreferred();
    setMapAddLabel();
  });

  seedReferenceCoordinates();
  mergeFacilityEditor();
  compactFacilityPreset();
  decoratePolicyRows();
  setMapAddLabel();
  setOsmPreferred();
  if (scenarioBlock) scenarioBlock.dataset.osmFirst = "true";
}

boot();
