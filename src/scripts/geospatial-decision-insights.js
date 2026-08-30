import { getAnalysisWorkerClient } from "../lib/geospatial/analysisWorkerClient.js";
import {
  buildTwoEchelonSankey,
  explainSupplyChainNode,
} from "../lib/geospatial/insightModels.js";
import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";
import { clearMapChannel, drawMapPolyline } from "../lib/geospatial/mapAdapter.js";

const D = globalThis.document;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function boot() {
  const root = D?.getElementById("geo-v4");
  const button = D?.getElementById("geo4-criticality");
  const sankeySection = D?.getElementById("geo4-sankey");
  const drawer = D?.getElementById("geo4-explain-drawer");
  if (!root || !button || !sankeySection || !drawer || !globalThis.L) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.decisionInsightsReady === "true") return;
  root.dataset.decisionInsightsReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        running: "RUNNING · 正在后台评估候选道路…",
        stale: "STALE · 请为当前情景运行道路关键性分析。",
        failed: "DEGRADED · 道路关键性分析失败。",
        ready: "道路关键性分析完成",
        worker: "WORKER",
        fallback: "FALLBACK",
        score: "关键性",
        cost: "成本增量",
        delay: "平均延误",
        unmet: "未满足",
        flow: "受影响流量",
        none: "没有可评估的当前最优路径道路。",
        staleExplain: "当前结果已失效。重新运行优化后再查看节点解释。",
        noAlternative: "没有可行替代仓库",
        fields: {
          demandQuantity: "需求量",
          assignedWarehouse: "分配仓库",
          assignedFactory: "上游工厂",
          distanceKm: "道路距离",
          durationMin: "行程时间",
          generalizedCostNZD: "单位广义运输成本",
          coverageCount: "覆盖次数",
          alternative: "替代仓库",
          disruptionEvent: "当前事件",
          expectedUnmetDemand: "期望未满足需求",
          open: "开启状态",
          physicalCapacity: "物理容量",
          effectiveCapacity: "有效容量",
          assignedDemand: "分配需求",
          utilisation: "利用率",
          factories: "供应工厂",
          customers: "服务客户",
          fleetTrips: "车队趟数",
          averageDeliveryTimeMin: "平均配送时间",
          fixedCostNZD: "固定成本",
          transportContributionNZD: "运输成本贡献",
          selectionProbability: "选择概率",
          disruptionSensitivity: "道路中断敏感度",
          supplyCapacity: "供应容量",
          currentOutflow: "当前出流",
          warehouses: "供应仓库",
          flowContribution: "流量贡献",
        },
      }
    : {
        running: "RUNNING · evaluating candidate roads in the background…",
        stale: "STALE · run road criticality for the current scenario.",
        failed: "DEGRADED · road criticality analysis failed.",
        ready: "Road criticality analysis complete",
        worker: "WORKER",
        fallback: "FALLBACK",
        score: "Criticality",
        cost: "Cost increase",
        delay: "Average delay",
        unmet: "Unmet",
        flow: "Affected flow",
        none: "No current optimal-route roads were available for testing.",
        staleExplain:
          "This result is stale. Rerun optimisation before inspecting a node.",
        noAlternative: "No feasible alternative warehouse",
        fields: {
          demandQuantity: "Demand quantity",
          assignedWarehouse: "Assigned warehouse",
          assignedFactory: "Upstream factory",
          distanceKm: "Road distance",
          durationMin: "Travel time",
          generalizedCostNZD: "Unit generalised transport cost",
          coverageCount: "Coverage count",
          alternative: "Alternative warehouse",
          disruptionEvent: "Current event",
          expectedUnmetDemand: "Expected unmet demand",
          open: "Open status",
          physicalCapacity: "Physical capacity",
          effectiveCapacity: "Effective capacity",
          assignedDemand: "Assigned demand",
          utilisation: "Utilisation",
          factories: "Supplying factories",
          customers: "Customers served",
          fleetTrips: "Fleet trips",
          averageDeliveryTimeMin: "Average delivery time",
          fixedCostNZD: "Fixed cost",
          transportContributionNZD: "Transport contribution",
          selectionProbability: "Selection probability",
          disruptionSensitivity: "Road-disruption sensitivity",
          supplyCapacity: "Supply capacity",
          currentOutflow: "Current outflow",
          warehouses: "Warehouses supplied",
          flowContribution: "Flow contribution",
        },
      };

  const store = getGeospatialStore();
  const worker = getAnalysisWorkerClient();
  const status = D.getElementById("geo4-criticality-status");
  const resultSection = D.getElementById("geo4-criticality-result");
  const resultList = D.getElementById("geo4-criticality-list");
  const sankeyCanvas = D.getElementById("geo4-sankey-canvas");
  const layerSelect = D.getElementById("geo4-layer");
  const drawerBody = D.getElementById("geo4-explain-body");
  const drawerTitle = D.getElementById("geo4-explain-title");
  const closeButton = D.getElementById("geo4-explain-close");
  let lastSelection = null;
  let returnFocus = null;

  const money = (value) =>
    Number.isFinite(value)
      ? `NZ$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : "—";
  const number = (value, digits = 0) =>
    Number.isFinite(value)
      ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
      : "—";

  function renderSankey(snapshot) {
    const model = buildTwoEchelonSankey(snapshot);
    if (!model) {
      sankeySection.hidden = true;
      sankeyCanvas.innerHTML = "";
      return;
    }
    const nodeById = new Map(model.nodes.map((node) => [node.id, node]));
    const links = model.links
      .map((link) => {
        const middle = (link.sourceX + link.targetX) / 2;
        const colour =
          link.stage === "factoryWarehouse" ? "var(--amber)" : "var(--cyan)";
        return `<path d="M ${link.sourceX} ${link.sourceY} C ${middle} ${link.sourceY}, ${middle} ${link.targetY}, ${link.targetX} ${link.targetY}" fill="none" stroke="${colour}" stroke-opacity=".46" stroke-width="${link.thickness}" data-flow="${link.flow}"><title>${escapeHtml(nodeById.get(link.source)?.name)} → ${escapeHtml(nodeById.get(link.target)?.name)} · ${number(link.flow)}</title></path>`;
      })
      .join("");
    const nodes = model.nodes
      .map((node) => {
        const fill =
          node.type === "factory"
            ? "var(--amber)"
            : node.type === "warehouse"
              ? "var(--acid)"
              : "var(--cyan)";
        const anchor = node.type === "demand" ? "end" : "start";
        const textX = node.type === "demand" ? node.x - 5 : node.x + node.width + 5;
        const label = node.name.length > 22 ? `${node.name.slice(0, 21)}…` : node.name;
        return `<g><rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="2" fill="${fill}"><title>${escapeHtml(node.name)} · ${number(node.value)}</title></rect><text x="${textX}" y="${node.y + Math.min(node.height - 2, 10)}" text-anchor="${anchor}">${escapeHtml(label)}</text></g>`;
      })
      .join("");
    sankeyCanvas.innerHTML = `<svg viewBox="0 0 ${model.width} ${model.height}" role="img" aria-label="Factory to Warehouse to Demand Sankey"><g class="links">${links}</g><g class="nodes">${nodes}</g></svg>`;
    sankeySection.hidden = false;
  }

  function criticalityColour(score) {
    if (score >= 0.67) return "#ff759a";
    if (score >= 0.34) return "#ffcc66";
    return "#62ecff";
  }

  function renderCriticality(snapshot) {
    clearMapChannel("criticality");
    const result = snapshot.criticalityResult;
    const current = snapshot.freshness.criticality === "current" && result;
    if (!current) {
      resultSection.hidden = true;
      resultList.innerHTML = "";
      return;
    }
    resultSection.hidden = false;
    resultList.innerHTML = result.edges.length
      ? result.edges
          .slice(0, 12)
          .map(
            (edge, index) =>
              `<div><i style="--criticality:${edge.score};--criticality-colour:${criticalityColour(edge.score)}"></i><span><strong>${index + 1}. ${escapeHtml(edge.roadClass)}</strong>${copy.score} ${number(edge.score * 100, 0)} · ${copy.flow} ${number(edge.affectedFlow)} · ${copy.cost} ${money(edge.deltaGeneralizedCostNZD)} · ${copy.delay} ${number(edge.deltaTravelTimeMin, 1)} min · ${copy.unmet} ${number(edge.unmetDemand)}</span></div>`,
          )
          .join("")
      : `<p>${copy.none}</p>`;
    if (layerSelect.value !== "criticality") return;
    result.edges.forEach((edge) => {
      if (edge.coordinates.length < 2) return;
      drawMapPolyline(
        "criticality",
        edge.coordinates,
        {
          color: criticalityColour(edge.score),
          weight: 2 + edge.score * 6,
          opacity: 0.82,
          className: "geo4__criticality-edge",
        },
        `${copy.score}: ${number(edge.score * 100)} / 100<br>${copy.cost}: ${money(edge.deltaGeneralizedCostNZD)}<br>${copy.delay}: ${number(edge.deltaTravelTimeMin, 1)} min<br>${copy.unmet}: ${number(edge.unmetDemand)}`,
      );
    });
  }

  function formatField(key, value) {
    if (value == null || value === "") return "—";
    if (key === "open") return value ? (zh ? "开启" : "Open") : zh ? "关闭" : "Closed";
    if (
      [
        "utilisation",
        "selectionProbability",
        "disruptionSensitivity",
        "flowContribution",
      ].includes(key)
    ) {
      return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—";
    }
    if (key.endsWith("NZD")) return money(value);
    if (key.endsWith("Km")) return `${number(value, 2)} km`;
    if (key.endsWith("Min")) return `${number(value, 1)} min`;
    if (Array.isArray(value)) return value.length ? value.join(" · ") : "—";
    if (typeof value === "number") return number(value, 1);
    return String(value);
  }

  function renderExplanation(snapshot, selection) {
    const explanation = explainSupplyChainNode(snapshot, selection);
    if (!explanation || explanation.state === "stale") {
      drawerTitle.textContent = copy.staleExplain;
      drawerBody.innerHTML = `<p>${copy.staleExplain}</p>`;
      return;
    }
    drawerTitle.textContent = explanation.title;
    drawerBody.innerHTML = Object.entries(explanation.fields)
      .map(([key, value]) => {
        const label = copy.fields[key] || key;
        if (key === "alternative") {
          const rendered = value
            ? `${escapeHtml(value.name)} · ${number(value.distanceKm, 2)} km · ${number(value.durationMin, 1)} min · ${money(value.generalizedCostNZD)}`
            : copy.noAlternative;
          return `<div><span>${escapeHtml(label)}</span><strong>${rendered}</strong></div>`;
        }
        return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(formatField(key, value))}</strong></div>`;
      })
      .join("");
  }

  function openDrawer(selection) {
    lastSelection = selection;
    returnFocus = D.activeElement;
    renderExplanation(store.getState(), selection);
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    closeButton.focus({ preventScroll: true });
  }

  function closeDrawer() {
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    returnFocus?.focus?.({ preventScroll: true });
  }

  async function runCriticality() {
    const snapshot = store.getState();
    const context = snapshot.networkMatrices.twoEchelonRouteContext;
    if (
      snapshot.freshness.main !== "current" ||
      !snapshot.mainSolution ||
      !snapshot.graph
    ) {
      status.textContent = copy.stale;
      return;
    }
    button.disabled = true;
    status.textContent = copy.running;
    const token = store.begin("criticality");
    try {
      const execution = await worker.run(
        "criticality",
        {
          graph: snapshot.graph,
          entities: snapshot.entities,
          solution: snapshot.mainSolution,
          scenario: context?.scenario || {},
          pricing: {
            costPerKm: snapshot.scenarioInputs.costPerKm || 0,
            costPerMinute: snapshot.scenarioInputs.costPerMinute || 0,
          },
          maxCandidates: 24,
          unmetPenaltyNZD: 1000,
        },
        {
          revisionId: token.scenarioRevision,
          isCurrent: () => store.getState().scenarioRevision === token.scenarioRevision,
        },
      );
      const result = { ...execution.result, execution: execution.execution };
      if (store.commit(token, "criticalityResult", result, "criticality")) {
        status.textContent = `${copy.ready} · ${execution.execution === "worker" ? copy.worker : copy.fallback}`;
        layerSelect.value = "criticality";
        renderCriticality(store.getState());
      }
    } catch (error) {
      if (error?.name !== "StaleWorkerResultError") {
        globalThis.console?.warn("[Road criticality]", error);
        status.textContent = copy.failed;
      }
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", runCriticality);
  layerSelect.addEventListener("change", () => renderCriticality(store.getState()));
  root.addEventListener("geo4:explain", (event) => openDrawer(event.detail));
  closeButton.addEventListener("click", closeDrawer);
  D.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !drawer.hidden) closeDrawer();
  });
  store.subscribe((snapshot) => {
    renderSankey(snapshot);
    renderCriticality(snapshot);
    if (lastSelection && !drawer.hidden) renderExplanation(snapshot, lastSelection);
    if (snapshot.freshness.main !== "current") status.textContent = copy.stale;
  });
  renderSankey(store.getState());
}

boot();
