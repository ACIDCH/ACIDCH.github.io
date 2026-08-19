const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const engine = D?.getElementById("geo4-engine");
  const graphStatus = D?.getElementById("geo4-graph-status");
  const resultStatus = D?.getElementById("geo4-status");
  const run = D?.getElementById("geo4-run");
  if (!root || !engine || !graphStatus || !resultStatus || !run) {
    globalThis.setTimeout(boot, 90);
    return;
  }
  if (root.dataset.osmFallbackReady === "true") return;
  root.dataset.osmFallbackReady = "true";

  let fallbackInFlight = false;
  let recoveryCheck = 0;

  const failedText = () =>
    /OSM.*(?:失败|failed|unavailable)|已自动切换至快速 OD|已切换至快速 OD|switched to Fast OD|switched to the Fast OD/i.test(
      String(graphStatus.textContent || ""),
    );
  const readyText = () =>
    /nodes\s*\/\s*[\d,]+\s*edges/i.test(String(graphStatus.textContent || ""));
  const resultSettled = () => {
    const text = String(resultStatus.textContent || "");
    return (
      root.dataset.resultFreshness === "fresh" ||
      /重新优化|re-optimised|没有可行方案|No feasible solution/i.test(text)
    );
  };

  function recoverFastOd() {
    recoveryCheck = 0;
    if (readyText()) {
      fallbackInFlight = false;
      delete root.dataset.networkRecovery;
      return;
    }
    if (!failedText() || fallbackInFlight) return;

    // loadGraph() writes the failure sentence immediately before the core
    // switches the select value to Fast OD. MutationObserver therefore sees
    // the old OSM value for one turn. Re-check after that transition instead
    // of losing the recovery state permanently.
    if (engine.value !== "od") {
      recoveryCheck = globalThis.setTimeout(recoverFastOd, 0);
      return;
    }

    root.dataset.networkRecovery = "fast-od";

    // A Run-triggered graph failure naturally continues into the Fast OD
    // solve after loadGraph() returns. Do not launch a duplicate solve if that
    // original solve has already settled. An explicit graph-load failure that
    // has not produced a result still gets one bounded recovery Run.
    if (resultSettled()) {
      fallbackInFlight = false;
      return;
    }

    fallbackInFlight = true;
    root.dataset.resultFreshness = "calculating";
    globalThis.setTimeout(() => {
      if (!resultSettled() && engine.value === "od") run.click();
      globalThis.setTimeout(() => {
        fallbackInFlight = false;
      }, 250);
    }, 0);
  }

  const observer = new globalThis.MutationObserver(() => {
    if (readyText()) {
      if (recoveryCheck) globalThis.clearTimeout(recoveryCheck);
      recoveryCheck = 0;
      fallbackInFlight = false;
      delete root.dataset.networkRecovery;
      return;
    }
    if (!failedText()) return;
    if (recoveryCheck) globalThis.clearTimeout(recoveryCheck);
    recoveryCheck = globalThis.setTimeout(recoverFastOd, 0);
  });
  observer.observe(graphStatus, { childList: true, characterData: true, subtree: true });
}

boot();
