const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const engine = D?.getElementById("geo4-engine");
  const graphStatus = D?.getElementById("geo4-graph-status");
  const run = D?.getElementById("geo4-run");
  if (!root || !engine || !graphStatus || !run) {
    globalThis.setTimeout(boot, 90);
    return;
  }
  if (root.dataset.osmFallbackReady === "true") return;
  root.dataset.osmFallbackReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const fallbackText = zh
    ? "OSM 路网暂时不可用，已自动使用快速 OD 网络完成优化。"
    : "OSM Road Network is temporarily unavailable; optimisation continued automatically with Fast OD.";
  let fallbackInFlight = false;

  const observer = new globalThis.MutationObserver(() => {
    const text = String(graphStatus.textContent || "");
    const failed = /OSM.*(?:失败|failed)|已切换至快速 OD|switched to the Fast OD/i.test(text);
    const ready = /nodes\s*\/\s*[\d,]+\s*edges/i.test(text);
    if (ready) {
      fallbackInFlight = false;
      return;
    }
    if (!failed || fallbackInFlight || engine.value !== "od") return;
    fallbackInFlight = true;
    root.dataset.resultFreshness = "calculating";
    globalThis.setTimeout(() => run.click(), 0);
    globalThis.setTimeout(() => {
      const status = D.getElementById("geo4-status");
      if (status && /重新优化|re-optimised/i.test(status.textContent || "")) {
        status.textContent = fallbackText;
      }
      fallbackInFlight = false;
    }, 250);
  });
  observer.observe(graphStatus, { childList: true, characterData: true, subtree: true });
}

boot();
