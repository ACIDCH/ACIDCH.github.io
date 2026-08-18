const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const layer = D?.getElementById("geo4-layer");
  if (!root || !shell || !layer) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.layerVisualReady === "true") return;
  root.dataset.layerVisualReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const labels = zh
    ? {
        network: ["路网", "真实道路层级、连通性与可达性"],
        flow: ["货物流", "真实最优路径、运输方向与流量强度"],
        coverage: ["覆盖", "设施服务范围与需求覆盖状态"],
        utilisation: ["利用率", "设施容量与负载状态"],
        cost: ["成本", "固定成本与运输成本重点"],
        inventory: ["库存", "安全库存、再订货点与节点状态"],
        risk: ["风险", "路网扰动、缺货风险与设施稳定性"],
      }
    : {
        network: ["Network", "Real road hierarchy, connectivity and accessibility"],
        flow: ["Flow", "Optimal routes, transport direction and flow intensity"],
        coverage: ["Coverage", "Facility service reach and demand coverage"],
        utilisation: ["Utilisation", "Facility capacity and load"],
        cost: ["Cost", "Fixed and transport cost emphasis"],
        inventory: ["Inventory", "Safety stock, reorder point and node status"],
        risk: ["Risk", "Road disruption, stockout risk and facility stability"],
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__layer-chip{position:absolute;z-index:670;left:1rem;bottom:7.1rem;min-width:205px;padding:.5rem .62rem;border:1px solid rgba(98,236,255,.24);background:linear-gradient(135deg,rgba(4,19,28,.93),rgba(4,19,28,.76));backdrop-filter:blur(11px);box-shadow:0 12px 36px rgba(0,0,0,.2);pointer-events:none;transition:border-color .25s,box-shadow .25s}.geo4__layer-chip span{display:block;color:#62ecff;font:700 .5rem monospace;letter-spacing:.12em}.geo4__layer-chip strong{display:block;margin-top:.2rem;color:#e8fbff;font-size:.68rem}.geo4__layer-chip small{display:block;margin-top:.17rem;color:#7798a4;font-size:.51rem;line-height:1.4}
    .geo4__layer-tint,.geo4__analysis-grid{position:absolute;inset:0;pointer-events:none;transition:opacity .3s,background .3s}.geo4__layer-tint{z-index:508;opacity:0}.geo4__analysis-grid{z-index:507;opacity:.18;background-image:linear-gradient(rgba(98,236,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(98,236,255,.035) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(circle at 50% 50%,#000 0,transparent 76%)}
    .geo4__shell[data-analysis-layer="network"] .geo4__layer-tint{opacity:.45;background:radial-gradient(circle at 46% 52%,rgba(47,214,190,.055),transparent 55%)}
    .geo4__shell[data-analysis-layer="network"] .geo4__analysis-grid{opacity:.2}
    .geo4__shell[data-analysis-layer="flow"] .geo4__layer-tint{opacity:.58;background:radial-gradient(circle at 48% 52%,rgba(98,236,255,.07),transparent 52%)}
    .geo4__shell[data-analysis-layer="flow"] .geo4__analysis-grid{opacity:.09;background-size:96px 96px}
    .geo4__shell[data-analysis-layer="coverage"] .geo4__layer-tint{opacity:.72;background:repeating-radial-gradient(circle at 48% 52%,rgba(216,255,107,.045) 0 1px,transparent 1px 86px)}
    .geo4__shell[data-analysis-layer="coverage"] .geo4__analysis-grid{opacity:.08}
    .geo4__shell[data-analysis-layer="utilisation"] .geo4__layer-tint{opacity:.68;background:radial-gradient(circle at 48% 50%,rgba(98,236,255,.025),rgba(255,204,102,.075) 78%,transparent)}
    .geo4__shell[data-analysis-layer="cost"] .geo4__layer-tint{opacity:.75;background:radial-gradient(circle at 46% 50%,transparent 30%,rgba(255,204,102,.115) 100%)}
    .geo4__shell[data-analysis-layer="inventory"] .geo4__layer-tint{opacity:.7;background:linear-gradient(135deg,rgba(98,236,255,.045),transparent 43%,rgba(216,255,107,.065))}
    .geo4__shell[data-analysis-layer="inventory"] .geo4__analysis-grid{opacity:.12;background-size:42px 42px}
    .geo4__shell[data-analysis-layer="risk"] .geo4__layer-tint{opacity:.86;background:radial-gradient(circle at 45% 50%,transparent 24%,rgba(255,117,154,.075) 63%,rgba(255,117,154,.17) 100%)}
    .geo4__shell[data-analysis-layer="risk"] .geo4__analysis-grid{opacity:.22;background-image:repeating-linear-gradient(135deg,rgba(255,117,154,.055) 0,rgba(255,117,154,.055) 1px,transparent 1px,transparent 18px);background-size:auto;mask-image:linear-gradient(90deg,transparent 8%,#000 42%,#000 78%,transparent 96%)}
    .geo4__shell[data-analysis-layer="network"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="coverage"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="utilisation"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="cost"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="inventory"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="risk"] .geo4__flow-canvas{opacity:.26}
    .geo4__shell[data-analysis-layer="flow"] .geo4__flow-canvas{opacity:1}.geo4__shell[data-analysis-layer="flow"] .geo4__node-canvas{opacity:1}.geo4__shell:not([data-analysis-layer="flow"]) .geo4__node-canvas{opacity:.62}
    .geo4__shell[data-analysis-layer="risk"] .geo4__layer-chip{border-color:rgba(255,117,154,.42);box-shadow:0 0 34px rgba(255,117,154,.08)}.geo4__shell[data-analysis-layer="risk"] .geo4__layer-chip span{color:#ff759a}
    .geo4__shell[data-analysis-layer="cost"] .geo4__layer-chip{border-color:rgba(255,204,102,.4)}.geo4__shell[data-analysis-layer="cost"] .geo4__layer-chip span{color:#ffcc66}
    .geo4__shell[data-analysis-layer="coverage"] .geo4__layer-chip,.geo4__shell[data-analysis-layer="inventory"] .geo4__layer-chip{border-color:rgba(216,255,107,.34)}.geo4__shell[data-analysis-layer="coverage"] .geo4__layer-chip span,.geo4__shell[data-analysis-layer="inventory"] .geo4__layer-chip span{color:#d8ff6b}
    .geo4__shell[data-analysis-layer="risk"] .leaflet-overlay-pane svg{filter:saturate(1.28) contrast(1.12)}.geo4__shell[data-analysis-layer="cost"] .leaflet-overlay-pane svg{filter:saturate(.95) sepia(.12)}
  `;
  D.head.appendChild(style);

  const tint = D.createElement("div");
  tint.className = "geo4__layer-tint";
  tint.setAttribute("aria-hidden", "true");
  shell.appendChild(tint);

  const grid = D.createElement("div");
  grid.className = "geo4__analysis-grid";
  grid.setAttribute("aria-hidden", "true");
  shell.appendChild(grid);

  const chip = D.createElement("div");
  chip.className = "geo4__layer-chip";
  chip.innerHTML = '<span>ANALYSIS LAYER</span><strong></strong><small></small>';
  shell.appendChild(chip);
  const title = chip.querySelector("strong");
  const detail = chip.querySelector("small");

  const update = () => {
    const value = layer.value || "network";
    const [name, description] = labels[value] || labels.network;
    shell.dataset.analysisLayer = value;
    title.textContent = name;
    detail.textContent = description;
  };
  layer.addEventListener("change", update);
  D.getElementById("geo4-reset")?.addEventListener("click", () => globalThis.setTimeout(update, 0));
  update();
}

boot();
