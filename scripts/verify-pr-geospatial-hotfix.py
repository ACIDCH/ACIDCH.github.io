from __future__ import annotations

import importlib.util
import math
import subprocess
import threading
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEO_SCRIPT = ROOT / "scripts" / "capture-pr-geospatial-visuals.py"
GIS_SCRIPT = ROOT / "scripts" / "geospatial-test-gis.py"

spec = importlib.util.spec_from_file_location("geo_visual_helpers", GEO_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load geospatial browser proof helpers.")
geo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(geo)
base = geo.base

gis_spec = importlib.util.spec_from_file_location("geospatial_test_gis_hotfix", GIS_SCRIPT)
if gis_spec is None or gis_spec.loader is None:
    raise RuntimeError("Unable to load deterministic GIS fixture server.")
gis = importlib.util.module_from_spec(gis_spec)
gis_spec.loader.exec_module(gis)


def configure_gis(browser: object, endpoint: str) -> None:
    geo.navigate_path(browser, "/")
    browser.execute(
        "localStorage.setItem('acidch-gis-endpoints', JSON.stringify({overpassPrimary:%r,overpassSecondary:%r}));"
        "sessionStorage.setItem('acidch-geo-v4-scene-index','0');return true;"
        % (endpoint, endpoint)
    )


def wait_solved(browser: object) -> None:
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=16)


def assert_hotfix(browser: object, endpoint: str) -> None:
    configure_gis(browser, endpoint)
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4")
    browser.wait_for_text("#geo4-graph-status", "OSM 道路网络已加载", timeout=16)
    wait_solved(browser)

    osm_label = browser.execute(
        "return document.querySelector('#geo4-engine option[value=\"osm\"]')?.textContent || '';"
    )
    if osm_label.strip() != "OSM 道路网络":
        raise RuntimeError(f"Unexpected Chinese OSM engine label: {osm_label!r}")
    if geo.read_value(browser, "#geo4-engine") != "osm":
        raise RuntimeError("OSM is not the active default engine.")
    if geo.read_text(browser, "#geo4-map-add") != "点击地图添加":
        raise RuntimeError("Map-click button wording regressed.")

    rows = browser.execute("return document.querySelectorAll('#geo4-policy-list .geo4__policy-row').length;")
    if rows != 4:
        raise RuntimeError(f"Expected compact four-entity scene, found {rows} entity rows.")

    network_classes = browser.execute(
        "return [...document.querySelectorAll('path.geo4-demand-node')].map(e=>e.getAttribute('class')||'');"
    )
    if any("is-covered" in value or "is-redundant" in value for value in network_classes):
        raise RuntimeError("Coverage state leaked into the default Network layer.")

    geo.set_select(browser, "#geo4-layer", "coverage")
    coverage_classes = browser.execute(
        "return [...document.querySelectorAll('path.geo4-demand-node')].map(e=>e.getAttribute('class')||'');"
    )
    if not any("is-covered" in value or "is-uncovered" in value for value in coverage_classes):
        raise RuntimeError("Coverage layer did not expose demand coverage state.")

    geo.set_select(browser, "#geo4-layer", "flow")
    flow_classes = browser.execute(
        "return [...document.querySelectorAll('path.geo4-demand-node')].map(e=>e.getAttribute('class')||'');"
    )
    if any("is-covered" in value or "is-redundant" in value for value in flow_classes):
        raise RuntimeError("Coverage state leaked into the Flow layer.")

    geo.set_select(browser, "#geo4-road-mode", "mixed")
    browser.wait_for_text(".geo4__freshness", "参数已变更", timeout=4)
    browser.click("#geo4-routes")
    browser.wait_for_text("#geo4-status", "请先重新运行优化", timeout=4)
    browser.click("#geo4-run")
    wait_solved(browser)

    # Fast OD remains a deliberate fallback, but two-echelon scenario-consistent
    # transshipment is explicitly OSM-only. Re-solve after changing the engine so
    # the stale-result guard does not mask the intended model-boundary assertion.
    geo.set_select(browser, "#geo4-engine", "od")
    browser.click("#geo4-run")
    wait_solved(browser)
    browser.click(".geo4__trans-run")
    browser.wait_for_text(".geo4__trans-status", "需要 OSM 道路网络", timeout=4)

    geo.set_select(browser, "#geo4-engine", "osm")
    browser.click("#geo4-run")
    wait_solved(browser)
    geo.set_select(browser, "#geo4-road-mode", "baseline")
    browser.click("#geo4-run")
    wait_solved(browser)

    # Load the solved OSM paths first, then build Fleet/TSP. The total flow in the
    # compact scene is read directly from the editable demand rows, so the test
    # remains valid across deterministic compact presets and catches any former
    # ~2x Flow duplication without hard-coding the old 9,600-demand fixture.
    browser.click("#geo4-routes")
    browser.wait_for_text("#geo4-status", "最优路径已加载", timeout=12)
    browser.click(".geo4__fleet-build")
    browser.wait_for_text(".geo4__fleet-status", "车队计划已生成", timeout=12)

    total_demand = float(
        browser.execute(
            "return [...document.querySelectorAll('[data-demand-edit]')].reduce((s,e)=>s+(Number(e.value)||0),0);"
        )
        or 0
    )
    vehicle_capacity = float(geo.read_value(browser, "#geo4-vehicle-capacity"))
    trips_per_vehicle = int(float(geo.read_value(browser, "#geo4-trips")))
    fleet_size = int(geo.read_text(browser, "#geo4-fleet-out"))
    demand_nodes = int(
        browser.execute("return document.querySelectorAll('[data-demand-edit]').length;") or 0
    )

    trips = int(geo.read_text(browser, "[data-fleet-trips]"))
    available = int(geo.read_text(browser, "[data-fleet-available]"))
    minimum = int(geo.read_text(browser, "[data-fleet-minimum]"))
    lower = max(1, math.ceil(total_demand / max(1, vehicle_capacity)))
    upper = lower + max(1, demand_nodes + 1)
    if not (lower <= trips <= upper):
        raise RuntimeError(
            f"Fleet trip count indicates duplicated or missing allocation flow: trips={trips}, expected {lower}–{upper} for demand={total_demand}."
        )
    if trips >= max(lower + 2, math.ceil(lower * 1.5)):
        raise RuntimeError(
            f"Fleet trips are too large relative to solved demand and may contain duplicate Flow metadata: {trips} vs lower bound {lower}."
        )
    expected_available = fleet_size * trips_per_vehicle
    if available != expected_available or trips > available:
        raise RuntimeError(
            f"Fleet feasibility outputs are inconsistent: trips={trips}, available={available}, expected_available={expected_available}."
        )
    if minimum != math.ceil(trips / max(1, trips_per_vehicle)):
        raise RuntimeError(
            f"Minimum-vehicle output is inconsistent with trip capacity: trips={trips}, minimum={minimum}."
        )


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before the hotfix browser verification.")

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = server.server_address[1]
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    gis_server, _gis_thread, endpoint = gis.start_fake_overpass()

    driver_port = 9531
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
        assert_hotfix(browser, endpoint)
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
        gis_server.shutdown()
        gis_server.server_close()

    print(
        "OSM-first geospatial browser verification passed: compact entities, coverage isolation, stale-result guards, OSM-only transshipment and non-duplicated Fleet/TSP trips are correct."
    )


if __name__ == "__main__":
    main()
