const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const shell = root?.querySelector(".geo4__shell");
  const controls = root?.querySelector(".geo4__console");
  const results = root?.querySelector(".geo4__results");
  if (!root || !shell || !controls || !results) {
    globalThis.setTimeout(boot, 90);
    return;
  }
  if (root.dataset.mobileWorkspaceReady === "true") return;
  root.dataset.mobileWorkspaceReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const labels = zh
    ? { map: "地图", controls: "参数", results: "结果", nav: "移动端视图" }
    : { map: "Map", controls: "Controls", results: "Results", nav: "Mobile workspace" };

  const style = D.createElement("style");
  style.textContent = `
    .geo4__mobile-nav{display:none}
    @media (max-width:820px){
      .geo4__shell{height:76vh!important;height:clamp(620px,calc(100svh - 6.5rem),820px)!important;min-height:620px!important;max-height:820px!important}
      .geo4__mobile-nav{position:absolute;z-index:980;left:.5rem;right:.5rem;bottom:.5rem;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.38rem;padding:.38rem;border:1px solid rgba(116,190,213,.28);border-radius:9px;background:rgba(4,18,27,.96);box-shadow:0 12px 34px rgba(0,0,0,.36);backdrop-filter:blur(14px)}
      .geo4__mobile-nav button{min-height:42px!important;padding:.55rem .35rem!important;border-radius:7px!important;border:1px solid rgba(116,190,213,.18)!important;background:rgba(11,39,51,.7)!important;color:#9bb8c2!important;font-size:.76rem!important;font-weight:700!important;letter-spacing:.02em!important}
      .geo4__mobile-nav button[aria-selected="true"]{border-color:rgba(216,255,107,.48)!important;background:rgba(70,90,33,.3)!important;color:#d8ff6b!important;box-shadow:inset 0 0 0 1px rgba(216,255,107,.08)}
      .geo4__shell[data-mobile-view="map"] .geo4__console,.geo4__shell[data-mobile-view="map"] .geo4__results{display:none!important}
      .geo4__shell[data-mobile-view="controls"] .geo4__results,.geo4__shell[data-mobile-view="results"] .geo4__console{display:none!important}
      .geo4__shell[data-mobile-view="controls"] .geo4__console{display:grid!important;top:.5rem!important;left:.5rem!important;right:.5rem!important;bottom:4.35rem!important;width:auto!important;height:auto!important;max-height:none!important;border-radius:9px!important;overflow:hidden!important}
      .geo4__shell[data-mobile-view="controls"] .geo4__scroll{overflow-y:auto!important;overscroll-behavior:contain}
      .geo4__shell[data-mobile-view="results"] .geo4__results{display:block!important;position:absolute!important;z-index:760!important;top:.5rem!important;left:.5rem!important;right:.5rem!important;bottom:4.35rem!important;width:auto!important;max-width:none!important;height:auto!important;max-height:none!important;overflow-y:auto!important;box-sizing:border-box!important;border-radius:9px!important;padding:.9rem!important;background:linear-gradient(180deg,rgba(7,24,34,.98),rgba(5,19,28,.97))!important}
      .geo4__shell[data-mobile-view="map"] .geo4__legend{left:.5rem!important;right:.5rem!important;bottom:4.45rem!important;width:auto!important;max-width:none!important;box-sizing:border-box!important;max-height:84px!important;overflow:auto!important}
      .geo4__shell:not([data-mobile-view="map"]) .geo4__legend{display:none!important}
      .geo4__shell:not([data-mobile-view="map"]) .geo4__flow-panel,.geo4__shell:not([data-mobile-view="map"]) .geo4__flow-tier,.geo4__shell:not([data-mobile-view="map"]) .geo4__layer-chip,.geo4__shell:not([data-mobile-view="map"]) .geo4__logistics-state,.geo4__shell:not([data-mobile-view="map"]) .geo4__road-hud,.geo4__shell:not([data-mobile-view="map"]) .geo4__coverage-hud-v2{display:none!important}
      .geo4__shell[data-mobile-view="map"] .geo4__flow-panel{display:none!important}
      .geo4__shell[data-mobile-view="map"] .geo4__flow-tier{left:.5rem!important;bottom:9.95rem!important;max-width:190px!important}
      .geo4__shell[data-mobile-view="map"] .geo4__layer-chip{left:.5rem!important;bottom:12.7rem!important;max-width:190px!important}
      .geo4__shell[data-mobile-view="map"] .geo4__logistics-state{left:.5rem!important;bottom:7.25rem!important;max-width:190px!important}
      .geo4__shell[data-mobile-view="map"] .geo4__scenario-ribbon{max-width:calc(100% - 1rem)!important;top:.55rem!important}
      .geo4__shell[data-mobile-view="map"] .geo4__road-hud,.geo4__shell[data-mobile-view="map"] .geo4__coverage-hud-v2{max-width:calc(100% - 1rem)!important}
      .geo4__shell[data-mobile-view="map"] #geo4-map{inset:0!important}
      .geo4__shell[data-mobile-view="map"] .leaflet-control-zoom{margin-top:12px!important;margin-left:12px!important}
      .geo4__policy-row{grid-template-columns:minmax(0,1fr) 94px 62px!important}
      .geo4__merged-editor-heading{align-items:flex-start!important}
    }
  `;
  D.head.appendChild(style);

  const nav = D.createElement("nav");
  nav.className = "geo4__mobile-nav";
  nav.setAttribute("aria-label", labels.nav);
  nav.setAttribute("role", "tablist");
  nav.innerHTML = ["map", "controls", "results"]
    .map(
      (view) =>
        `<button type="button" role="tab" data-geo4-mobile-view="${view}" aria-selected="false">${labels[view]}</button>`,
    )
    .join("");
  shell.appendChild(nav);

  const buttons = [...nav.querySelectorAll("[data-geo4-mobile-view]")];
  const allowed = new Set(["map", "controls", "results"]);

  function setView(view) {
    const next = allowed.has(view) ? view : "map";
    root.dataset.mobileView = next;
    shell.dataset.mobileView = next;
    buttons.forEach((button) => {
      const selected = button.dataset.geo4MobileView === next;
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.tabIndex = selected ? 0 : -1;
    });
    globalThis.requestAnimationFrame(() => {
      globalThis.dispatchEvent(new globalThis.Event("resize"));
      globalThis.setTimeout(
        () => globalThis.dispatchEvent(new globalThis.Event("resize")),
        120,
      );
    });
  }

  nav.addEventListener("click", (event) => {
    const button = event.target?.closest?.("[data-geo4-mobile-view]");
    if (!button) return;
    setView(button.dataset.geo4MobileView);
  });

  nav.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const current = buttons.findIndex((button) => button.getAttribute("aria-selected") === "true");
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (current + delta + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next].focus();
    setView(buttons[next].dataset.geo4MobileView);
  });

  setView("map");
}

boot();
