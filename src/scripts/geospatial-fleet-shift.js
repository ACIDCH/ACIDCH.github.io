const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const planner = root?.querySelector(".geo4__fleet-planner");
  const fleetOut = D?.getElementById("geo4-fleet-out");
  if (!root || !planner || !fleetOut) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.fleetShiftReady === "true") return;
  root.dataset.fleetShiftReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? { label: "每车最大班次（小时）", capacity: "总班次小时容量", pass: "时间容量可行", fail: "时间容量不足", note: "总路线小时与 Fleet × Shift Hours 的聚合检查；不宣称为逐车时间窗排班。" }
    : { label: "Max shift hours / vehicle", capacity: "Aggregate shift-hour capacity", pass: "Shift-hour capacity feasible", fail: "Shift-hour capacity shortfall", note: "Aggregate route-hour check against Fleet × Shift Hours; not a per-vehicle time-window scheduling claim." };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__fleet-shift{display:grid;grid-template-columns:minmax(0,1fr) 96px;gap:.42rem;align-items:center;margin-top:.48rem;padding:.4rem .45rem;border:1px solid rgba(255,204,102,.12);background:rgba(53,42,18,.12)}.geo4__fleet-shift label{color:#78939c;font-size:.52rem}.geo4__fleet-shift input{width:100%;box-sizing:border-box;border:1px solid rgba(255,204,102,.2);background:#0b202c;color:#eefcff;padding:.34rem .38rem}.geo4__fleet-shift-result{grid-column:1/-1;display:flex;justify-content:space-between;gap:.5rem;color:#718c95;font-size:.49rem}.geo4__fleet-shift-result b{font-family:monospace;color:#e7f8fb}.geo4__fleet-shift-state{grid-column:1/-1;color:#718c95;font-size:.49rem;line-height:1.4}.geo4__fleet-shift-state.ok{color:#d8ff6b}.geo4__fleet-shift-state.bad{color:#ff759a}.geo4__fleet-shift-note{grid-column:1/-1;color:#627e88;font-size:.46rem;line-height:1.35}
  `;
  D.head.appendChild(style);

  const block = D.createElement("div");
  block.className = "geo4__fleet-shift";
  block.innerHTML = `<label for="geo4-shift-hours">${copy.label}</label><input id="geo4-shift-hours" type="number" min="1" max="24" step="0.5" value="8"><div class="geo4__fleet-shift-result"><span>${copy.capacity}</span><b data-shift-capacity>—</b></div><div class="geo4__fleet-shift-state">—</div><div class="geo4__fleet-shift-note">${copy.note}</div>`;
  planner.querySelector(".geo4__fleet-note")?.insertAdjacentElement("afterend", block);

  const input = block.querySelector("#geo4-shift-hours");
  const capacityOut = block.querySelector("[data-shift-capacity]");
  const stateOut = block.querySelector(".geo4__fleet-shift-state");
  const plannedTime = planner.querySelector("[data-fleet-time]");

  function refresh() {
    const fleet = Math.max(0, Number(fleetOut.textContent || 0));
    const hoursPerVehicle = Math.max(0, Number(input.value || 0));
    const capacity = fleet * hoursPerVehicle;
    const planned = Number(String(plannedTime?.textContent || "").match(/[\d.]+/)?.[0]);
    capacityOut.textContent = `${capacity.toFixed(1)} h`;
    if (!Number.isFinite(planned)) {
      stateOut.textContent = "—";
      stateOut.className = "geo4__fleet-shift-state";
      return;
    }
    const feasible = planned <= capacity + 1e-9;
    stateOut.textContent = `${feasible ? copy.pass : copy.fail} · ${planned.toFixed(1)} / ${capacity.toFixed(1)} h`;
    stateOut.className = `geo4__fleet-shift-state ${feasible ? "ok" : "bad"}`;
    root.dataset.fleetShiftFeasible = feasible ? "true" : "false";
  }

  input.addEventListener("input", refresh);
  D.querySelectorAll('[data-step="fleet"]').forEach((button) => button.addEventListener("click", () => globalThis.setTimeout(refresh, 0)));
  const observer = plannedTime && globalThis.MutationObserver ? new globalThis.MutationObserver(refresh) : null;
  observer?.observe(plannedTime, { childList: true, characterData: true, subtree: true });
  D.getElementById("geo4-reset")?.addEventListener("click", () => { input.value = "8"; globalThis.setTimeout(refresh, 0); });
  refresh();
}

boot();