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
    .geo4__scenario-ribbon{position:absolute;z-index:618;top:4.25rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.55rem;min-width:270px;padding:.43rem .64rem;border:1px solid rgba(98,236,255,.24);background:linear-gradient(90deg,rgba(4,18,27,.9),rgba(4,18,27,.76));backdrop-filter:blur(13px);box-shadow:0 12px 34px rgba(0,0,0,.18);pointer-events:none;transition:border-color .25s,box-shadow .25s,background .25s}
    .geo4__scenario-ribbon:after{content:"";position:absolute;left:0;bottom:-1px;width:34%;height:1px;background:linear-gradient(90deg,#62ecff,transparent)}
    .geo4__scenario-ribbon i{width:7px;height:7px;border-radius:50%;background:#62ecff;box-shadow:0 0 14px rgba(98,236,255,.8)}
    .geo4__scenario-ribbon b{font:700 .58rem/1.2 monospace;letter-spacing:.08em;color:#dff9fd}.geo4__scenario-ribbon small{margin-left:auto;color:#7897a3;font:600 .52rem monospace}
    .geo4__scenario-ribbon[data-level="moderate"]{border-color:rgba(255,204,102,.48);box-shadow:0 0 30px rgba(255,204,102,.1)}.geo4__scenario-ribbon[data-level="moderate"] i{background:#ffcc66;box-shadow:0 0 14px rgba(255,204,102,.8)}.geo4__scenario-ribbon[data-level="moderate"]:after{background:linear-gradient(90deg,#ffcc66,transparent)}
    .geo4__scenario-ribbon[data-level="severe"]{border-color:rgba(255,117,154,.56);box-shadow:0 0 34px rgba(255,117,154,.12)}.geo4__scenario-ribbon[data-level="severe"] i{background:#ff759a;box-shadow:0 0 16px rgba(255,117,154,.9)}.geo4__scenario-ribbon[data-level="severe"]:after{background:linear-gradient(90deg,#ff759a,transparent)}
    .geo4__event-vignette,.geo4__event-pattern{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .35s,background .35s}.geo4__event-vignette{z-index:509;background:radial-gradient(circle at 46% 50%,transparent 31%,rgba(255,117,154,.07) 70%,rgba(255,117,154,.18) 100%)}.geo4__event-pattern{z-index:506}
    .geo4__shell[data-road-visual="congestion"] .geo4__event-vignette{opacity:.82;background:radial-gradient(circle at 45% 48%,transparent 32%,rgba(255,204,102,.055) 68%,rgba(255,204,102,.14) 100%)}
    .geo4__shell[data-road-visual="congestion"] .geo4__event-pattern{opacity:.22;background:repeating-linear-gradient(110deg,transparent 0 42px,rgba(255,204,102,.045) 43px 44px,transparent 45px 86px)}
    .geo4__shell[data-road-visual="closure"] .geo4__event-vignette{opacity:1}.geo4__shell[data-road-visual="closure"] .geo4__event-pattern{opacity:.28;background:repeating-linear-gradient(135deg,transparent 0 28px,rgba(255,117,154,.055) 29px 30px,transparent 31px 58px)}
    .geo4__shell[data-road-visual="mixed"] .geo4__event-vignette{opacity:1;background:radial-gradient(circle at 45% 50%,transparent 27%,rgba(255,204,102,.04) 55%,rgba(255,117,154,.16) 100%)}.geo4__shell[data-road-visual="mixed"] .geo4__event-pattern{opacity:.35;background:repeating-linear-gradient(125deg,transparent 0 25px,rgba(255,117,154,.045) 26px 27px,transparent 28px 52px),linear-gradient(90deg,rgba(255,204,102,.02),transparent 45%,rgba(255,117,154,.035))}
    .geo4__shell[data-road-visual="newroad"] .geo4__event-vignette{opacity:.78;background:radial-gradient(circle at 45% 50%,transparent 32%,rgba(216,255,107,.055) 70%,rgba(216,255,107,.14) 100%)}.geo4__shell[data-road-visual="newroad"] .geo4__event-pattern{opacity:.2;background:repeating-linear-gradient(70deg,transparent 0 44px,rgba(216,255,107,.045) 45px 46px,transparent 47px 92px)}
    .geo4__shell[data-road-visual="closure"] .leaflet-overlay-pane svg{filter:contrast(1.1) saturate(.92)}
    .geo4__shell[data-road-visual="congestion"] .leaflet-overlay-pane svg,.geo4__shell[data-road-visual="mixed"] .leaflet-overlay-pane svg{filter:contrast(1.08) saturate(1.12)}
  `;
  D.head.appendChild(style);

  const vignette = D.createElement("div");
  vignette.className = "geo4__event-vignette";
  vignette.setAttribute("aria-hidden", "true");
  shell.appendChild(vignette);

  const pattern = D.createElement("div");
  pattern.className = "geo4__event-pattern";
  pattern.setAttribute("aria-hidden", "true");
  shell.appendChild(pattern);

  const ribbon = D.createElement("div");
  ribbon.className = "geo4__scenario-ribbon";
  ribbon.innerHTML = "<i></i><b></b><small></small>";
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
    else if (value === "newroad") score = Math.min(0.65, roadsValue / 10);
    else if (value === "mixed")
      score = Math.min(1, congestionValue / 130 + closureValue / 12);
    const level = score > 0.62 ? "severe" : score > 0.24 ? "moderate" : "stable";
    shell.dataset.roadVisual = value;
    ribbon.dataset.level = level;
    title.textContent = labels[value] || labels.baseline;
    detail.textContent =
      value === "baseline" ? labels.stable : `${labels[level]} · ${labels.active}`;
  };

  mode.addEventListener("change", update);
  congestion.addEventListener("input", update);
  closure.addEventListener("input", update);
  D.querySelectorAll('[data-step="newRoads"]').forEach((button) =>
    button.addEventListener("click", () => globalThis.setTimeout(update, 0)),
  );
  D.getElementById("geo4-reset")?.addEventListener("click", () =>
    globalThis.setTimeout(update, 0),
  );
  update();
}

bootScenarioVisualState();
