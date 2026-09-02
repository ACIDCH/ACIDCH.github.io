from __future__ import annotations

import importlib.util
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEO_SCRIPT = ROOT / "scripts" / "capture-pr-geospatial-visuals.py"

spec = importlib.util.spec_from_file_location("geo_route_helpers", GEO_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load geospatial browser-proof helpers.")
geo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(geo)
base = geo.base


def emulate_reduced_motion(browser: object) -> None:
    base.request_json(
        "POST",
        f"{browser.session_base}/goog/cdp/execute",
        {
            "cmd": "Emulation.setEmulatedMedia",
            "params": {
                "features": [{"name": "prefers-reduced-motion", "value": "reduce"}]
            },
        },
    )


def assert_route_state(browser: object, *, expect_preserved: bool = False) -> dict[str, object]:
    state = geo.wait_optimal_routes(browser, timeout=25)
    if state.get("reducedMotion") is not True or state.get("animationEnabled") is not False:
        raise RuntimeError(f"Reduced-motion route state is incorrect: {state}")
    if expect_preserved and state.get("viewportAction") != "preserve":
        raise RuntimeError(f"An already safe route viewport was not preserved: {state}")
    return state


def wait_mobile_map(browser: object, timeout: float = 12) -> None:
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = browser.execute(
            r"""
            const root = document.querySelector('#geo-v4');
            const shell = root?.querySelector('.geo4__shell');
            const map = document.querySelector('#geo4-map');
            const controls = root?.querySelector('.geo4__console');
            const results = root?.querySelector('.geo4__results');
            const nav = root?.querySelector('.geo4__mobile-nav');
            const mapRect = map?.getBoundingClientRect();
            const navRect = nav?.getBoundingClientRect();
            return {
              ready: root?.dataset.mobileWorkspaceReady || '',
              view: shell?.dataset.mobileView || '',
              controlsDisplay: controls ? getComputedStyle(controls).display : '',
              resultsDisplay: results ? getComputedStyle(results).display : '',
              mapHeight: mapRect?.height || 0,
              navWidth: navRect?.width || 0,
            };
            """
        )
        if (
            isinstance(last, dict)
            and last.get("ready") == "true"
            and last.get("view") == "map"
            and last.get("controlsDisplay") == "none"
            and last.get("resultsDisplay") == "none"
            and float(last.get("mapHeight") or 0) >= 600
            and float(last.get("navWidth") or 0) >= 340
        ):
            return
        time.sleep(0.2)
    raise RuntimeError(f"Mobile route map did not become usable: {last}")


def verify_routes(browser: object) -> None:
    browser.set_viewport(1440, 1000, mobile=False)
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo4-map .leaflet-map-pane")
    geo.wait_solved(browser, timeout=50)
    if browser.execute("return document.querySelectorAll('.geo4__optimal-route').length;") != 0:
        raise RuntimeError("Optimal routes were present before the route action.")

    browser.click("#geo4-routes")
    assert_route_state(browser)
    browser.click("#geo4-routes")
    assert_route_state(browser, expect_preserved=True)
    browser.screenshot("geospatial-route-rendering-desktop.png")

    browser.set_viewport(390, 844, mobile=True)
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo4-map .leaflet-map-pane")
    wait_mobile_map(browser)
    geo.wait_solved(browser, timeout=50)
    browser.click("#geo4-routes")
    assert_route_state(browser)
    wait_mobile_map(browser)
    browser.screenshot("geospatial-route-rendering-mobile.png")


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before browser verification.")
    geo.OUTPUT.mkdir(exist_ok=True)

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = server.server_address[1]
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    driver_port = 9544
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
        emulate_reduced_motion(browser)
        verify_routes(browser)
    finally:
        if browser is not None:
            browser.close()
        driver.terminate()
        try:
            driver.wait(timeout=5)
        except subprocess.TimeoutExpired:
            driver.kill()
        server.shutdown()
        server.server_close()

    print(
        "Geospatial route-rendering browser verification passed: desktop and mobile routes match solver allocations, contain no M0 0 geometry, remain outside overlay occlusion, synchronise with route-flow totals, preserve an already safe viewport and stay static under reduced motion."
    )


if __name__ == "__main__":
    main()
