const D = globalThis.document;

function applyScenarioSummaryLayout() {
  const root = D?.getElementById("geo-v4");
  if (!root) {
    globalThis.setTimeout(applyScenarioSummaryLayout, 80);
    return;
  }
  if (root.dataset.scenarioSummaryLayoutV4Ready === "true") return;
  root.dataset.scenarioSummaryLayoutV4Ready = "true";

  const style = D.createElement("style");
  style.textContent = `
    #geo-v4 .geo4__ab > .geo4__ab-summary {
      display: grid;
      width: 100%;
      min-width: 0;
      gap: .45rem;
      justify-content: initial;
      align-items: stretch;
    }
  `;
  D.head.appendChild(style);
}

applyScenarioSummaryLayout();
