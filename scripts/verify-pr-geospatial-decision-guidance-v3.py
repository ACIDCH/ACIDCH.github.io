from __future__ import annotations

import importlib.util
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEO_SCRIPT = ROOT / "scripts" / "capture-pr-geospatial-visuals.py"
GIS_SCRIPT = ROOT / "scripts" / "geospatial-test-gis.py"

spec = importlib.util.spec_from_file_location("geo_visual_helpers", GEO_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load geospatial browser-proof helpers.")
geo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(geo)
base = geo.base

gis_spec = importlib.util.spec_from_file_location("geospatial_test_gis", GIS_SCRIPT)
if gis_spec is None or gis_spec.loader is None:
    raise RuntimeError("Unable to load deterministic GIS fixture server.")
gis = importlib.util.module_from_spec(gis_spec)
gis_spec.loader.exec_module(gis)


def wait_text_contains(browser: object, selector: str, needle: str, timeout: float = 12) -> str:
    deadline = time.time() + timeout
    last = ""
    while time.time() < deadline:
        last = geo.read_text(browser, selector)
        if needle in last:
            return last
        time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for {needle!r} at {selector}: {last!r}")


def fleet_state(browser: object) -> str:
    value = browser.execute(
        "return document.querySelector('#geo-v4')?.dataset.fleetPlanState || '';"
    )
    return value if isinstance(value, str) else ""


def assert_guidance_chain(browser: object, endpoint: str) -> None:
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
    geo.configure_gis(browser, endpoint)
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4[data-decision-guidance-v3-ready='true']")
    browser.require(".geo4__next-action")
    browser.wait_for_text("#geo4-graph-status", "OSM 道路网络已加载", timeout=16)
    geo.wait_solved(browser)

    initial_guidance = wait_text_contains(
        browser, ".geo4__next-action", "可直接生成车队路线", timeout=8
    )
    if "加载最优路径" not in initial_guidance:
        raise RuntimeError(
            "Decision guidance did not explain that optimal-path loading is presentation-only."
        )

    if browser.execute("return document.querySelectorAll('.geo4__optimal-route').length;") != 0:
        raise RuntimeError("Optimal road paths were unexpectedly loaded before the Route action.")

    browser.click("#geo4-routes")
    route_state = geo.wait_optimal_routes(browser)
    if route_state.get("reducedMotion") is not True:
        raise RuntimeError(f"Reduced-motion emulation was not active: {route_state}")
    if route_state.get("animationEnabled") is not False:
        raise RuntimeError(
            f"Route animation remained enabled under reduced motion: {route_state}"
        )
    browser.click("#geo4-routes")
    repeated_route_state = geo.wait_optimal_routes(browser)
    if repeated_route_state.get("viewportAction") != "preserve":
        raise RuntimeError(
            f"A second optimal-route load did not preserve an already safe map viewport: {repeated_route_state}"
        )

    browser.click("#geo4-run")
    geo.wait_solved(browser)
    if browser.execute("return document.querySelectorAll('.geo4__optimal-route').length;") != 0:
        raise RuntimeError("Running the main optimisation did not clear old optimal paths.")

    browser.click(".geo4__fleet-build")
    wait_text_contains(browser, ".geo4__fleet-status", "车队计划已生成", timeout=12)
    if fleet_state(browser) != "ready":
        raise RuntimeError(f"Baseline Fleet/TSP did not settle in ready state: {fleet_state(browser)!r}")
    if browser.execute("return document.querySelectorAll('.geo4__optimal-route').length;") != 0:
        raise RuntimeError(
            "Fleet/TSP incorrectly required or created the optional main optimal-path presentation layer."
        )
    wait_text_contains(browser, ".geo4__next-action", "Monte Carlo", timeout=6)

    browser.execute(
        "const e=document.querySelector('#geo4-enforce-fleet');"
        "e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));return true;"
    )
    browser.execute(
        "const minus=document.querySelector('[data-step=\"fleet\"][data-delta=\"-1\"]');"
        "for(let i=0;i<40;i+=1){if(Number(document.querySelector('#geo4-fleet-out')?.textContent||0)<=0)break;minus?.click();}"
        "return document.querySelector('#geo4-fleet-out')?.textContent || '';"
    )
    if geo.read_text(browser, "#geo4-fleet-out") != "0":
        raise RuntimeError("Unable to reduce the fleet count to zero for the shortfall scenario.")

    browser.click("#geo4-run")
    geo.wait_solved(browser)
    wait_text_contains(browser, ".geo4__next-action", "可直接生成车队路线", timeout=6)
    browser.click(".geo4__fleet-build")
    wait_text_contains(browser, ".geo4__fleet-status", "运力不足", timeout=12)
    if fleet_state(browser) != "capacity-shortfall":
        raise RuntimeError(
            f"Fleet shortfall was not classified explicitly: {fleet_state(browser)!r}"
        )
    wait_text_contains(browser, ".geo4__next-action", "运力不足", timeout=6)

    geo.set_input(browser, "#geo4-demand-multiplier", "1.10")
    geo.wait_dataset(browser, "resultFreshness", "stale", timeout=6)
    wait_text_contains(browser, ".geo4__next-action", "运行优化", timeout=6)
    simulate_disabled = browser.execute(
        "return Boolean(document.querySelector('#geo4-simulate')?.disabled);"
    )
    if not simulate_disabled:
        raise RuntimeError("Monte Carlo remained enabled after the main decision inputs became stale.")

    browser.screenshot("geospatial-guidance-v3.png")


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before browser verification.")
    geo.OUTPUT.mkdir(exist_ok=True)

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    site_server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = site_server.server_address[1]
    site_thread = threading.Thread(target=site_server.serve_forever, daemon=True)
    site_thread.start()

    gis_server, _gis_thread, endpoint = gis.start_fake_overpass()
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
        browser.set_viewport(1440, 1000, mobile=False)
        assert_guidance_chain(browser, endpoint)
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

    print(
        "Geospatial decision-guidance v3 browser verification passed: all default routes are non-degenerate and synchronised with the flow panel under reduced motion, a repeated route load preserves an already safe viewport, Fleet/TSP runs directly from the current allocation, capacity shortfall is explicit, stale decision inputs redirect the workflow back to Run, and Monte Carlo is blocked until the main result is current."
    )


if __name__ == "__main__":
    main()
