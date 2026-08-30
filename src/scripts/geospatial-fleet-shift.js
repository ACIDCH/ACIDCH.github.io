import { getGeospatialStore } from "../lib/geospatial/geospatialStore.js";

const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const planner = root?.querySelector(".geo4__fleet-planner");
  if (!root || !planner) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.fleetShiftReady === "true") return;
  root.dataset.fleetShiftReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        label: "每车最大班次（小时）",
        capacity: "实际车辆排班",
        pass: "逐车班次与趟数约束可行",
        fail: "至少一趟无法分配到合规车辆",
        stale: "班次值已改变；重新生成车队路线后生效。",
        note: "检查每辆车的累计路线时长与趟数，不使用总小时数代替逐车排班。",
      }
    : {
        label: "Max shift hours / vehicle",
        capacity: "Actual vehicle schedule",
        pass: "Per-vehicle shift and trip limits feasible",
        fail: "At least one trip has no compliant vehicle assignment",
        stale: "Shift value changed; rebuild fleet routes to apply it.",
        note: "Checks each vehicle's accumulated route time and trip count; aggregate fleet-hours are not used as a scheduling proxy.",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__fleet-shift{display:grid;grid-template-columns:minmax(0,1fr) 96px;gap:.42rem;align-items:center;margin-top:.48rem;padding:.4rem .45rem;border:1px solid rgba(255,204,102,.12);background:rgba(53,42,18,.12)}.geo4__fleet-shift label{color:#78939c;font-size:.52rem}.geo4__fleet-shift input{width:100%;box-sizing:border-box;border:1px solid rgba(255,204,102,.2);background:#0b202c;color:#eefcff;padding:.34rem .38rem}.geo4__fleet-shift-result{grid-column:1/-1;display:flex;justify-content:space-between;gap:.5rem;color:#718c95;font-size:.49rem}.geo4__fleet-shift-result b{font-family:monospace;color:#e7f8fb}.geo4__fleet-shift-state{grid-column:1/-1;color:#718c95;font-size:.49rem;line-height:1.4}.geo4__fleet-shift-state.ok{color:#d8ff6b}.geo4__fleet-shift-state.bad{color:#ff759a}.geo4__fleet-shift-note{grid-column:1/-1;color:#627e88;font-size:.46rem;line-height:1.35}
  `;
  D.head.appendChild(style);

  const block = D.createElement("div");
  block.className = "geo4__fleet-shift";
  block.innerHTML = `<label for="geo4-shift-hours">${copy.label}</label><input id="geo4-shift-hours" type="number" min="1" max="24" step="0.5" value="8"><div class="geo4__fleet-shift-result"><span>${copy.capacity}</span><b data-shift-capacity>—</b></div><div class="geo4__fleet-shift-state">—</div><div class="geo4__fleet-shift-note">${copy.note}</div>`;
  planner.querySelector(".geo4__fleet-note")?.insertAdjacentElement("afterend", block);

  const store = getGeospatialStore();
  const input = block.querySelector("#geo4-shift-hours");
  const capacityOut = block.querySelector("[data-shift-capacity]");
  const stateOut = block.querySelector(".geo4__fleet-shift-state");

  function refresh(state = store.getState()) {
    const fleetSolution = state.fleetSolution;
    const schedule = fleetSolution?.schedule;
    if (state.freshness.fleet !== "current" || !schedule) {
      capacityOut.textContent = "—";
      stateOut.textContent = "—";
      stateOut.className = "geo4__fleet-shift-state";
      return;
    }
    const requestedShiftMinutes = Math.max(0, Number(input.value || 0)) * 60;
    if (Math.abs(requestedShiftMinutes - schedule.shiftMinutes) > 1e-6) {
      capacityOut.textContent = `${schedule.vehicles.length} ${zh ? "辆" : "vehicles"}`;
      stateOut.textContent = copy.stale;
      stateOut.className = "geo4__fleet-shift-state bad";
      return;
    }
    const withinLimits = schedule.vehicles.every(
      (vehicle) =>
        vehicle.durationMin <= schedule.shiftMinutes + 1e-9 &&
        vehicle.trips.length <= schedule.tripsPerVehicle,
    );
    const feasible = fleetSolution.feasible && schedule.feasible && withinLimits;
    const used = schedule.vehicles.filter((vehicle) => vehicle.trips.length).length;
    capacityOut.textContent = `${used} / ${schedule.vehicles.length} ${zh ? "辆" : "vehicles"}`;
    stateOut.textContent = `${feasible ? copy.pass : copy.fail} · ${schedule.unassigned.length} ${zh ? "趟未分配" : "unassigned"}`;
    stateOut.className = `geo4__fleet-shift-state ${feasible ? "ok" : "bad"}`;
    root.dataset.fleetShiftFeasible = feasible ? "true" : "false";
  }

  input.addEventListener("input", () => refresh());
  D.getElementById("geo4-reset")?.addEventListener("click", () => {
    input.value = "8";
    globalThis.setTimeout(() => refresh(), 0);
  });
  store.subscribe(refresh);
  refresh();
}

boot();
