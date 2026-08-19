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

  let fallbackInFlight = false;

  const observer = new globalThis.MutationObserver(() => {
    const text = String(graphStatus.textContent || "");
    const failed = /OSM.*(?:失败|failed)|已切换至快速 OD|switched to the Fast OD/i.test(text);
    const ready = /nodes\s*\/\s*[\d,]+\s*edges/i.test(text);
    if (ready) {
      fallbackInFlight = false;
      delete root.dataset.networkRecovery;
      return;
    }
    if (!failed || fallbackInFlight || engine.value !== "od") return;

    // Persist the recovery mode separately from the result-status sentence.
    // The result status is allowed to settle on the normal "re-optimised"
    // message after the Fast OD solve, while graphStatus remains the visible
    // explanation of why the network engine changed.
    root.dataset.networkRecovery = "fast-od";
    fallbackInFlight = true;
    root.dataset.resultFreshness = "calculating";
    globalThis.setTimeout(() => run.click(), 0);
    globalThis.setTimeout(() => {
      fallbackInFlight = false;
    }, 250);
  });
  observer.observe(graphStatus, { childList: true, characterData: true, subtree: true });
}

boot();
