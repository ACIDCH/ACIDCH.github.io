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


def wait_value(browser: object, script: str, expected: object, timeout: float = 12) -> object:
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = browser.execute(script)
        if last == expected:
            return last
        time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for {expected!r}; last value was {last!r}.")


def wait_nonblank(browser: object, selector: str, timeout: float = 12) -> str:
    deadline = time.time() + timeout
    last = ""
    while time.time() < deadline:
        last = geo.read_text(browser, selector)
        if last not in {"", "—"}:
            return last
        time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for a populated value at {selector}: {last!r}")


def assert_osm_failure_fallback(browser: object) -> None:
    # A localhost endpoint makes the test deterministic and allows the normal
    # compact-scene boot path to attempt OSM immediately. Port 9 is intentionally
    # unreachable, so both configured Overpass attempts fail without contacting
    # a public service.
    geo.configure_gis(browser, "http://127.0.0.1:9/api/interpreter")
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4[data-compact-entity-ui-ready='true']")
    browser.require("#geo-v4[data-leaflet-source='bundle']")
    browser.require("#geo4-map .leaflet-map-pane")
    browser.wait_for_text("#geo4-graph-status", "基础网络已就绪", timeout=20)
    browser.click("#geo4-load-graph")
    browser.wait_for_text(
        "#geo4-graph-status",
        "在线 OSM 路网不可用；继续使用内置 Auckland 基线路网。",
        timeout=20,
    )

    wait_value(
        browser,
        "return document.querySelector('#geo4-engine')?.value || '';",
        "osm",
        timeout=12,
    )
    wait_value(
        browser,
        "return document.querySelector('#geo-v4')?.dataset.resultFreshness || '';",
        "fresh",
        timeout=12,
    )

    entity_count = browser.execute(
        "return document.querySelectorAll('#geo4-policy-list .geo4__policy-row').length;"
    )
    if entity_count != 22:
        raise RuntimeError(
            f"Fast OD recovery did not preserve the compact four-entity scene: {entity_count}"
        )

    hubs = wait_nonblank(browser, "#geo4-kpi-hubs", timeout=12)
    cost = wait_nonblank(browser, "#geo4-kpi-cost", timeout=12)
    status = geo.read_text(browser, "#geo4-status")
    graph_status = geo.read_text(browser, "#geo4-graph-status")

    if "内置 Auckland 基线路网" not in graph_status and "built-in Auckland baseline graph" not in graph_status:
        raise RuntimeError(
            f"Graph status did not retain the built-in Auckland baseline graph: {graph_status!r}"
        )
    recovery = browser.execute(
        "return document.querySelector('#geo-v4')?.dataset.networkRecovery || '';"
    )
    if recovery == "fast-od":
        raise RuntimeError(
            "A live Overpass outage incorrectly discarded the available Auckland baseline graph."
        )
    if "重新优化" not in status and "re-optimised" not in status:
        raise RuntimeError(f"Fallback result did not settle on a solved state: {status!r}")
    if hubs in {"", "—"} or cost in {"", "—"}:
        raise RuntimeError(
            f"Baseline-graph fallback did not produce a usable optimisation result: hubs={hubs!r}, cost={cost!r}"
        )


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before browser verification.")

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = server.server_address[1]
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    driver_port = 9537
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
        assert_osm_failure_fallback(browser)
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
        "OSM failure recovery browser verification passed: bundled Leaflet starts locally, a deterministic Overpass outage retains the built-in Auckland road graph, and the baseline graph produces fresh solved KPIs without an unnecessary Fast OD downgrade."
    )


if __name__ == "__main__":
    main()
