const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const policyList = D?.getElementById("geo4-policy-list");
  const address = D?.getElementById("geo4-address");
  if (!root || !policyList || !address) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.compactEntityUiReady === "true") return;
  root.dataset.compactEntityUiReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        title: "设施、覆盖与网络实体",
        list: "网络实体与设施决策",
        editor: "添加网络实体",
        preference:
          "OSM 道路网络为默认引擎。内置 Auckland 道路图可立即运行；点击“加载 / 刷新 OSM 路网”可按需获取在线路网，失败时保留当前有效结果。",
        load: "加载 / 刷新 OSM 路网",
        init: "随机轻量场景",
        mapAdd: "点击地图添加",
      }
    : {
        title: "Facilities, coverage & network entities",
        list: "Network entities & facility decisions",
        editor: "Add network entity",
        preference:
          "OSM Road Network is the default. The bundled Auckland road graph runs immediately; choose Load / refresh OSM graph to request live roads while preserving the latest valid result on failure.",
        load: "Load / refresh OSM graph",
        init: "New compact scene",
        mapAdd: "Click map to add",
      };

  const style = D.createElement("style");
  style.textContent = `
    @media (min-width:821px){
      #geo-v4 .geo4__console{width:410px!important}
      #geo-v4 .geo4__results{width:410px!important;max-width:410px!important}
      #geo-v4 .geo4__scenario-ribbon{max-width:410px!important}
    }
    #geo-v4 .geo4__block{padding:.92rem 1rem!important}
    #geo-v4 .geo4__block-title strong{font-size:.84rem!important;letter-spacing:.025em!important}
    #geo-v4 .geo4__block-title span{font-size:.71rem!important}
    #geo-v4 .geo4__field,#geo-v4 .geo4__range,#geo-v4 .geo4__check,#geo-v4 .geo4__step-row{font-size:.77rem!important;line-height:1.4!important}
    #geo-v4 .geo4__field input,#geo-v4 .geo4__field select{font-size:.78rem!important;padding:.52rem .55rem!important;min-height:36px}
    #geo-v4 button{font-size:.78rem!important;line-height:1.3!important;padding:.62rem .68rem!important;min-height:38px}
    #geo-v4 .geo4__micro{font-size:.71rem!important;line-height:1.55!important;color:#88a6b2!important}
    #geo-v4 .geo4__subhead{font-size:.69rem!important;color:#8eabb5!important}
    #geo-v4 .geo4__policy-row{grid-template-columns:minmax(0,1fr) minmax(128px,auto)!important;padding:.58rem!important;gap:.55rem!important}
    #geo-v4 .geo4__policy-row strong{font-size:.74rem!important;line-height:1.35!important}
    #geo-v4 .geo4__policy-row small{font-size:.65rem!important;line-height:1.4!important;color:#91abb5!important}
    #geo-v4 .geo4__entity-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.35rem;align-items:center}
    #geo-v4 .geo4__entity-actions select,#geo-v4 .geo4__entity-actions input{width:100%;min-width:0;border:1px solid rgba(116,190,213,.2);background:#0b202c;color:#e8f9fc;padding:.38rem .42rem;font-size:.69rem;min-height:34px}
    #geo-v4 .geo4__entity-remove{padding:.36rem .48rem!important;min-height:34px!important;font-size:.67rem!important;background:rgba(88,34,48,.34)!important;border-color:rgba(255,117,154,.3)!important;color:#ff9ab7!important;white-space:nowrap}
    #geo-v4 .geo4__merged-editor{margin-top:.85rem;padding-top:.82rem;border-top:1px solid rgba(116,190,213,.18)}
    #geo-v4 .geo4__merged-editor-heading{display:flex;justify-content:space-between;gap:.8rem;align-items:center;margin:0 0 .55rem;color:#9bb5be;font-size:.72rem}
    #geo-v4 .geo4__merged-editor-heading strong{color:#62ecff;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase}
    #geo-v4 .geo4__osm-preferred{display:flex;gap:.45rem;align-items:flex-start;margin:.52rem 0 0;padding:.5rem .54rem;border:1px solid rgba(98,236,255,.18);background:rgba(8,38,50,.42);color:#9ab4bd;font-size:.69rem;line-height:1.5}
    #geo-v4 .geo4__osm-preferred i{flex:0 0 auto;width:8px;height:8px;margin-top:.28rem;border-radius:50%;background:#62ecff;box-shadow:0 0 10px rgba(98,236,255,.55)}
  `;
  D.head.appendChild(style);

  const facilityBlock = policyList.closest(".geo4__block");
  const editorBlock = address.closest(".geo4__block");
  if (facilityBlock && editorBlock && facilityBlock !== editorBlock) {
    const title = facilityBlock.querySelector(".geo4__block-title strong");
    if (title) title.textContent = copy.title;
    const subhead = policyList.previousElementSibling;
    if (subhead?.querySelector("span"))
      subhead.querySelector("span").textContent = copy.list;

    const merged = D.createElement("div");
    merged.className = "geo4__merged-editor";
    merged.innerHTML = `<div class="geo4__merged-editor-heading"><strong>${copy.editor}</strong><span>Factory / Warehouse / Demand</span></div>`;
    [...editorBlock.children]
      .filter((child) => !child.classList.contains("geo4__block-title"))
      .forEach((child) => merged.appendChild(child));
    facilityBlock.appendChild(merged);
    editorBlock.remove();
    root.dataset.entityEditorMerged = "true";
  }

  [...root.querySelectorAll(".geo4__scroll > .geo4__block")].forEach((block, index) => {
    const number = block.querySelector(".geo4__block-title > span");
    if (number) number.textContent = String(index + 1).padStart(2, "0");
  });

  const graphStatus = D.getElementById("geo4-graph-status");
  if (graphStatus && !root.querySelector(".geo4__osm-preferred")) {
    const note = D.createElement("p");
    note.className = "geo4__osm-preferred";
    note.innerHTML = `<i></i><span>${copy.preference}</span>`;
    graphStatus.insertAdjacentElement("afterend", note);
  }

  const load = D.getElementById("geo4-load-graph");
  const init = D.getElementById("geo4-init");
  const mapAdd = D.getElementById("geo4-map-add");
  if (load) load.textContent = copy.load;
  if (init) init.textContent = copy.init;
  if (mapAdd && !mapAdd.classList.contains("is-active"))
    mapAdd.textContent = copy.mapAdd;
}

boot();
