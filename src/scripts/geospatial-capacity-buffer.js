const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const capacity = D?.getElementById("geo4-facility-capacity");
  if (!root || !capacity) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.capacityBufferReady === "true") return;
  root.dataset.capacityBufferReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        label: "最大设施利用率",
        physical: "物理容量",
        effective: "规划可用容量",
        note: "有效容量 = 物理容量 × 最大利用率；默认保留 15% capacity buffer。",
      }
    : {
        label: "Maximum facility utilisation",
        physical: "Physical capacity",
        effective: "Effective planning capacity",
        note: "Effective capacity = physical capacity × maximum utilisation; the default keeps a 15% capacity buffer.",
      };

  capacity.id = "geo4-facility-capacity-base";
  capacity.dataset.physicalCapacity = "true";
  const effective = D.createElement("input");
  effective.id = "geo4-facility-capacity";
  effective.type = "hidden";
  effective.setAttribute("aria-hidden", "true");
  capacity.insertAdjacentElement("afterend", effective);

  const capacityLabel = capacity.closest("label");
  const control = D.createElement("label");
  control.className = "geo4__range geo4__capacity-buffer";
  control.innerHTML = `<span>${copy.label}</span><output id="geo4-utilisation-buffer-out">85%</output><input id="geo4-utilisation-buffer" type="range" min="50" max="100" step="1" value="85">`;
  capacityLabel?.insertAdjacentElement("afterend", control);
  const preview = D.createElement("div");
  preview.className = "geo4__capacity-preview";
  preview.innerHTML = `<div><span>${copy.physical}</span><b data-physical>—</b></div><div><span>${copy.effective}</span><b data-effective>—</b></div><small>${copy.note}</small>`;
  control.insertAdjacentElement("afterend", preview);

  const style = D.createElement("style");
  style.textContent = `
    .geo4__capacity-buffer input{accent-color:#d8ff6b!important}.geo4__capacity-preview{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;margin:.35rem 0 .55rem}.geo4__capacity-preview>div{padding:.34rem .4rem;border:1px solid rgba(216,255,107,.11);background:rgba(45,61,28,.16)}.geo4__capacity-preview span{display:block;color:#718d95;font-size:.44rem}.geo4__capacity-preview b{display:block;margin-top:.14rem;color:#eaffc6;font:700 .62rem monospace}.geo4__capacity-preview small{grid-column:1/-1;color:#617e87;font-size:.48rem;line-height:1.38}
  `;
  D.head.appendChild(style);

  const slider = control.querySelector("#geo4-utilisation-buffer");
  const output = control.querySelector("#geo4-utilisation-buffer-out");
  const physicalOut = preview.querySelector("[data-physical]");
  const effectiveOut = preview.querySelector("[data-effective]");

  function markPendingResult() {
    root.dataset.resultFreshness = "stale";
    const freshness = root.querySelector(".geo4__freshness");
    if (!freshness) return;
    freshness.textContent = zh
      ? "容量参数已就绪 · 请运行优化"
      : "Capacity parameters ready · Run optimisation";
  }

  function sync({ markStale = true } = {}) {
    const physical = Math.max(0, Number(capacity.value) || 0);
    const utilisation = Math.max(0.5, Math.min(1, Number(slider.value || 85) / 100));
    const planning = physical * utilisation;
    effective.value = String(planning);
    output.textContent = `${(utilisation * 100).toFixed(0)}%`;
    physicalOut.textContent = physical.toLocaleString();
    effectiveOut.textContent = planning.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
    root.dataset.maxFacilityUtilisation = utilisation.toFixed(2);
    effective.dispatchEvent(new globalThis.Event("input", { bubbles: true }));
    if (markStale) markPendingResult();
  }

  function ensureRandomSceneMaxOpen() {
    const count = Number(D.getElementById("geo4-facility-count")?.textContent || 0) +
      Number(D.getElementById("geo4-demand-count")?.textContent || 0);
    const output = D.getElementById("geo4-max-open-out");
    const plus = D.querySelector('[data-step="maxOpen"][data-delta="1"]');
    if (count !== 22 || !output || !plus) return false;
    let current = Number(output.textContent);
    if (!Number.isFinite(current)) return false;
    while (current < 5) {
      plus.click();
      current += 1;
    }
    return current >= 5;
  }

  function scheduleRandomSceneMaxOpen() {
    let attempts = 0;
    const tick = () => {
      if (ensureRandomSceneMaxOpen()) return;
      attempts += 1;
      if (attempts < 60) globalThis.setTimeout(tick, 100);
    };
    tick();
  }

  capacity.addEventListener("input", () => sync());
  slider.addEventListener("input", () => sync());
  D.getElementById("geo4-reset")?.addEventListener("click", () => {
    capacity.value = "6000";
    slider.value = "85";
    sync();
    globalThis.setTimeout(scheduleRandomSceneMaxOpen, 120);
  });
  D.getElementById("geo4-init")?.addEventListener("click", () => {
    globalThis.setTimeout(scheduleRandomSceneMaxOpen, 120);
  });

  // Initialise the effective 5,100-unit planning capacity without triggering
  // an optimisation run. The product is OSM-first, so automatically clicking
  // Run here would start an Overpass request during page boot. External GIS
  // services must remain idle until the user explicitly runs optimisation or
  // loads the graph.
  sync();
  root.dataset.capacityBufferInitialSolve = "deferred";
  scheduleRandomSceneMaxOpen();
}

boot();