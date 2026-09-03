const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const results = root?.querySelector(".geo4__results");
  const status = D?.getElementById("geo4-status");
  if (!root || !results || !status || !root.querySelector(".geo4__fleet-planner")) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.decisionGuidanceV3Ready === "true") return;
  root.dataset.decisionGuidanceV3Ready = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        label: "推荐下一步",
        boundary: "方法边界：这里是道路 TSP + 单车容量拆分与聚合运力检查，不等同于完整 CVRP 或带时间窗车辆调度。",
        run: "当前参数已变更。先点击“运行优化”，再继续路线、Fleet/TSP 或 Monte Carlo。",
        mainReady: "主模型已更新，当前最优路径已自动显示；可直接生成车队路线。",
        fleetReady: "主模型与 Fleet/TSP 均为当前参数。可继续运行 Monte Carlo 检查方案稳健性。",
        allReady: "主模型、Fleet/TSP 与 Monte Carlo 均对应当前参数。可以保存情景或继续做 A/B 对比。",
        fleetCapacity: "车队计划已完成，但运力不足。调整车辆数、单车容量或每车 Trips 后重新生成车队路线。",
        fleetRoad: "当前道路情景无法形成完整车队 tour。优先检查 Closure / Mixed、封路比例和新增道路，然后重新运行优化。",
        fleetService: "道路服务暂时不可用。主模型结果仍保留，可稍后重新生成车队路线。",
        infeasibleFleet: "主模型不可行：当前车队总运力低于总需求。增加车辆、单车容量或 Trips，或取消强制车队约束。",
        infeasiblePolicy: "主模型不可行：必须开启的设施数量超过 Max Open。减少 Must open 或提高 Max Open。",
        infeasibleRedundancy: "主模型不可行：当前可选设施数量不足以满足冗余覆盖要求。降低 Redundancy、恢复被排除设施或提高 Max Open。",
        infeasibleCapacity: "主模型不可行：在当前 Max Open 下，设施总处理能力低于总需求。提高设施容量、降低需求或允许开启更多设施。",
        infeasibleNetwork: "主模型不可行：聚合容量约束未发现直接冲突，重点检查 Coverage Threshold、设施排除策略以及 Mixed / Closure 下的道路可达性。",
      }
    : {
        label: "Recommended next step",
        boundary: "Model boundary: this is road-based TSP sequencing plus vehicle-capacity splitting and aggregate fleet checks, not a full CVRP or time-window vehicle scheduler.",
        run: "Inputs changed. Run the main optimisation before continuing with routes, Fleet/TSP or Monte Carlo.",
        mainReady: "The main model is current and its optimal paths are displayed automatically. Fleet/TSP can run directly from the allocation.",
        fleetReady: "The main model and Fleet/TSP are current. Run Monte Carlo next to test robustness.",
        allReady: "The main model, Fleet/TSP and Monte Carlo all match the current inputs. You can save the scenario or continue with A/B comparison.",
        fleetCapacity: "The fleet plan is current but capacity is insufficient. Adjust vehicle count, vehicle capacity or trips per vehicle, then rebuild Fleet/TSP.",
        fleetRoad: "The active road scenario cannot form a complete fleet tour. Check Closure / Mixed settings, closure share and proposed roads, then rerun the optimisation.",
        fleetService: "The road service is temporarily unavailable. The main-model result is preserved; rebuild Fleet/TSP later.",
        infeasibleFleet: "The main model is infeasible because aggregate fleet capacity is below total demand. Add vehicles, capacity or trips, or disable the enforced fleet constraint.",
        infeasiblePolicy: "The main model is infeasible because Must-open facilities exceed Max Open. Reduce Must open or increase Max Open.",
        infeasibleRedundancy: "The current selectable facilities cannot satisfy the redundancy requirement. Reduce redundancy, restore excluded facilities or increase Max Open.",
        infeasibleCapacity: "Facility throughput under the current Max Open is below total demand. Increase facility capacity, reduce demand or allow more facilities to open.",
        infeasibleNetwork: "No direct aggregate-capacity conflict was found. Check the coverage threshold, facility exclusions and road reachability under Mixed / Closure.",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__next-action{margin:.5rem 0 0;padding:.46rem .5rem;border:1px solid rgba(98,236,255,.18);background:rgba(8,35,46,.5)}
    .geo4__next-action span{display:block;color:#62ecff;font:700 .46rem monospace;letter-spacing:.1em;text-transform:uppercase}
    .geo4__next-action p{margin:.22rem 0 0;color:#9bb7c0;font-size:.54rem;line-height:1.45}
    #geo-v4[data-guidance-tone="warn"] .geo4__next-action{border-color:rgba(255,204,102,.28);background:rgba(73,52,18,.2)}
    #geo-v4[data-guidance-tone="warn"] .geo4__next-action span{color:#ffcc66}
    #geo-v4[data-guidance-tone="bad"] .geo4__next-action{border-color:rgba(255,117,154,.3);background:rgba(74,24,40,.2)}
    #geo-v4[data-guidance-tone="bad"] .geo4__next-action span{color:#ff759a}
    #geo-v4[data-guidance-tone="ok"] .geo4__next-action{border-color:rgba(216,255,107,.24);background:rgba(55,72,24,.16)}
    #geo-v4[data-guidance-tone="ok"] .geo4__next-action span{color:#d8ff6b}
  `;
  D.head.appendChild(style);

  const fleetNote = root.querySelector(".geo4__fleet-note");
  if (fleetNote && !fleetNote.dataset.modelBoundaryReady) {
    fleetNote.dataset.modelBoundaryReady = "true";
    fleetNote.textContent = `${fleetNote.textContent} ${copy.boundary}`;
  }

  const card = D.createElement("div");
  card.className = "geo4__next-action";
  card.innerHTML = `<span>${copy.label}</span><p></p>`;
  const freshness = results.querySelector(".geo4__freshness");
  if (freshness) freshness.insertAdjacentElement("afterend", card);
  else results.querySelector(".geo4__results-head")?.insertAdjacentElement("afterend", card);
  const text = card.querySelector("p");

  const number = (id, fallback = 0) => {
    const value = Number(D.getElementById(id)?.value ?? D.getElementById(id)?.textContent);
    return Number.isFinite(value) ? value : fallback;
  };

  function demandTotal() {
    const multiplier = Math.max(0, number("geo4-demand-multiplier", 1));
    return [...root.querySelectorAll("[data-demand-edit]")].reduce(
      (sum, input) => sum + Math.max(0, Number(input.value) || 0) * multiplier,
      0,
    );
  }

  function infeasibleReason() {
    const statusText = String(status.textContent || "");
    const noSolution = /没有可行方案|No feasible solution/i.test(statusText);
    if (!noSolution) return null;

    const totalDemand = demandTotal();
    const maxOpen = Math.max(0, number("geo4-max-open-out", 0));
    const facilityRows = [...root.querySelectorAll('#geo4-policy-list [data-entity-kind="facility"]')];
    const policies = facilityRows.map((row) => row.querySelector("[data-policy]")?.value || "auto");
    const must = policies.filter((value) => value === "must").length;
    const selectable = policies.filter((value) => value !== "exclude").length;
    const maxSelectable = Math.min(maxOpen, selectable);
    const redundancy = Math.max(1, number("geo4-redundancy", 1));

    if (D.getElementById("geo4-enforce-fleet")?.checked) {
      const aggregateFleet =
        Math.max(0, number("geo4-fleet-out", 0)) *
        Math.max(0, number("geo4-vehicle-capacity", 0)) *
        Math.max(0, number("geo4-trips", 0));
      if (aggregateFleet + 1e-6 < totalDemand) return copy.infeasibleFleet;
    }
    if (must > maxOpen) return copy.infeasiblePolicy;
    if (redundancy > maxSelectable) return copy.infeasibleRedundancy;

    const facilityCapacity = Math.max(0, number("geo4-facility-capacity", 0));
    if (facilityCapacity * maxSelectable + 1e-6 < totalDemand) {
      return copy.infeasibleCapacity;
    }
    return copy.infeasibleNetwork;
  }

  function render() {
    const mainFresh = root.dataset.resultFreshness === "fresh";
    const fleetState = root.dataset.fleetPlanState || "";
    const fleetFresh = root.dataset.fleetFreshness === "fresh";
    const robustFresh = root.dataset.robustFreshness === "fresh";
    const infeasible = infeasibleReason();

    if (infeasible) {
      root.dataset.guidanceTone = "bad";
      text.textContent = infeasible;
      return;
    }
    if (!mainFresh) {
      root.dataset.guidanceTone = "warn";
      text.textContent = copy.run;
      return;
    }
    if (fleetState === "road-infeasible") {
      root.dataset.guidanceTone = "bad";
      text.textContent = copy.fleetRoad;
      return;
    }
    if (fleetState === "capacity-shortfall") {
      root.dataset.guidanceTone = "warn";
      text.textContent = copy.fleetCapacity;
      return;
    }
    if (fleetState === "service-unavailable") {
      root.dataset.guidanceTone = "warn";
      text.textContent = copy.fleetService;
      return;
    }
    if (!fleetFresh) {
      root.dataset.guidanceTone = "ok";
      text.textContent = copy.mainReady;
      return;
    }
    if (!robustFresh) {
      root.dataset.guidanceTone = "ok";
      text.textContent = copy.fleetReady;
      return;
    }
    root.dataset.guidanceTone = "ok";
    text.textContent = copy.allReady;
  }

  const observer = globalThis.MutationObserver
    ? new globalThis.MutationObserver(render)
    : null;
  observer?.observe(root, {
    attributes: true,
    attributeFilter: [
      "data-result-freshness",
      "data-fleet-freshness",
      "data-robust-freshness",
      "data-fleet-plan-state",
      "data-fleet-failure-reason",
    ],
  });
  observer?.observe(status, { childList: true, characterData: true, subtree: true });
  D.getElementById("geo4-policy-list")?.addEventListener("change", render);
  D.getElementById("geo4-enforce-fleet")?.addEventListener("change", render);

  render();
}

boot();
