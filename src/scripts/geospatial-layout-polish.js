const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  if (!root) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.layoutPolishReady === "true") return;
  root.dataset.layoutPolishReady = "true";

  const style = D.createElement("style");
  style.textContent = `
    .geo4__open-list>div>div{display:grid;gap:.22rem;min-width:0}
    .geo4__open-list strong{line-height:1.35;overflow-wrap:anywhere}
    .geo4__open-list small{margin-top:0!important;line-height:1.35;overflow-wrap:anywhere}
    @media (min-width:1181px){
      .geo4__console{top:.7rem!important;right:.7rem!important;left:auto!important;width:390px!important;height:calc(61% - .7rem)!important;max-height:none!important}
      .geo4__results{position:absolute!important;z-index:699!important;top:auto!important;left:auto!important;right:.7rem!important;bottom:.7rem!important;width:390px!important;max-width:390px!important;height:calc(39% - .7rem)!important;max-height:none!important;overflow-y:auto!important;box-sizing:border-box!important;border:1px solid rgba(116,190,213,.2)!important;background:rgba(7,24,34,.95)!important;backdrop-filter:blur(14px)!important;box-shadow:0 18px 60px rgba(0,0,0,.24)!important}
      .geo4__identity{width:min(540px,calc(100% - 430px))!important;padding:.82rem 1rem!important}
      .geo4__identity h1{font-size:clamp(1.65rem,2.65vw,2.7rem)!important;line-height:1.02!important;max-width:470px}
      .geo4__identity p{max-width:460px}
      .geo4__scenario-ribbon{max-width:390px}
      .geo4__flow-panel{width:min(520px,calc(100% - 840px))!important;min-width:360px!important}
    }
    @media (min-width:821px) and (max-width:1180px){
      .geo4__results{max-height:310px;overflow-y:auto}
    }
  `;
  D.head.appendChild(style);
}

boot();
