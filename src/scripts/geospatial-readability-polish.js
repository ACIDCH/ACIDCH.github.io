const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  if (!root) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.readabilityPolishReady === "true") return;
  root.dataset.readabilityPolishReady = "true";

  const style = D.createElement("style");
  style.textContent = `
    #geo-v4 .geo4__service-health-head{font-size:.69rem!important;line-height:1.35!important;letter-spacing:.065em!important}
    #geo-v4 .geo4__service-chip{padding:.42rem .44rem!important;gap:.32rem .42rem!important}
    #geo-v4 .geo4__service-chip i{width:8px!important;height:8px!important}
    #geo-v4 .geo4__service-chip strong{font-size:.68rem!important;line-height:1.3!important;overflow:visible!important;text-overflow:clip!important}
    #geo-v4 .geo4__service-chip small{font-size:.61rem!important;line-height:1.35!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}
    #geo-v4 .geo4__service-policy{font-size:.62rem!important;line-height:1.55!important}
    #geo-v4 .geo4__fleet-planner-head strong,#geo-v4 .geo4__trans-head strong{font-size:.72rem!important}
    #geo-v4 .geo4__fleet-planner-head span,#geo-v4 .geo4__trans-head span{font-size:.59rem!important}
    #geo-v4 .geo4__fleet-note,#geo-v4 .geo4__trans-note,#geo-v4 .geo4__fleet-status,#geo-v4 .geo4__trans-status{font-size:.65rem!important;line-height:1.5!important}
    #geo-v4 .geo4__fleet-summary span,#geo-v4 .geo4__trans-summary span{font-size:.57rem!important}
    #geo-v4 .geo4__fleet-summary b,#geo-v4 .geo4__trans-summary b{font-size:.71rem!important}
    #geo-v4 .geo4__legend{font-size:.66rem!important;line-height:1.4!important}
    #geo-v4 .geo4__legend i{width:10px!important;height:10px!important}
    #geo-v4 .geo4__policy-row small,#geo-v4 .geo4__custom-row small{font-size:.65rem!important;line-height:1.35!important}
    #geo-v4 .geo4__entity-toggle,#geo-v4 .geo4__entity-remove{font-size:.66rem!important;min-height:2rem!important}
  `;
  D.head.appendChild(style);

  const mapAdd = D.getElementById("geo4-map-add");
  if (mapAdd) mapAdd.textContent = (root.dataset.locale || "zh") === "zh" ? "点击地图添加" : "Click map to add";
}

boot();
