const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  if (!root) {
    globalThis.setTimeout(boot, 60);
    return;
  }
  if (root.dataset.productionUxReady === "true") return;
  root.dataset.productionUxReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        combined: "网络实体与设施决策",
        entities: "实体清单",
        editor: "添加网络实体",
        mapAdd: "点击地图添加",
        mapAddOn: "点击地图添加：开启",
        initialise: "初始化 GIS 场景",
        autoRun: "参数已更新，正在重新优化…",
      }
    : {
        combined: "Network entities & facility decisions",
        entities: "Network entities",
        editor: "Add network entity",
        mapAdd: "Add by clicking map",
        mapAddOn: "Map add: on",
        initialise: "Initialise GIS scene",
        autoRun: "Inputs updated · re-optimising…",
      };

  const style = D.createElement("style");
  style.textContent = `
    #geo-v4 .geo4__block-title strong{font-size:.88rem;letter-spacing:.025em}
    #geo-v4 .geo4__field,#geo-v4 .geo4__range,#geo-v4 .geo4__check,#geo-v4 .geo4__step-row{font-size:.77rem;line-height:1.4}
    #geo-v4 .geo4__field input,#geo-v4 .geo4__field select{font-size:.78rem;padding:.52rem .55rem}
    #geo-v4 button{font-size:.78rem;font-weight:620;line-height:1.25;padding:.64rem .68rem}
    #geo-v4 .geo4__micro{color:#93b0bb;font-size:.70rem;line-height:1.55}
    #geo-v4 .geo4__subhead{color:#91adb7;font-size:.68rem;letter-spacing:.055em}
    #geo-v4 .geo4__policy-row,#geo-v4 .geo4__custom-row{grid-template-columns:minmax(0,1fr) minmax(138px,auto);padding:.56rem;gap:.58rem}
    #geo-v4 .geo4__policy-row strong,#geo-v4 .geo4__custom-row strong{font-size:.75rem;line-height:1.35}
    #geo-v4 .geo4__policy-row small,#geo-v4 .geo4__custom-row small{color:#8ca8b2;font-size:.66rem;line-height:1.35}
    #geo-v4 .geo4__policy-row select,#geo-v4 .geo4__policy-row input{width:100%;box-sizing:border-box;border:1px solid rgba(116,190,213,.2);background:#0b202c;color:#eefcff;font-size:.70rem;padding:.42rem}
    #geo-v4 .geo4__results-head span{font-size:.72rem}
    #geo-v4 .geo4__results-head strong{font-size:.82rem}
    #geo-v4 .geo4__kpis span,#geo-v4 .geo4__cost span{font-size:.65rem;color:#92aeb8}
    #geo-v4 .geo4__status{font-size:.71rem;color:#91adb7}
    #geo-v4 .geo4__open-list strong{font-size:.72rem}
    #geo-v4 .geo4__open-list small{font-size:.63rem;color:#89a5af}
    #geo-v4 .geo4__service-health{padding:.55rem .58rem}
    #geo-v4 .geo4__service-health-head{font-size:.58rem;color:#94afb9}
    #geo-v4 .geo4__service-chip{padding:.38rem .4rem}
    #geo-v4 .geo4__service-chip strong{font-size:.58rem}
    #geo-v4 .geo4__service-chip small{font-size:.52rem;color:#87a3ad}
    #geo-v4 .geo4__service-policy{font-size:.54rem;color:#829da7;line-height:1.45}
    #geo-v4 .geo4__entity-editor{margin-top:.85rem;padding-top:.78rem;border-top:1px solid rgba(116,190,213,.18)}
    #geo-v4 .geo4__entity-editor-title{margin:0 0 .6rem;color:#d8ff6b;font-size:.70rem;font-weight:700;letter-spacing:.055em;text-transform:uppercase}
    #geo-v4 .geo4__entity-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.4rem;align-items:center}
    #geo-v4 .geo4__entity-remove{border-color:rgba(255,117,154,.3);background:rgba(87,24,43,.24);color:#ff9ab5;padding:.42rem .52rem;font-size:.66rem;white-space:nowrap}
    #geo-v4 .geo4__auto-run-note{display:none;margin:.4rem 0 0;color:#d8ff6b;font-size:.65rem}
    #geo-v4[data-auto-solving="true"] .geo4__auto-run-note{display:block}
    #geo-v4 .geo4__legend{font-size:.66rem}
    #geo-v4 .geo4__flow-head b{font-size:.74rem!important}
    #geo-v4 .geo4__flow-head small,#geo-v4 .geo4__flow-controls label{font-size:.61rem!important}
  `;
  D.head.appendChild(style);

  const policyList = D.getElementById("geo4-policy-list");
  const facilityBlock = policyList?.closest?.(".geo4__block");
  const editorRole = D.getElementById("geo4-role");
  const editorBlock = editorRole?.closest?.(".geo4__block");
  if (facilityBlock) {
    const title = facilityBlock.querySelector(".geo4__block-title strong");
    if (title) title.textContent = copy.combined;
    const subhead = policyList?.previousElementSibling;
    if (subhead?.querySelector("span")) subhead.querySelector("span").textContent = copy.entities;
  }

  if (facilityBlock && editorBlock && facilityBlock !== editorBlock) {
    const editor = D.createElement("div");
    editor.className = "geo4__entity-editor";
    const heading = D.createElement("p");
    heading.className = "geo4__entity-editor-title";
    heading.textContent = copy.editor;
    editor.appendChild(heading);
    [...editorBlock.children].forEach((child) => {
      if (!child.classList.contains("geo4__block-title")) editor.appendChild(child);
    });
    facilityBlock.appendChild(editor);
    editorBlock.remove();
  }

  const customList = D.getElementById("geo4-custom-list");
  if (customList) {
    const customSubhead = customList.previousElementSibling;
    if (customSubhead?.classList.contains("geo4__subhead")) customSubhead.hidden = true;
    customList.hidden = true;
  }

  root.querySelectorAll(".geo4__console .geo4__block-title > span").forEach((label, index) => {
    label.textContent = String(index + 1).padStart(2, "0");
  });

  const initButton = D.getElementById("geo4-init");
  if (initButton) initButton.textContent = copy.initialise;

  const mapAdd = D.getElementById("geo4-map-add");
  function normalizeMapAddText() {
    if (!mapAdd) return;
    const active = mapAdd.classList.contains("is-active");
    mapAdd.textContent = active ? copy.mapAddOn : copy.mapAdd;
  }
  normalizeMapAddText();
  if (mapAdd && globalThis.MutationObserver) {
    new globalThis.MutationObserver(normalizeMapAddText).observe(mapAdd, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  const graphStatus = D.getElementById("geo4-graph-status");
  const runButton = D.getElementById("geo4-run");
  const autoNote = D.createElement("p");
  autoNote.className = "geo4__auto-run-note";
  autoNote.textContent = copy.autoRun;
  graphStatus?.insertAdjacentElement("afterend", autoNote);

  let timer = 0;
  function osmGraphReady() {
    const engine = D.getElementById("geo4-engine")?.value;
    const text = String(graphStatus?.textContent || "");
    return engine === "osm" && /nodes\s*\/\s*[\d,]+\s*edges/i.test(text);
  }
  function scheduleSolve(event) {
    const target = event.target;
    if (!target?.closest?.("#geo-v4")) return;
    if (target.id === "geo4-layer" || target.id === "geo4-runs") return;
    if (!osmGraphReady() || !runButton || runButton.disabled) return;
    globalThis.clearTimeout(timer);
    timer = globalThis.setTimeout(() => {
      if (!osmGraphReady() || runButton.disabled) return;
      root.dataset.autoSolving = "true";
      runButton.click();
      globalThis.setTimeout(() => delete root.dataset.autoSolving, 500);
    }, 420);
  }
  root.addEventListener("change", scheduleSolve);
  root.addEventListener("click", (event) => {
    if (event.target?.closest?.("[data-step]")) scheduleSolve(event);
  });
}

boot();
