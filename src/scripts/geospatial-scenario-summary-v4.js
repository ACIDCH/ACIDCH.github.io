import {
  compareScenarioSnapshots,
  networkMetricForEngine,
} from "../lib/geospatial/scenarioComparison.js";

const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const ab = D?.getElementById("geo4-ab");
  const saveA = D?.getElementById("geo4-save-a");
  const saveB = D?.getElementById("geo4-save-b");
  const compareButton = D?.getElementById("geo4-compare");
  const resetButton = D?.getElementById("geo4-reset");
  if (!root || !ab || !saveA || !saveB || !compareButton || !resetButton) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.scenarioSummaryV4Ready === "true") return;
  root.dataset.scenarioSummaryV4Ready = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        saved: "已保存",
        waiting: "尚未保存",
        currentOnly: "仅保存当前参数对应的最新求解结果。",
        compareNeed: "请先分别保存情景 A 与情景 B，再进行比较。",
        decision: "决策解读",
        changed: "发生变化的假设",
        noChanged: "A 与 B 的关键决策参数相同。",
        robust: "稳健性变化（B − A）",
        robustUnavailable:
          "只有 A、B 都保存了当前 Monte Carlo 结果时，才比较稳健性指标。",
        objectiveWarning:
          "A 与 B 使用了不同优化目标；结果可以作为情景对比阅读，但不能把差异全部解释为同一目标下的参数影响。",
        engineWarning:
          "A 与 B 使用不同网络引擎。成本、覆盖率与设施数量仍可比较，但网络 KPI 不直接相减：Fast OD 是 km，OSM 是 min。",
        cost: "情景总成本",
        network: "网络表现",
        coverage: "覆盖率",
        facilities: "开启设施",
        expected: "期望成本",
        p95: "P95 成本",
        failure: "不可行概率",
        stockout: "缺货概率",
        trade: {
          "cost-and-network-improve":
            "情景 B 同时降低了总成本并改善了网络效率；在当前可见成本与网络 KPI 上，B 相比 A 更有利。",
          "cost-network-tradeoff":
            "情景 B 降低了总成本，但网络效率变差。这是典型的成本—服务权衡，应结合配送效率与服务要求决定是否接受。",
          "network-cost-tradeoff":
            "情景 B 改善了网络效率，但需要更高总成本；它相当于用额外成本换取更好的配送表现。",
          "cost-and-network-worse":
            "情景 B 的总成本与网络效率都弱于 A；若没有覆盖、韧性或其他约束上的补偿，A 在当前可见 KPI 上更占优势。",
          "cost-improves": "情景 B 的主要变化是总成本下降，网络 KPI 基本不变。",
          "cost-worsens": "情景 B 的主要变化是总成本上升，网络 KPI 基本不变。",
          "network-improves": "情景 B 的主要变化是网络效率改善，而总成本基本不变。",
          "network-worsens": "情景 B 的主要变化是网络效率变差，而总成本基本不变。",
          similar:
            "A 与 B 在当前核心成本和网络 KPI 上接近，可进一步比较覆盖、库存与 Monte Carlo 稳健性。",
          "network-not-comparable":
            "两个情景的网络 KPI 使用不同物理单位，因此不做数值相减；其余同单位指标仍可用于情景判断。",
        },
      }
    : {
        saved: "Saved",
        waiting: "Not saved",
        currentOnly: "Only the latest solved result for the current inputs is saved.",
        compareNeed: "Save both Scenario A and Scenario B before comparing them.",
        decision: "Decision interpretation",
        changed: "Changed assumptions",
        noChanged: "The key decision inputs are the same in A and B.",
        robust: "Robustness change (B − A)",
        robustUnavailable:
          "Robustness is compared only when both A and B include a current Monte Carlo result.",
        objectiveWarning:
          "A and B use different optimisation objectives. Their outcomes remain valid scenario comparisons, but the difference should not be attributed only to parameter changes under a like-for-like objective.",
        engineWarning:
          "A and B use different network engines. Cost, coverage and facility count remain comparable, but the network KPI is deliberately not subtracted: Fast OD is measured in km and OSM in min.",
        cost: "Scenario total cost",
        network: "Network performance",
        coverage: "Coverage",
        facilities: "Open facilities",
        expected: "Expected cost",
        p95: "P95 cost",
        failure: "Infeasibility rate",
        stockout: "Stockout probability",
        trade: {
          "cost-and-network-improve":
            "Scenario B reduces total cost and improves network efficiency. On the displayed cost and network KPIs, B is stronger than A.",
          "cost-network-tradeoff":
            "Scenario B reduces total cost but worsens network efficiency. This is a cost–service trade-off and should be judged against delivery-performance requirements.",
          "network-cost-tradeoff":
            "Scenario B improves network efficiency at a higher total cost; it is effectively buying better delivery performance with additional spend.",
          "cost-and-network-worse":
            "Scenario B is worse on both total cost and network efficiency. Unless it compensates through coverage, resilience or another constraint, A is stronger on the displayed KPIs.",
          "cost-improves":
            "Scenario B mainly lowers total cost while the network KPI is broadly unchanged.",
          "cost-worsens":
            "Scenario B mainly raises total cost while the network KPI is broadly unchanged.",
          "network-improves":
            "Scenario B mainly improves network efficiency while total cost is broadly unchanged.",
          "network-worsens":
            "Scenario B mainly worsens network efficiency while total cost is broadly unchanged.",
          similar:
            "A and B are close on the core cost and network KPIs. Coverage, inventory and Monte Carlo robustness become the more useful differentiators.",
          "network-not-comparable":
            "The two network KPIs use different physical units, so no numeric network delta is reported; the remaining like-for-like metrics can still support the scenario comparison.",
        },
      };

  const parameterOrder = [
    "objective",
    "engine",
    "roadMode",
    "demandMultiplier",
    "threshold",
    "redundancy",
    "maxOpen",
    "facilityCapacity",
    "fixedCost",
    "enforceFleet",
    "fleet",
    "vehicleCapacity",
    "trips",
    "transportCost",
    "congestion",
    "congestionShare",
    "closure",
    "newRoads",
    "inventoryMean",
    "demandSd",
    "leadTime",
    "leadTimeSd",
    "service",
    "holdingCost",
    "seed",
  ];
  const parameterLabels = zh
    ? {
        objective: "优化目标",
        engine: "网络引擎",
        roadMode: "道路情景",
        demandMultiplier: "需求倍率",
        threshold: "服务阈值",
        redundancy: "最低覆盖次数",
        maxOpen: "最多开启设施",
        facilityCapacity: "单设施容量",
        fixedCost: "单设施固定成本",
        enforceFleet: "车队硬约束",
        fleet: "车辆数",
        vehicleCapacity: "单车容量",
        trips: "每车每日趟数",
        transportCost: "运输成本 / 网络单位",
        congestion: "拥堵强度",
        congestionShare: "拥堵道路占比",
        closure: "封路比例",
        newRoads: "假设新增道路",
        inventoryMean: "日均库存需求",
        demandSd: "需求标准差",
        leadTime: "提前期",
        leadTimeSd: "提前期标准差",
        service: "服务水平",
        holdingCost: "安全库存持有成本",
        seed: "随机种子",
      }
    : {
        objective: "Objective",
        engine: "Network engine",
        roadMode: "Road scenario",
        demandMultiplier: "Demand multiplier",
        threshold: "Service threshold",
        redundancy: "Minimum coverage",
        maxOpen: "Maximum open facilities",
        facilityCapacity: "Facility capacity",
        fixedCost: "Facility fixed cost",
        enforceFleet: "Fleet hard constraint",
        fleet: "Fleet size",
        vehicleCapacity: "Vehicle capacity",
        trips: "Trips per vehicle / day",
        transportCost: "Transport cost / network unit",
        congestion: "Congestion severity",
        congestionShare: "Congested-road share",
        closure: "Closure share",
        newRoads: "Hypothetical new roads",
        inventoryMean: "Mean daily inventory demand",
        demandSd: "Demand SD",
        leadTime: "Lead time",
        leadTimeSd: "Lead-time SD",
        service: "Service level",
        holdingCost: "Safety-stock holding cost",
        seed: "Random seed",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__ab{display:block!important;margin-top:.5rem}.geo4__ab-summary{display:grid;gap:.45rem}.geo4__ab-slots{display:grid;grid-template-columns:1fr 1fr;gap:.4rem}.geo4__ab-slot{padding:.45rem .48rem;border:1px solid rgba(116,190,213,.16);background:rgba(8,31,41,.5);min-width:0}.geo4__ab-slot[data-slot="A"]{border-left:2px solid #62ecff}.geo4__ab-slot[data-slot="B"]{border-left:2px solid #d8ff6b}.geo4__ab-slot-head{display:flex;justify-content:space-between;gap:.4rem;align-items:center}.geo4__ab-slot-head strong{font:700 .61rem monospace;color:#eefcff}.geo4__ab-slot-head span{font-size:.45rem;color:#6f8e98}.geo4__ab-slot small{display:block;margin-top:.25rem;color:#76939d;font-size:.48rem;line-height:1.42}.geo4__ab-slot b{color:#e7f8fb;font-weight:650}.geo4__ab-deltas{display:grid;grid-template-columns:1fr 1fr;gap:.35rem}.geo4__ab-delta{padding:.42rem .45rem;border:1px solid rgba(98,236,255,.12);background:rgba(7,28,38,.48)}.geo4__ab-delta span{display:block;color:#738f99;font-size:.46rem}.geo4__ab-delta strong{display:block;margin-top:.14rem;color:#ecfbfe;font:700 .62rem monospace}.geo4__ab-delta small{display:block;margin-top:.12rem;color:#68858f;font-size:.43rem;line-height:1.35}.geo4__ab-decision{padding:.48rem .52rem;border:1px solid rgba(216,255,107,.18);background:rgba(61,78,27,.13)}.geo4__ab-decision span{display:block;color:#d8ff6b;font:700 .46rem monospace;letter-spacing:.08em;text-transform:uppercase}.geo4__ab-decision p{margin:.22rem 0 0;color:#a4bac2;font-size:.52rem;line-height:1.48}.geo4__ab-warning{margin:0;padding:.42rem .48rem;border:1px solid rgba(255,204,102,.2);background:rgba(80,56,18,.14);color:#d9bd7b;font-size:.49rem;line-height:1.45}.geo4__ab-changes{border-top:1px solid rgba(116,190,213,.12);padding-top:.35rem}.geo4__ab-changes summary{cursor:pointer;color:#84a4ae;font-size:.5rem}.geo4__ab-change-list{display:grid;gap:.22rem;margin-top:.35rem}.geo4__ab-change{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.3rem;align-items:start;color:#6f8d97;font-size:.47rem}.geo4__ab-change strong{color:#c8dce1;font:600 .47rem monospace;text-align:right}.geo4__ab-robust{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;padding-top:.35rem;border-top:1px solid rgba(116,190,213,.12)}.geo4__ab-robust-title{grid-column:1/-1;color:#62ecff;font:700 .45rem monospace;letter-spacing:.08em}.geo4__ab-robust div{font-size:.46rem;color:#6f8d97}.geo4__ab-robust b{display:block;color:#d9edf1;font:700 .53rem monospace;margin-top:.1rem}.geo4__ab-empty{margin:0;color:#6f8d97;font-size:.5rem;line-height:1.45}
  `;
  D.head.appendChild(style);

  const slots = { A: null, B: null };
  const node = (id) => D.getElementById(id);
  const text = (id) => String(node(id)?.textContent || "").trim();
  const inputValue = (id, fallback = "") => node(id)?.value ?? fallback;
  const numberValue = (id, fallback = 0) => {
    const value = Number(inputValue(id, text(id)));
    return Number.isFinite(value) ? value : fallback;
  };
  const parseNumber = (value) => {
    const cleaned = String(value ?? "")
      .replaceAll(",", "")
      .replace(/[^0-9.+-]/g, "");
    if (!/[0-9]/.test(cleaned)) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  function currentParameters() {
    return {
      objective: inputValue("geo4-objective", "minHubs"),
      engine: inputValue("geo4-engine", "od"),
      roadMode: inputValue("geo4-road-mode", "baseline"),
      demandMultiplier: numberValue("geo4-demand-multiplier", 1),
      threshold: numberValue("geo4-threshold", 0),
      redundancy: numberValue("geo4-redundancy", 1),
      maxOpen: parseNumber(text("geo4-max-open-out")) ?? 0,
      facilityCapacity: numberValue("geo4-facility-capacity", 0),
      fixedCost: numberValue("geo4-fixed-cost", 0),
      enforceFleet: Boolean(node("geo4-enforce-fleet")?.checked),
      fleet: parseNumber(text("geo4-fleet-out")) ?? 0,
      vehicleCapacity: numberValue("geo4-vehicle-capacity", 0),
      trips: numberValue("geo4-trips", 0),
      transportCost: numberValue("geo4-transport-cost", 0),
      congestion: numberValue("geo4-congestion", 0),
      congestionShare: numberValue("geo4-congestion-share", 0),
      closure: numberValue("geo4-closure", 0),
      newRoads: parseNumber(text("geo4-new-roads-out")) ?? 0,
      inventoryMean: numberValue("geo4-inv-mean", 0),
      demandSd: numberValue("geo4-inv-sd-base", numberValue("geo4-inv-sd", 0)),
      leadTime: numberValue("geo4-lead-time", 0),
      leadTimeSd: numberValue("geo4-lead-time-sd", 0),
      service: inputValue("geo4-service", "1.645"),
      holdingCost: numberValue("geo4-holding-cost", 0),
      seed: numberValue("geo4-seed", 0),
    };
  }

  function currentMetrics() {
    return {
      hubs: parseNumber(text("geo4-kpi-hubs")),
      coverage: parseNumber(text("geo4-kpi-coverage")),
      networkValue: parseNumber(text("geo4-kpi-network")),
      fleetCapacity: parseNumber(text("geo4-kpi-fleet")),
      safetyStock: parseNumber(text("geo4-kpi-ss")),
      reorderPoint: parseNumber(text("geo4-kpi-rop")),
      transportCost: parseNumber(text("geo4-kpi-transport")),
      totalCost: parseNumber(text("geo4-kpi-cost")),
    };
  }

  function currentRobustness() {
    if (root.dataset.robustFreshness !== "fresh" || node("geo4-robust")?.hidden) return null;
    return {
      runs: parseNumber(text("geo4-mc-runs")),
      expectedCost: parseNumber(text("geo4-mc-expected")),
      p95Cost: parseNumber(text("geo4-mc-p95")),
      failureRate: parseNumber(text("geo4-mc-failure")),
      stockoutProbability: parseNumber(text("geo4-mc-stockout")),
    };
  }

  function captureSnapshot() {
    if (root.dataset.resultFreshness !== "fresh") return null;
    const metrics = currentMetrics();
    if (!Number.isFinite(metrics.totalCost) || !Number.isFinite(metrics.hubs)) return null;
    const params = currentParameters();
    return {
      params,
      metrics,
      robustness: currentRobustness(),
      networkMetric: networkMetricForEngine(params.engine),
      openFacilities: [...D.querySelectorAll("#geo4-open-list strong")]
        .map((element) => String(element.textContent || "").trim())
        .filter(Boolean),
    };
  }

  const cash = (value) =>
    Number.isFinite(value)
      ? `NZ$${Math.round(value).toLocaleString(zh ? "zh-CN" : "en-NZ")}`
      : "—";
  const signedCash = (value) =>
    Number.isFinite(value)
      ? `${value > 0 ? "+" : value < 0 ? "−" : ""}${cash(Math.abs(value))}`
      : "—";
  const signedNumber = (value, digits = 1, suffix = "") =>
    Number.isFinite(value)
      ? `${value > 0 ? "+" : ""}${value.toFixed(digits)}${suffix}`
      : "—";
  const signedInteger = (value) =>
    Number.isFinite(value) ? `${value > 0 ? "+" : ""}${Math.round(value)}` : "—";
  const pctChange = (value) =>
    Number.isFinite(value) ? `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%` : "—";

  const roadLabel = (value) => {
    const labels = zh
      ? {
          baseline: "基线",
          congestion: "交通拥堵",
          closure: "临时封路",
          newroad: "新增道路 / 通行改善",
          mixed: "混合不确定性",
        }
      : {
          baseline: "Baseline",
          congestion: "Traffic congestion",
          closure: "Temporary closure",
          newroad: "New road / access improvement",
          mixed: "Mixed uncertainty",
        };
    return labels[value] || value;
  };
  const objectiveLabel = (value) =>
    value === "minCost"
      ? zh
        ? "最低总成本"
        : "Minimum total cost"
      : zh
        ? "最少设施"
        : "Minimum facilities";
  const engineLabel = (value) =>
    value === "osm"
      ? zh
        ? "OSM 道路网络"
        : "OSM Road Network"
      : zh
        ? "快速 OD 网络"
        : "Fast OD Network";

  function formatParameter(key, value, snapshot) {
    if (value == null) return "—";
    if (key === "objective") return objectiveLabel(value);
    if (key === "engine") return engineLabel(value);
    if (key === "roadMode") return roadLabel(value);
    if (key === "enforceFleet") return value ? (zh ? "启用" : "On") : zh ? "关闭" : "Off";
    if (key === "demandMultiplier") return `${Number(value).toFixed(2)}×`;
    if (["congestion", "congestionShare", "closure"].includes(key))
      return `${Number(value).toFixed(1)}%`;
    if (key === "threshold")
      return `${Number(value).toFixed(1)} ${snapshot?.networkMetric?.unit || ""}`.trim();
    if (key === "redundancy") return `${value}×`;
    if (["leadTime", "leadTimeSd"].includes(key)) return `${Number(value).toFixed(1)} d`;
    if (key === "service") {
      const serviceMap = {
        "1.282": "90%",
        "1.645": "95%",
        "1.960": "97.5%",
        "2.326": "99%",
      };
      return serviceMap[String(value)] || String(value);
    }
    if (key === "fixedCost") return cash(Number(value));
    if (["transportCost", "holdingCost"].includes(key)) return `NZ$${Number(value).toFixed(2)}`;
    return Number.isFinite(Number(value)) ? Number(value).toLocaleString() : String(value);
  }

  function slotCard(slot, snapshot) {
    if (!snapshot) {
      return `<div class="geo4__ab-slot" data-slot="${slot}"><div class="geo4__ab-slot-head"><strong>${slot}</strong><span>${copy.waiting}</span></div><small>${copy.currentOnly}</small></div>`;
    }
    const metric = snapshot.networkMetric;
    const facilities = snapshot.openFacilities.length
      ? snapshot.openFacilities.slice(0, 3).map(escapeHtml).join(" · ") +
        (snapshot.openFacilities.length > 3 ? ` +${snapshot.openFacilities.length - 3}` : "")
      : "—";
    return `<div class="geo4__ab-slot" data-slot="${slot}"><div class="geo4__ab-slot-head"><strong>${slot}</strong><span>${copy.saved}</span></div><small><b>${escapeHtml(engineLabel(snapshot.params.engine))}</b> · ${escapeHtml(roadLabel(snapshot.params.roadMode))} · ${escapeHtml(objectiveLabel(snapshot.params.objective))}<br>${cash(snapshot.metrics.totalCost)} · ${Number.isFinite(snapshot.metrics.networkValue) ? `${snapshot.metrics.networkValue.toFixed(2)} ${metric.unit}` : "—"} · ${Number.isFinite(snapshot.metrics.coverage) ? `${snapshot.metrics.coverage.toFixed(1)}%` : "—"}<br>${escapeHtml(facilities)}</small></div>`;
  }

  function renderSlots(message = "") {
    root.dataset.scenarioComparisonState = "waiting";
    ab.innerHTML = `<div class="geo4__ab-summary"><div class="geo4__ab-slots">${slotCard("A", slots.A)}${slotCard("B", slots.B)}</div>${message ? `<p class="geo4__ab-empty">${escapeHtml(message)}</p>` : ""}</div>`;
  }

  const coverageSentence = (value) => {
    if (!Number.isFinite(value) || Math.abs(value) < 0.05) return "";
    return zh
      ? ` 覆盖率${value > 0 ? "提高" : "下降"}${Math.abs(value).toFixed(1)} 个百分点。`
      : ` Coverage ${value > 0 ? "improves" : "falls"} by ${Math.abs(value).toFixed(1)} percentage points.`;
  };
  const facilitySentence = (value) => {
    if (!Number.isFinite(value) || Math.abs(value) < 0.5) return "";
    return zh
      ? ` 开启设施${value > 0 ? "增加" : "减少"}${Math.abs(Math.round(value))} 个。`
      : ` Open facilities ${value > 0 ? "increase" : "decrease"} by ${Math.abs(Math.round(value))}.`;
  };

  function renderRobustness(result) {
    if (!result.robustnessComparable || !result.robustness) {
      return `<p class="geo4__ab-empty">${copy.robustUnavailable}</p>`;
    }
    const r = result.robustness;
    return `<div class="geo4__ab-robust"><span class="geo4__ab-robust-title">${copy.robust}</span><div>${copy.expected}<b>${signedCash(r.expectedCost)}</b></div><div>${copy.p95}<b>${signedCash(r.p95Cost)}</b></div><div>${copy.failure}<b>${signedNumber(r.failureRate, 1, " pp")}</b></div><div>${copy.stockout}<b>${signedNumber(r.stockoutProbability, 1, " pp")}</b></div></div>`;
  }

  function renderChanged(result) {
    if (!result.changedParameters.length) {
      return `<details class="geo4__ab-changes"><summary>${copy.changed} · 0</summary><p class="geo4__ab-empty">${copy.noChanged}</p></details>`;
    }
    const rows = result.changedParameters
      .map(({ key, a, b }) => {
        const aText = formatParameter(key, a, slots.A);
        const bText = formatParameter(key, b, slots.B);
        return `<div class="geo4__ab-change"><span>${escapeHtml(parameterLabels[key] || key)}</span><strong>${escapeHtml(aText)} → ${escapeHtml(bText)}</strong></div>`;
      })
      .join("");
    return `<details class="geo4__ab-changes"><summary>${copy.changed} · ${result.changedParameters.length}</summary><div class="geo4__ab-change-list">${rows}</div></details>`;
  }

  function compare() {
    if (!slots.A || !slots.B) {
      renderSlots(copy.compareNeed);
      return;
    }
    const result = compareScenarioSnapshots(slots.A, slots.B, { parameterOrder });
    if (!result) {
      renderSlots(copy.compareNeed);
      return;
    }
    root.dataset.scenarioComparisonState = result.networkComparable
      ? "comparable"
      : "cross-engine";

    const networkValue = result.networkComparable
      ? signedNumber(result.deltas.network, 2, ` ${result.networkMetric.unit}`)
      : `${result.networkMetricA.unit} ↔ ${result.networkMetricB.unit}`;
    const networkDetail = result.networkComparable
      ? pctChange(result.deltas.networkPct)
      : copy.engineWarning;
    const warnings = [
      !result.objectiveComparable ? copy.objectiveWarning : "",
      !result.networkComparable ? copy.engineWarning : "",
    ]
      .filter(Boolean)
      .map((message) => `<p class="geo4__ab-warning">${escapeHtml(message)}</p>`)
      .join("");
    const interpretation = `${copy.trade[result.tradeoff] || copy.trade.similar}${coverageSentence(result.deltas.coverage)}${facilitySentence(result.deltas.facilities)}`;

    ab.innerHTML = `<div class="geo4__ab-summary"><div class="geo4__ab-slots">${slotCard("A", slots.A)}${slotCard("B", slots.B)}</div><div class="geo4__ab-deltas"><div class="geo4__ab-delta"><span>${copy.cost}</span><strong>${signedCash(result.deltas.totalCost)}</strong><small>${pctChange(result.deltas.totalCostPct)}</small></div><div class="geo4__ab-delta"><span>${copy.network}</span><strong>${escapeHtml(networkValue)}</strong><small>${escapeHtml(networkDetail)}</small></div><div class="geo4__ab-delta"><span>${copy.coverage}</span><strong>${signedNumber(result.deltas.coverage, 1, " pp")}</strong><small>B − A</small></div><div class="geo4__ab-delta"><span>${copy.facilities}</span><strong>${signedInteger(result.deltas.facilities)}</strong><small>B − A</small></div></div>${warnings}<div class="geo4__ab-decision"><span>${copy.decision}</span><p>${escapeHtml(interpretation)}</p></div>${renderRobustness(result)}${renderChanged(result)}</div>`;
  }

  function save(slot) {
    const snapshot = captureSnapshot();
    if (!snapshot) return;
    slots[slot] = snapshot;
    root.dataset[`scenario${slot}State`] = "saved";
    renderSlots();
  }

  saveA.addEventListener("click", () => globalThis.setTimeout(() => save("A"), 0));
  saveB.addEventListener("click", () => globalThis.setTimeout(() => save("B"), 0));
  compareButton.addEventListener("click", () => globalThis.setTimeout(compare, 0));
  resetButton.addEventListener("click", () => {
    slots.A = null;
    slots.B = null;
    delete root.dataset.scenarioAState;
    delete root.dataset.scenarioBState;
    globalThis.setTimeout(() => renderSlots(), 0);
  });

  renderSlots();
}

boot();
