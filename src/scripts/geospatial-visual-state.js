const D = globalThis.document;

function bootScenarioVisualState() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const mode = D?.getElementById("geo4-road-mode");
  const congestion = D?.getElementById("geo4-congestion");
  const closure = D?.getElementById("geo4-closure");
  const newRoads = D?.getElementById("geo4-new-roads-out");
  if (!root || !shell || !mode || !congestion || !closure || !newRoads) {
    globalThis.setTimeout(bootScenarioVisualState, 100);
    return;
  }
  if (root.dataset.visualStateReady === "true") return;
  root.dataset.visualStateReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const labels = zh
    ? {
        baseline: "基线路网",
        congestion: "拥堵冲击",
        closure: "临时封路",
        newroad: "通行改善",
        mixed: "混合路网事件",
        stable: "稳定",
        moderate: "中等",
        severe: "高强度",
        active: "情景已激活",
      }
    : {
        baseline: "Baseline network",
        congestion: "Congestion shock",
        closure: "Temporary closure",
        newroad: "Access improvement",
        mixed: "Mixed network event",
        stable: "Stable",
        moderate: "Moderate",
        severe: "High intensity",
        active: "Scenario active",
      };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__scenario-ribbon{position:absolute;z-index:618;top:4.25rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.55rem;min-width:260px;padding:.42rem .62rem;border:1px solid rgba(98,236,255,.2);background:rgba(4,18,27,.82);backdrop-filter:blur(12px);pointer-events:none;transition:border-color .25s,box-shadow .25s,background .25s}
    .geo4__scenario-ribbon i{width:7px;height:7px;border-radius:50%;background:#62ecff;box-shadow:0 0 14px rgba(98,236,255,.8)}
    .geo4__scenario-ribbon b{font:700 .58rem/1.2 monospace;letter-spacing:.08em;color:#dff9fd}.geo4__scenario-ribbon small{margin-left:auto;color:#7897a3;font:600 .52rem monospace}
    .geo4__scenario-ribbon[data-level="moderate"]{border-color:rgba(255,204,102,.42);box-shadow:0 0 26px rgba(255,204,102,.08)}.geo4__scenario-ribbon[data-level="moderate"] i{background:#ffcc66;box-shadow:0 0 14px rgba(255,204,102,.8)}
    .geo4__scenario-ribbon[data-level="severe"]{border-color:rgba(255,117,154,.5);box-shadow:0 0 30px rgba(255,117,154,.1)}.geo4__scenario-ribbon[data-level="severe"] i{background:#ff759a;box-shadow:0 0 16px rgba(255,117,154,.9)}
    .geo4__event-vignette{position:absolute;inset:0;z-index:509;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(circle at 50% 50%,transparent 35%,rgba(255,117,154,.08) 72%,rgba(255,117,154,.18) 100%)}
    .geo4__shell[data-road-visual="congestion"] .geo4__event-vignette,.geo4__shell[data-road-visual="closure"] .geo4__event-vignette,.geo4__shell[data-road-visual="mixed"] .geo4__event-vignette{opacity:1}
    .geo4__shell[data-road-visual="newroad"] .geo4__event-vignette{opacity:.72;background:radial-gradient(circle at 50% 50%,transparent 35%,rgba(216,255,107,.05) 72%,rgba(216,255,107,.13) 100%)}
    .geo4__shell[data-road-visual="closure"] .leaflet-overlay-pane svg{filter:contrast(1.08) saturate(.92)}
    .geo4__shell[data-road-visual="congestion"] .leaflet-overlay-pane svg,.geo4__shell[data-road-visual="mixed"] .leaflet-overlay-pane svg{filter:contrast(1.06) saturate(1.08)}
    @media(max-width:820px){.geo4__scenario-ribbon{top:13.2rem;min-width:220px}}
  `;
  D.head.appendChild(style);

  const vignette = D.createElement("div");
  vignette.className = "geo4__event-vignette";
  vignette.setAttribute("aria-hidden", "true");
  shell.appendChild(vignette);

  const ribbon = D.createElement("div");
  ribbon.className = "geo4__scenario-ribbon";
  ribbon.innerHTML = '<i></i><b></b><small></small>';
  shell.appendChild(ribbon);
  const title = ribbon.querySelector("b");
  const detail = ribbon.querySelector("small");

  const update = () => {
    const value = mode.value || "baseline";
    const congestionValue = Number(congestion.value || 0);
    const closureValue = Number(closure.value || 0);
    const roadsValue = Number(newRoads.textContent || 0);
    let score = 0;
    if (value === "congestion") score = congestionValue / 100;
    else if (value === "closure") score = Math.min(1, closureValue / 8);
    else if (value === "newroad") score = Math.min(.65, roadsValue / 10);
    else if (value === "mixed") score = Math.min(1, congestionValue / 130 + closureValue / 12);
    const level = score > .62 ? "severe" : score > .24 ? "moderate" : "stable";
    shell.dataset.roadVisual = value;
    ribbon.dataset.level = level;
    title.textContent = labels[value] || labels.baseline;
    detail.textContent = value === "baseline" ? labels.stable : `${labels[level]} · ${labels.active}`;
  };

  mode.addEventListener("change", update);
  congestion.addEventListener("input", update);
  closure.addEventListener("input", update);
  D.querySelectorAll('[data-step="newRoads"]').forEach((button) => button.addEventListener("click", () => globalThis.setTimeout(update, 0)));
  D.getElementById("geo4-reset")?.addEventListener("click", () => globalThis.setTimeout(update, 0));
  update();
}

bootScenarioVisualState();