from __future__ import annotations

import importlib.util
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEO_SCRIPT = ROOT / "scripts" / "capture-pr-geospatial-visuals.py"

spec = importlib.util.spec_from_file_location("geo_visual_helpers", GEO_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load geospatial browser proof helpers.")
geo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(geo)
base = geo.base


def wait_mobile_workspace(browser: object, timeout: float = 10) -> None:
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = browser.execute(
            "return {ready:document.querySelector('#geo-v4')?.dataset.mobileWorkspaceReady||'',view:document.querySelector('.geo4__shell')?.dataset.mobileView||'',buttons:document.querySelectorAll('[data-geo4-mobile-view]').length};"
        )
        if (
            isinstance(last, dict)
            and last.get("ready") == "true"
            and last.get("view") == "map"
            and last.get("buttons") == 3
        ):
            return
        time.sleep(0.2)
    raise RuntimeError(f"Mobile Map / Controls / Results workspace did not initialise: {last!r}")


def layout_state(browser: object) -> dict:
    state = browser.execute(
        r"""
        const shell=document.querySelector('.geo4__shell');
        const map=document.querySelector('#geo4-map');
        const controls=document.querySelector('.geo4__console');
        const results=document.querySelector('.geo4__results');
        const nav=document.querySelector('.geo4__mobile-nav');
        const row=document.querySelector('#geo4-policy-list .geo4__policy-row');
        const actions=row?.querySelector('.geo4__entity-actions');
        const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
        return {
          view:shell?.dataset.mobileView||'',
          shell:rect(shell),map:rect(map),controls:rect(controls),results:rect(results),nav:rect(nav),
          row:row?rect(row):null,actions:actions?rect(actions):null,
          rowOverflow:row?row.scrollWidth-row.clientWidth:999,
          actionsOverflow:actions?actions.scrollWidth-actions.clientWidth:999,
          controlsDisplay:getComputedStyle(controls).display,
          resultsDisplay:getComputedStyle(results).display,
          navDisplay:getComputedStyle(nav).display,
        };
        """
    )
    if not isinstance(state, dict):
        raise RuntimeError("Unable to inspect mobile geospatial layout state.")
    return state


def assert_mode(browser: object, expected: str) -> None:
    state = layout_state(browser)
    if state.get("view") != expected:
        raise RuntimeError(f"Unexpected mobile workspace state: {state}")
    shell = state.get("shell") or {}
    nav = state.get("nav") or {}
    if state.get("navDisplay") == "none" or float(nav.get("width") or 0) < 340:
        raise RuntimeError(f"Mobile workspace navigation is not usable: {state}")
    if float(shell.get("height") or 0) < 600:
        raise RuntimeError(f"Mobile geospatial canvas is unexpectedly short: {state}")

    if expected == "map":
        if state.get("controlsDisplay") != "none" or state.get("resultsDisplay") != "none":
            raise RuntimeError(f"Map-first mobile mode is obscured by a panel: {state}")
        if float((state.get("map") or {}).get("height") or 0) < 600:
            raise RuntimeError(f"Mobile map does not retain a usable canvas: {state}")
        return

    panel_key = "controls" if expected == "controls" else "results"
    hidden_key = "resultsDisplay" if expected == "controls" else "controlsDisplay"
    display_key = "controlsDisplay" if expected == "controls" else "resultsDisplay"
    panel = state.get(panel_key) or {}
    if state.get(display_key) == "none" or state.get(hidden_key) != "none":
        raise RuntimeError(f"Mobile {expected} visibility is incorrect: {state}")
    if float(panel.get("width") or 0) < 350 or float(panel.get("height") or 0) < 480:
        raise RuntimeError(f"Mobile {expected} panel is too small: {state}")
    if float(panel.get("bottom") or 0) > float(nav.get("top") or 0) + 2:
        raise RuntimeError(f"Mobile {expected} panel overlaps the bottom navigation: {state}")

    if expected == "controls":
        if float(state.get("rowOverflow") or 0) > 2 or float(state.get("actionsOverflow") or 0) > 2:
            raise RuntimeError(f"Compact entity controls overflow on mobile: {state}")
        actions = state.get("actions") or {}
        if float(actions.get("width") or 0) < 130:
            raise RuntimeError(f"Compact entity action area is too narrow on mobile: {state}")


def capture_mobile(browser: object, endpoint: str) -> None:
    geo.configure_gis(browser, endpoint)
    browser.set_viewport(390, 844, mobile=True)
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4[data-compact-entity-ui-ready='true']")
    browser.require("#geo4-map .leaflet-map-pane")
    wait_mobile_workspace(browser)
    browser.wait_for_text("#geo4-graph-status", "OSM 道路网络已加载", timeout=16)
    geo.wait_solved(browser, timeout=16)

    assert_mode(browser, "map")
    browser.screenshot("geospatial-map-mobile.png")

    browser.click('[data-geo4-mobile-view="controls"]')
    assert_mode(browser, "controls")
    if browser.execute("return document.querySelectorAll('#geo4-policy-list .geo4__policy-row').length") != 4:
        raise RuntimeError("Compact four-entity controls are not visible in mobile Controls mode.")
    browser.screenshot("geospatial-controls-mobile.png")

    browser.click('[data-geo4-mobile-view="results"]')
    assert_mode(browser, "results")
    if geo.read_text(browser, "#geo4-kpi-hubs") in {"", "—"}:
        raise RuntimeError("Mobile Results mode did not expose a fresh optimisation result.")
    if geo.read_text(browser, "#geo4-kpi-cost") in {"", "—"}:
        raise RuntimeError("Mobile Results mode did not expose scenario cost.")
    browser.screenshot("geospatial-results-mobile.png")

    browser.click('[data-geo4-mobile-view="map"]')
    assert_mode(browser, "map")
    geo.set_select(browser, "#geo4-layer", "risk")
    browser.wait_for_text(".geo4__layer-chip", "风险", timeout=5)
    browser.screenshot("geospatial-risk-layer-mobile.png")

    geo.set_select(browser, "#geo4-road-mode", "mixed")
    browser.wait_for_text(".geo4__scenario-ribbon", "混合路网事件", timeout=5)
    browser.wait_for_text(".geo4__freshness", "参数已变更", timeout=5)
    browser.screenshot("geospatial-mixed-event-mobile.png")


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before mobile verification.")
    geo.OUTPUT.mkdir(exist_ok=True)

    site_handler = partial(base.QuietHandler, directory=str(base.DIST))
    site_server = base.ThreadingHTTPServer(("127.0.0.1", 0), site_handler)
    site_port = site_server.server_address[1]
    site_thread = threading.Thread(target=site_server.serve_forever, daemon=True)
    site_thread.start()

    gis_server, _gis_thread, endpoint = geo.gis.start_fake_overpass()
    driver_port = 9541
    driver_base = f"http://127.0.0.1:{driver_port}"
    driver = subprocess.Popen(
        [base.find_chromedriver(), f"--port={driver_port}", "--allowed-ips=127.0.0.1"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    browser = None
    try:
        base.wait_for_driver(driver_base, driver)
        browser = base.BrowserSession(driver_base, f"http://127.0.0.1:{site_port}")
        capture_mobile(browser, endpoint)
    finally:
        if browser is not None:
            browser.close()
        driver.terminate()
        try:
            driver.wait(timeout=5)
        except subprocess.TimeoutExpired:
            driver.kill()
        site_server.shutdown()
        site_server.server_close()
        gis_server.shutdown()
        gis_server.server_close()

    expected_names = {
        "geospatial-map-mobile.png",
        "geospatial-controls-mobile.png",
        "geospatial-results-mobile.png",
        "geospatial-risk-layer-mobile.png",
        "geospatial-mixed-event-mobile.png",
    }
    missing = [name for name in expected_names if not (geo.OUTPUT / name).exists()]
    if missing:
        raise RuntimeError(f"Missing mobile geospatial visual proofs: {missing}")
    print(
        "Captured 5 compact-scene mobile geospatial proofs and passed Map / Controls / Results, entity-row overflow, risk-layer and mixed-road-event acceptance."
    )


if __name__ == "__main__":
    main()
