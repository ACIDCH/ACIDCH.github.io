from __future__ import annotations

import importlib.util
import math
import subprocess
import threading
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


def execute_fetch_stub(browser: object) -> None:
    browser.execute(
        r"""
        const original = globalThis.fetch;
        globalThis.fetch = async (input, init = {}) => {
          const url = typeof input === 'string' ? input : input?.url || '';
          if (url.includes('router.project-osrm.org/route/v1/driving/')) {
            const raw = decodeURIComponent(url.split('/driving/')[1].split('?')[0]);
            const coords = raw.split(';').map(pair => pair.split(',').map(Number));
            let distance = 0;
            for (let i = 1; i < coords.length; i += 1) {
              const dx = coords[i][0] - coords[i - 1][0];
              const dy = coords[i][1] - coords[i - 1][1];
              distance += Math.sqrt(dx * dx + dy * dy) * 85000;
            }
            return new Response(JSON.stringify({
              routes: [{
                geometry: { type: 'LineString', coordinates: coords },
                distance: Math.max(500, distance),
                duration: Math.max(180, distance / 11),
              }],
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (url.includes('router.project-osrm.org/table/v1/driving/')) {
            const raw = decodeURIComponent(url.split('/driving/')[1].split('?')[0]);
            const coords = raw.split(';');
            const n = coords.length;
            const durations = Array.from({length:n}, (_, i) =>
              Array.from({length:n}, (_, j) => i === j ? 0 : 240 + Math.abs(i-j) * 75));
            const distances = durations.map(row => row.map(value => value * 11));
            return new Response(JSON.stringify({ durations, distances }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return original(input, init);
        };
        return true;
        """
    )


def assert_hotfix(browser: object, endpoint: str) -> None:
    geo.configure_gis(browser, endpoint)
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4[data-compact-entity-ui-ready='true']")
    browser.require("#geo4-map .leaflet-map-pane")
    execute_fetch_stub(browser)

    browser.wait_for_text("#geo4-graph-status", "OSM 道路网络已加载", timeout=16)
    geo.wait_solved(browser, timeout=16)

    if browser.execute("return document.querySelector('#geo4-engine')?.value") != "osm":
        raise RuntimeError("OSM Road Network is not the default engine in the hotfix gate.")
    entity_count = browser.execute(
        "return document.querySelectorAll('#geo4-policy-list .geo4__policy-row').length;"
    )
    if entity_count != 22:
        raise RuntimeError(f"Expected 22 model-backed initial entities, found {entity_count}.")

    osm_label = browser.execute(
        "return document.querySelector('#geo4-engine option[value=\"osm\"]')?.textContent || '';"
    )
    if osm_label.strip() != "OSM 道路网络":
        raise RuntimeError(f"Unexpected Chinese OSM engine label: {osm_label!r}")

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
    geo.wait_solved(browser, timeout=12)
    geo.set_select(browser, "#geo4-road-mode", "baseline")
    browser.click("#geo4-run")
    geo.wait_solved(browser, timeout=12)

    # Fast OD remains a valid fallback, while the two-echelon road-scenario
    # planner must still refuse to present OD values as an active OSM graph.
    geo.set_select(browser, "#geo4-engine", "od")
    browser.click("#geo4-run")
    geo.wait_solved(browser, timeout=12)
    browser.click(".geo4__trans-run")
    browser.wait_for_text(".geo4__trans-status", "需要 OSM 道路网络", timeout=4)

    geo.set_select(browser, "#geo4-engine", "osm")
    browser.click("#geo4-run")
    geo.wait_solved(browser, timeout=12)
    if browser.execute("return document.querySelector('#geo4-routes')?.disabled") is True:
        raise RuntimeError("Route loading remained disabled after a feasible OSM solve.")
    if browser.execute("return document.querySelector('.geo4__fleet-build')?.disabled") is True:
        raise RuntimeError("Fleet/TSP planning remained disabled after a feasible OSM solve.")

    browser.click("#geo4-routes")
    browser.wait_for_text("#geo4-status", "最优路径已加载", timeout=12)
    browser.click(".geo4__fleet-build")
    browser.wait_for_text(".geo4__fleet-status", "车队计划已生成", timeout=12)

    trips = int(geo.read_text(browser, "[data-fleet-trips]"))
    available = int(geo.read_text(browser, "[data-fleet-available]"))
    minimum = int(geo.read_text(browser, "[data-fleet-minimum]"))
    scene = browser.execute(
        "return {demands:[...document.querySelectorAll('[data-demand-edit]')].map(e=>Number(e.value)||0),mult:Number(document.querySelector('#geo4-demand-multiplier')?.value)||1,capacity:Number(document.querySelector('#geo4-vehicle-capacity')?.value)||1,hubs:Number(document.querySelector('#geo4-kpi-hubs')?.textContent)||1,fleet:Number(document.querySelector('#geo4-fleet-out')?.textContent)||0,tripsPer:Number(document.querySelector('#geo4-trips')?.value)||0};"
    )
    if not isinstance(scene, dict) or not isinstance(scene.get("demands"), list):
        raise RuntimeError(f"Unable to derive compact-scene fleet expectation: {scene!r}")
    total_flow = sum(float(value) for value in scene["demands"]) * float(scene["mult"])
    vehicle_capacity = max(1.0, float(scene["capacity"]))
    selected_hubs = max(1, int(scene["hubs"]))
    expected_min = math.ceil(total_flow / vehicle_capacity)
    # Trips are split independently by hub. Rounding each hub load can add at
    # most one extra trip per additional selected hub.
    expected_max = expected_min + selected_hubs - 1
    if not (expected_min <= trips <= expected_max):
        raise RuntimeError(
            "Fleet trip count indicates duplicated or missing solved allocation flow: "
            f"trips={trips}, expected={expected_min}–{expected_max}, "
            f"total_flow={total_flow:g}, capacity={vehicle_capacity:g}, hubs={selected_hubs}."
        )
    expected_available = int(scene["fleet"]) * int(scene["tripsPer"])
    if available != expected_available or trips > available or minimum > int(scene["fleet"]):
        raise RuntimeError(
            f"Fleet feasibility outputs are inconsistent: trips={trips}, available={available}, "
            f"expected_available={expected_available}, minimum={minimum}, fleet={scene['fleet']}."
        )


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before the hotfix browser verification.")

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = server.server_address[1]
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    gis_server, _gis_thread, endpoint = geo.gis.start_fake_overpass()
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
        "Post-release geospatial browser verification passed: compact OSM-first solving, coverage isolation, stale-result guards, OSM-only transshipment, enabled Route/Fleet actions and model-scaled non-duplicated fleet trips are correct."
    )


if __name__ == "__main__":
    main()
