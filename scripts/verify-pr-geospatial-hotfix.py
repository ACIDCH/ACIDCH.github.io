from __future__ import annotations

import importlib.util
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


def assert_hotfix(browser: object) -> None:
    geo.prime_geospatial_document(browser)
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    geo.wait_leaflet(browser)
    browser.require("#geo-v4[data-usability-refinement-ready='true']")
    browser.require("#geo4-map .leaflet-map-pane")
    execute_fetch_stub(browser)

    if browser.execute("return document.querySelector('#geo4-engine')?.value") != "osm":
        raise RuntimeError("OSM Road Network is not the default engine in the hotfix gate.")

    browser.click("#geo4-run")
    browser.wait_for_text("#geo4-graph-status", "nodes /", timeout=12)
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)

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
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    geo.set_select(browser, "#geo4-road-mode", "baseline")
    browser.click("#geo4-run")
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)

    # Fast OD remains a valid fallback, while the two-echelon road-scenario
    # planner must still refuse to present OD values as an active OSM graph.
    geo.set_select(browser, "#geo4-engine", "od")
    browser.click("#geo4-run")
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    browser.click(".geo4__trans-run")
    browser.wait_for_text(".geo4__trans-status", "需要 OSM 道路网络", timeout=4)

    geo.set_select(browser, "#geo4-engine", "osm")
    browser.click("#geo4-run")
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    browser.click("#geo4-routes")
    browser.wait_for_text("#geo4-status", "最优路径已加载", timeout=12)
    browser.click(".geo4__fleet-build")
    browser.wait_for_text(".geo4__fleet-status", "车队计划已生成", timeout=12)

    trips = int(geo.read_text(browser, "[data-fleet-trips]"))
    available = int(geo.read_text(browser, "[data-fleet-available]"))
    minimum = int(geo.read_text(browser, "[data-fleet-minimum]"))
    if not (80 <= trips <= 82):
        raise RuntimeError(
            f"Fleet trip count indicates duplicated or missing allocation flow: trips={trips}, expected 80–82."
        )
    if available != 100 or trips > available or minimum > 20:
        raise RuntimeError(
            f"Fleet feasibility outputs are inconsistent: trips={trips}, available={available}, minimum={minimum}."
        )


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before the hotfix browser verification.")

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = server.server_address[1]
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

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
        assert_hotfix(browser)
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
        "Post-release geospatial browser verification passed: OSM-first solving, coverage isolation, stale-result guards, OSM-only transshipment and non-duplicated fleet trips are correct."
    )


if __name__ == "__main__":
    main()
