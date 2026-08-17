const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  if (!root || !shell) {
    globalThis.setTimeout(boot, 100);
    return;
  }
  if (root.dataset.mobileViewReady === "true") return;
  root.dataset.mobileViewReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const labels = zh
    ? { map: "地图", controls: "参数", results: "结果" }
    : { map: "Map", controls: "Controls", results: "Results" };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__mobile-nav{display:none}
    @media(max-width:820px){
      .geo4__shell{min-height:760px!important}
      .geo4__mobile-nav{position:absolute;z-index:900;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;left:.5rem;right:.5rem;bottom:.5rem;padding:2px;border:1px solid rgba(98,236,255,.25);background:rgba(3,16,24,.93);backdrop-filter:blur(14px);box-shadow:0 12px 36px rgba(0,0,0,.35)}
      .geo4__mobile-nav button{border:0;background:transparent;color:#7897a3;padding:.62rem .45rem;font-size:.68rem;cursor:pointer}
      .geo4__mobile-nav button.is-active{background:rgba(98,236,255,.1);color:#dff9fd;box-shadow:inset 0 0 0 1px rgba(98,236,255,.18)}
      .geo4__shell[data-mobile-view="map"] .geo4__console,.geo4__shell[data-mobile-view="map"] .geo4__results{display:none!important}
      .geo4__shell[data-mobile-view="controls"] .geo4__console{display:grid!important;position:absolute!important;z-index:820!important;inset:9.8rem .5rem 3.65rem .5rem!important;width:auto!important;height:auto!important;max-height:none!important}
      .geo4__shell[data-mobile-view="controls"] .geo4__results{display:none!important}
      .geo4__shell[data-mobile-view="results"] .geo4__console{display:none!important}
      .geo4__shell[data-mobile-view="results"] .geo4__results{display:block!important;position:absolute!important;z-index:820!important;inset:9.8rem .5rem 3.65rem .5rem!important;width:auto!important;max-width:none!important;max-height:none!important;height:auto!important;overflow-y:auto!important;background:rgba(7,24,34,.96)!important;backdrop-filter:blur(14px)!important}
      .geo4__shell[data-mobile-view="map"] .geo4__identity{width:calc(100% - 1rem)!important;max-width:360px;padding:.72rem .8rem!important}
      .geo4__shell[data-mobile-view="map"] .geo4__identity h1{font-size:1.55rem!important;line-height:1.05!important}
      .geo4__shell[data-mobile-view="map"] .geo4__identity p{font-size:.66rem!important;max-width:330px}
      .geo4__shell[data-mobile-view="controls"] .geo4__flow-panel,.geo4__shell[data-mobile-view="results"] .geo4__flow-panel,.geo4__shell[data-mobile-view="controls"] .geo4__flow-tier,.geo4__shell[data-mobile-view="results"] .geo4__flow-tier,.geo4__shell[data-mobile-view="controls"] .geo4__layer-chip,.geo4__shell[data-mobile-view="results"] .geo4__layer-chip{display:none!important}
      .geo4__shell[data-mobile-view="controls"] .geo4__scenario-ribbon,.geo4__shell[data-mobile-view="results"] .geo4__scenario-ribbon{display:none!important}
    }
  `;
  D.head.appendChild(style);

  const nav = D.createElement("nav");
  nav.className = "geo4__mobile-nav";
  nav.setAttribute("aria-label", zh ? "移动端地图视图切换" : "Mobile map view switcher");
  nav.innerHTML = `
    <button type="button" data-mobile-view="map">${labels.map}</button>
    <button type="button" data-mobile-view="controls">${labels.controls}</button>
    <button type="button" data-mobile-view="results">${labels.results}</button>`;
  shell.appendChild(nav);

  const buttons = [...nav.querySelectorAll("[data-mobile-view]")];
  const setView = (view) => {
    shell.dataset.mobileView = view;
    buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.mobileView === view));
    globalThis.setTimeout(() => globalThis.dispatchEvent(new Event("resize")), 0);
  };
  buttons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.mobileView || "map")));
  setView("map");
}

boot();
