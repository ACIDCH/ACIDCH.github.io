const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  if (!root) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.layoutPolishReady === "true") return;
  root.dataset.layoutPolishReady = "true";

  root.closest(".page-shell")?.classList.add("geo-lab-page");
  root.closest(".page-container")?.classList.add("geo-lab-container");

  const style = D.createElement("style");
  style.textContent = `
    .geo4__open-list>div>div{display:grid;gap:.22rem;min-width:0}
    .geo4__open-list strong{line-height:1.35;overflow-wrap:anywhere}
    .geo4__open-list small{margin-top:0!important;line-height:1.35;overflow-wrap:anywhere}
    @media (min-width:1181px){
      .geo-lab-page{padding-block:.55rem .85rem!important}
      .geo-lab-container{width:100%!important;max-width:none!important;gap:.45rem!important}
      .geo4{width:min(1760px,calc(100vw - 1rem))!important;margin:0 auto .25rem!important}
      .geo4__shell{height:clamp(760px,calc(100vh - 8.2rem),1080px)!important;min-height:760px!important;border-radius:10px!important;box-shadow:0 30px 95px rgba(2,10,16,.34)!important}
      #geo4-map{filter:saturate(1.08) contrast(1.06)}
      .geo4__console{top:.7rem!important;right:.7rem!important;left:auto!important;width:390px!important;height:calc(61% - .7rem)!important;max-height:none!important;border-color:rgba(116,190,213,.28)!important;box-shadow:0 22px 70px rgba(0,0,0,.34)!important}
      .geo4__results{position:absolute!important;z-index:699!important;top:auto!important;left:auto!important;right:.7rem!important;bottom:.7rem!important;width:390px!important;max-width:390px!important;height:calc(39% - .7rem)!important;max-height:none!important;overflow-y:auto!important;box-sizing:border-box!important;border:1px solid rgba(116,190,213,.26)!important;background:linear-gradient(180deg,rgba(7,24,34,.97),rgba(5,19,28,.95))!important;backdrop-filter:blur(16px)!important;box-shadow:0 18px 60px rgba(0,0,0,.32)!important}
      .geo4__scenario-ribbon{max-width:390px}
      .geo4__flow-panel{width:min(540px,calc(100% - 840px))!important;min-width:380px!important}
      .geo4__legend{left:1rem!important;right:auto!important;bottom:.7rem!important;width:390px!important;max-width:390px!important;box-sizing:border-box!important;row-gap:.42rem!important;background:rgba(4,18,27,.92)!important;border-color:rgba(116,190,213,.26)!important}
      .geo4__logistics-state{left:1rem!important;bottom:4.8rem!important}
      .geo4__flow-tier{left:1rem!important;bottom:7.35rem!important;max-width:245px!important;box-sizing:border-box!important}
      .geo4__layer-chip{left:1rem!important;bottom:12.15rem!important;max-width:245px!important;box-sizing:border-box!important}
      .geo4 .leaflet-control-zoom{margin-top:12px!important;margin-left:12px!important}
    }
    @media (min-width:821px) and (max-width:1180px){
      .geo4__results{max-height:310px;overflow-y:auto}
    }
  `;
  D.head.appendChild(style);
}

boot();
