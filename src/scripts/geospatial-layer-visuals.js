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
        network: ["路网", "道路结构与可达性"],
        flow: ["货物流", "真实最优路径与运输流量"],
        coverage: ["覆盖", "设施服务范围与需求覆盖"],
        utilisation: ["利用率", "设施容量与负载状态"],
        cost: ["成本", "固定成本与运输成本重点"],
        inventory: ["库存", "安全库存与再订货点"],
        risk: ["风险", "不确定性与设施稳定性"],
      }
    : {
        network: ["Network", "Road structure and accessibility"],
        flow: ["Flow", "Optimal routes and transport volume"],
        coverage: ["Coverage", "Facility service reach and demand coverage"],
        utilisation: ["Utilisation", "Facility capacity and load"],
        cost: ["Cost", "Fixed and transport cost emphasis"],
        inventory: ["Inventory", "Safety stock and reorder point"],
        risk: ["Risk", "Uncertainty and facility stability"],
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__layer-chip{position:absolute;z-index:670;left:1rem;bottom:7.1rem;min-width:190px;padding:.48rem .58rem;border:1px solid rgba(98,236,255,.2);background:rgba(4,19,28,.82);backdrop-filter:blur(10px);pointer-events:none}.geo4__layer-chip span{display:block;color:#62ecff;font:700 .5rem monospace;letter-spacing:.12em}.geo4__layer-chip strong{display:block;margin-top:.18rem;color:#e8fbff;font-size:.66rem}.geo4__layer-chip small{display:block;margin-top:.16rem;color:#6f8d99;font-size:.5rem}
    .geo4__layer-tint{position:absolute;inset:0;z-index:508;pointer-events:none;opacity:0;transition:opacity .28s,background .28s}
    .geo4__shell[data-analysis-layer="flow"] .geo4__layer-tint{opacity:.45;background:radial-gradient(circle at 50% 52%,rgba(98,236,255,.035),transparent 52%)}
    .geo4__shell[data-analysis-layer="coverage"] .geo4__layer-tint{opacity:.65;background:radial-gradient(circle at 50% 52%,rgba(216,255,107,.045),transparent 57%)}
    .geo4__shell[data-analysis-layer="utilisation"] .geo4__layer-tint{opacity:.55;background:radial-gradient(circle at 50% 50%,rgba(98,236,255,.025),rgba(255,204,102,.045) 78%,transparent)}
    .geo4__shell[data-analysis-layer="cost"] .geo4__layer-tint{opacity:.62;background:radial-gradient(circle at 50% 50%,transparent 34%,rgba(255,204,102,.08) 100%)}
    .geo4__shell[data-analysis-layer="inventory"] .geo4__layer-tint{opacity:.62;background:linear-gradient(135deg,rgba(98,236,255,.025),transparent 45%,rgba(216,255,107,.04))}
    .geo4__shell[data-analysis-layer="risk"] .geo4__layer-tint{opacity:.7;background:radial-gradient(circle at 50% 50%,transparent 28%,rgba(255,117,154,.09) 100%)}
    .geo4__shell[data-analysis-layer="network"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="coverage"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="utilisation"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="cost"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="inventory"] .geo4__flow-canvas,.geo4__shell[data-analysis-layer="risk"] .geo4__flow-canvas{opacity:.28}
    .geo4__shell[data-analysis-layer="flow"] .geo4__flow-canvas{opacity:1}.geo4__shell[data-analysis-layer="flow"] .geo4__node-canvas{opacity:1}.geo4__shell:not([data-analysis-layer="flow"]) .geo4__node-canvas{opacity:.6}
    .geo4__shell[data-analysis-layer="risk"] .leaflet-overlay-pane svg{filter:saturate(1.15) contrast(1.08)}.geo4__shell[data-analysis-layer="cost"] .leaflet-overlay-pane svg{filter:saturate(.9) sepia(.08)}
    @media(max-width:820px){.geo4__layer-chip{left:.5rem;bottom:10.7rem;min-width:165px}}
  `;
  D.head.appendChild(style);

  const tint = D.createElement("div");
  tint.className = "geo4__layer-tint";
  tint.setAttribute("aria-hidden", "true");
  shell.appendChild(tint);

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
