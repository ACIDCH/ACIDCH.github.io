import { nearestGraphNode } from "../lib/geospatial/decisionEngine.js";
import { reconstructGraphPath } from "../lib/geospatial/pathTools.js";
import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";
import { getGisServices } from "../lib/geospatial/gisServices.js";
import { clearMapChannel, drawMapPolyline } from "../lib/geospatial/mapAdapter.js";

const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const editorBlock = D?.getElementById("geo4-custom-list")?.closest(".geo4__block");
  if (!root || !editorBlock || !globalThis.L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.transshipmentReady === "true") return;
  root.dataset.transshipmentReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        title: "统一两级流",
        run: "检查统一两级流",
        note: "直接读取主模型的结构化两级流；不会从地图标签、颜色或 DOM 文本反推业务数据。",
        need: "请先运行统一两级主模型。",
        ready: "两级流守恒检查通过",
        invalid: "两级流不完整或不守恒。",
        factories: "工厂",
        warehouses: "开启仓库",
        flow: "完成流量",
        cost: "两级运输成本",
        upstream: "上游",
        downstream: "下游",
      }
    : {
        title: "Integrated two-echelon flow",
        run: "Inspect integrated flow",
        note: "Reads the main model's structured two-echelon flow directly; business data is never inferred from map labels, colours or DOM copy.",
        need: "Run the integrated two-echelon main model first.",
        ready: "Two-echelon flow conservation passed",
        invalid: "Two-echelon flow is incomplete or unbalanced.",
        factories: "Factories",
        warehouses: "Open warehouses",
        flow: "Flow served",
        cost: "Two-echelon transport",
        upstream: "Upstream",
        downstream: "Downstream",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__transshipment{margin-top:.75rem;padding-top:.68rem;border-top:1px solid rgba(98,236,255,.16)}.geo4__trans-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem}.geo4__trans-head span{color:#62ecff;font:700 .5rem monospace;letter-spacing:.1em}.geo4__trans-head strong{font-size:.65rem}.geo4__trans-run{width:100%;margin-top:.45rem;border-color:rgba(98,236,255,.3)!important;color:#bdefff!important;white-space:nowrap}.geo4__trans-note{margin:.4rem 0;color:#698892;font-size:.52rem;line-height:1.42}.geo4__trans-kpis{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin-top:.45rem}.geo4__trans-kpis div{padding:.34rem .38rem;border:1px solid rgba(98,236,255,.11);background:rgba(8,35,46,.42)}.geo4__trans-kpis span{display:block;color:#718e98;font-size:.44rem}.geo4__trans-kpis b{display:block;margin-top:.13rem;color:#e9fbfe;font:700 .62rem monospace}.geo4__trans-status{margin:.4rem 0 0;color:#718e98;font-size:.53rem;line-height:1.4}.geo4__trans-status.ok{color:#d8ff6b}.geo4__trans-status.bad{color:#ff759a}.geo4__trans-flow-list{display:grid;gap:.25rem;margin-top:.4rem}.geo4__trans-flow-list div{display:grid;grid-template-columns:minmax(0,1fr) 42px auto;gap:.3rem;align-items:center;color:#78959f;font-size:.48rem}.geo4__trans-flow-list i{height:2px;background:#62ecff}.geo4__trans-flow-list .upstream i{background:#ffcc66}.geo4__transshipment-route.stage-fw{filter:drop-shadow(0 0 5px rgba(255,204,102,.4))}.geo4__transshipment-route.stage-wd{filter:drop-shadow(0 0 5px rgba(98,236,255,.35))}
  `;
  D.head.appendChild(style);
  const panel = D.createElement("section");
  panel.className = "geo4__transshipment";
  panel.innerHTML = `<div class="geo4__trans-head"><span>TRANSSHIPMENT / EXACT</span><strong>${copy.title}</strong></div><button type="button" class="geo4__trans-run">${copy.run}</button><p class="geo4__trans-note">${copy.note}</p><div class="geo4__trans-kpis"><div><span>${copy.factories}</span><b data-trans-f>—</b></div><div><span>${copy.warehouses}</span><b data-trans-w>—</b></div><div><span>${copy.flow}</span><b data-trans-flow>—</b></div><div><span>${copy.cost}</span><b data-trans-cost>—</b></div></div><p class="geo4__trans-status">—</p><div class="geo4__trans-flow-list"></div>`;
  editorBlock.appendChild(panel);

  const store = getGeospatialStore();
  const services = getGisServices();
  const state = { routeCache: new Map() };
  const button = panel.querySelector(".geo4__trans-run");
  const status = panel.querySelector(".geo4__trans-status");
  const list = panel.querySelector(".geo4__trans-flow-list");
  const outputs = {
    factories: panel.querySelector("[data-trans-f]"),
    warehouses: panel.querySelector("[data-trans-w]"),
    flow: panel.querySelector("[data-trans-flow]"),
    cost: panel.querySelector("[data-trans-cost]"),
  };

  async function routeCoordinates(from, to, context) {
    const pointKey = (point) =>
      Array.isArray(point)
        ? point.join(",")
        : `${Number(point?.lat).toFixed(6)},${Number(point?.lon).toFixed(6)}`;
    const cacheKey = `${pointKey(from)}|${pointKey(to)}|${context?.scenario?.mode || "baseline"}`;
    if (state.routeCache.has(cacheKey)) return state.routeCache.get(cacheKey);
    let coordinates;
    if (context?.graph && context?.scenario) {
      const source = nearestGraphNode(context.graph, from);
      const target = nearestGraphNode(context.graph, to);
      const path =
        source.nodeId && target.nodeId
          ? reconstructGraphPath(
              context.graph,
              source.nodeId,
              target.nodeId,
              context.scenario,
              "time",
            )
          : null;
      coordinates = path?.coordinates || [];
    } else {
      coordinates = (await services.osrmRoute([from, to])).coordinates;
    }
    state.routeCache.set(cacheKey, coordinates);
    return coordinates;
  }

  async function drawFlow(from, to, flow, context, stage) {
    const coordinates = await routeCoordinates(from.point, to.point, context);
    if (coordinates.length < 2) return false;
    drawMapPolyline(
      "transshipment",
      coordinates,
      {
        color: stage === "fw" ? "#ffcc66" : "#62ecff",
        weight: 1.5 + Math.min(4, Math.sqrt(flow) / 18),
        opacity: 0.76,
        className: `geo4__transshipment-route stage-${stage}`,
      },
      `${from.name} → ${to.name}<br>${flow.toFixed(0)} · ${stage === "fw" ? "Factory → Warehouse" : "Warehouse → Demand"}`,
    );
    return true;
  }

  async function inspect() {
    clearMapChannel("transshipment");
    state.routeCache.clear();
    const snapshot = store.getState();
    const solution = snapshot.mainSolution;
    if (snapshot.freshness.main !== "current" || solution?.model !== "two-echelon") {
      status.textContent = copy.need;
      status.className = "geo4__trans-status bad";
      return;
    }
    button.disabled = true;
    const token = store.begin("transshipment");
    try {
      const facilities = snapshot.entities.facilities;
      const demands = snapshot.entities.demands;
      const factories = facilities.filter((item) => item.role === "factory");
      const context = snapshot.networkMatrices.twoEchelonRouteContext;
      const inflow = new Map();
      const outflow = new Map();
      for (const flow of solution.factoryAssignments) {
        inflow.set(flow.warehouse, (inflow.get(flow.warehouse) || 0) + flow.flow);
      }
      for (const flow of solution.assignments) {
        outflow.set(flow.hub, (outflow.get(flow.hub) || 0) + flow.flow);
      }
      const balanced = solution.selected.every(
        (warehouse) =>
          Math.abs((inflow.get(warehouse) || 0) - (outflow.get(warehouse) || 0)) < 1e-6,
      );
      const maximumFlow = Math.max(
        1,
        ...solution.factoryAssignments.map((flow) => flow.flow),
        ...solution.assignments.map((flow) => flow.flow),
      );
      list.innerHTML = [
        ...solution.factoryAssignments.map((flow) => ({
          className: "upstream",
          label: `${copy.upstream} · ${facilities[flow.factory].name} → ${facilities[flow.warehouse].name}`,
          flow: flow.flow,
        })),
        ...solution.assignments.slice(0, 12).map((flow) => ({
          className: "downstream",
          label: `${copy.downstream} · ${facilities[flow.hub].name} → ${demands[flow.demand].name}`,
          flow: flow.flow,
        })),
      ]
        .map(
          (item) =>
            `<div class="${item.className}"><span>${item.label}</span><i style="width:${Math.max(4, (item.flow / maximumFlow) * 100)}%"></i><b>${item.flow.toFixed(0)}</b></div>`,
        )
        .join("");
      for (const flow of solution.factoryAssignments) {
        await drawFlow(
          facilities[flow.factory],
          facilities[flow.warehouse],
          flow.flow,
          context,
          "fw",
        );
      }
      for (const flow of solution.assignments) {
        await drawFlow(
          facilities[flow.hub],
          demands[flow.demand],
          flow.flow,
          context,
          "wd",
        );
      }
      outputs.factories.textContent = String(factories.length);
      outputs.warehouses.textContent = String(solution.selected.length);
      outputs.flow.textContent = `${solution.allocatedDemand.toFixed(0)} / ${solution.totalDemand.toFixed(0)}`;
      outputs.cost.textContent = `NZ$${solution.transportCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      status.textContent = balanced ? copy.ready : copy.invalid;
      status.className = `geo4__trans-status ${balanced ? "ok" : "bad"}`;
      store.commit(
        token,
        "transshipmentSolution",
        { balanced, source: "mainSolution", solutionRevision: token.scenarioRevision },
        "transshipment",
      );
    } catch (error) {
      globalThis.console?.warn("[Transshipment inspection]", error);
      status.textContent = copy.invalid;
      status.className = "geo4__trans-status bad";
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", inspect);
  store.subscribe((state) => {
    if (state.freshness.main !== "current") {
      clearMapChannel("transshipment");
      Object.values(outputs).forEach((output) => (output.textContent = "—"));
      list.innerHTML = "";
      status.textContent = copy.need;
      status.className = "geo4__trans-status bad";
    }
  });
}

boot();
