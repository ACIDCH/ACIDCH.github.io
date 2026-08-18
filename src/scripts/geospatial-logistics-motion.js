const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const mapBox = D?.getElementById("geo4-map");
  if (!root || !shell || !mapBox) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.logisticsMotionReady === "true") return;
  root.dataset.logisticsMotionReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? { title: "物流图层", fleet: "车队 Tour", fw: "工厂→仓库", wd: "仓库→需求", active: "活动路线" }
    : { title: "Logistics Layers", fleet: "Fleet tour", fw: "Factory→Warehouse", wd: "Warehouse→Demand", active: "Active routes" };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__fleet-route{stroke-dasharray:10 7!important;animation:geo-logistics-fleet 1.35s linear infinite;stroke-linecap:round}.geo4__transshipment-route{stroke-linecap:round;animation:geo-logistics-stage 1.65s linear infinite}.geo4__transshipment-route.stage-fw{stroke-dasharray:13 7!important}.geo4__transshipment-route.stage-wd{stroke-dasharray:7 5!important;animation-duration:1.15s}
    @keyframes geo-logistics-fleet{to{stroke-dashoffset:-34}}@keyframes geo-logistics-stage{to{stroke-dashoffset:-40}}
    .geo4__logistics-state{position:absolute;z-index:666;left:1rem;bottom:4.15rem;display:flex;align-items:center;gap:.48rem;padding:.36rem .5rem;border:1px solid rgba(116,190,213,.2);background:rgba(4,18,27,.88);backdrop-filter:blur(10px);pointer-events:none;opacity:.52;transition:opacity .2s,border-color .2s}.geo4__logistics-state.is-active{opacity:1;border-color:rgba(255,204,102,.3)}.geo4__logistics-state>span{color:#7896a1;font:700 .48rem monospace;letter-spacing:.08em}.geo4__logistics-state>strong{color:#e8fbff;font:700 .56rem monospace}.geo4__logistics-dots{display:flex;gap:.23rem}.geo4__logistics-dots i{display:block;width:5px;height:5px;border-radius:50%;opacity:.25}.geo4__logistics-dots i:nth-child(1){background:#ffcc66}.geo4__logistics-dots i:nth-child(2){background:#ffb85c}.geo4__logistics-dots i:nth-child(3){background:#62ecff}.geo4__logistics-state.is-active .geo4__logistics-dots i{opacity:1;box-shadow:0 0 8px currentColor}
    .geo4__legend .fleet-tour{background:#ffcc66}.geo4__legend .factory-warehouse{height:2px;background:#ffb85c}.geo4__legend .warehouse-demand{height:2px;background:#62ecff}
    @media(prefers-reduced-motion:reduce){.geo4__fleet-route,.geo4__transshipment-route{animation:none!important}}
  `;
  D.head.appendChild(style);

  const badge = D.createElement("div");
  badge.className = "geo4__logistics-state";
  badge.innerHTML = `<div class="geo4__logistics-dots"><i></i><i></i><i></i></div><span>${copy.title}</span><strong>0 ${copy.active}</strong>`;
  shell.appendChild(badge);
  const total = badge.querySelector("strong");

  const legend = shell.querySelector(".geo4__legend");
  if (legend && !legend.querySelector("[data-logistics-legend]")) {
    for (const [className, label] of [["fleet-tour", copy.fleet], ["factory-warehouse", copy.fw], ["warehouse-demand", copy.wd]]) {
      const item = D.createElement("span");
      item.dataset.logisticsLegend = className;
      item.innerHTML = `<i class="${className}"></i> ${label}`;
      legend.appendChild(item);
    }
  }

  const refresh = () => {
    const fleet = mapBox.querySelectorAll(".geo4__fleet-route").length;
    const fw = mapBox.querySelectorAll(".geo4__transshipment-route.stage-fw").length;
    const wd = mapBox.querySelectorAll(".geo4__transshipment-route.stage-wd").length;
    const count = fleet + fw + wd;
    total.textContent = `${count} ${copy.active}`;
    badge.classList.toggle("is-active", count > 0);
    badge.title = `${copy.fleet}: ${fleet} · ${copy.fw}: ${fw} · ${copy.wd}: ${wd}`;
  };

  const observer = globalThis.MutationObserver
    ? new globalThis.MutationObserver(() => globalThis.setTimeout(refresh, 0))
    : null;
  observer?.observe(mapBox, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  refresh();
}

boot();
