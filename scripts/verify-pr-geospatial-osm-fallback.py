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


def wait_value(browser: object, script: str, expected: object, timeout: float = 10) -> object:
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = browser.execute(script)
        if last == expected:
            return last
        time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for {expected!r}; last value was {last!r}.")


def wait_nonblank(browser: object, selector: str, timeout: float = 10) -> str:
    deadline = time.time() + timeout
    last = ""
    while time.time() < deadline:
        last = geo.read_text(browser, selector)
        if last not in {"", "—"}:
            return last
        time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for a populated value at {selector}: {last!r}")


def assert_osm_failure_fallback(browser: object) -> None:
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    geo.wait_leaflet(browser)
    browser.require("#geo-v4[data-usability-refinement-ready='true']")
    browser.require("#geo-v4[data-leaflet-source='bundle']")

    if browser.execute("return document.querySelector('#geo4-engine')?.value") != "osm":
        raise RuntimeError("OSM is not selected before failure-recovery test.")
    wait_value(
        browser,
        "return document.querySelector('#geo-v4')?.dataset.resultFreshness || '';",
        "stale",
        timeout=5,
    )
    browser.wait_for_text(".geo4__freshness", "默认 OSM 情景已就绪", timeout=5)

    browser.execute(
        r"""
        const original=globalThis.fetch;
        globalThis.fetch=async(input,init={})=>{
          const url=typeof input==='string'?input:(input?.url||'');
          const method=String(init?.method||'GET').toUpperCase();
          if(/overpass|api\/interpreter/i.test(url) && method==='POST'){
            return new Response(JSON.stringify({remark:'synthetic outage'}),{
              status:503,headers:{'content-type':'application/json'}
            });
          }
          return original.call(globalThis,input,init);
        };
        return true;
        """
    )

    browser.click("#geo4-run")
    wait_value(
        browser,
        "return document.querySelector('#geo4-engine')?.value || '';",
        "od",
        timeout=10,
    )
    wait_value(
        browser,
        "return document.querySelector('#geo-v4')?.dataset.resultFreshness || '';",
        "fresh",
        timeout=10,
    )
    hubs = wait_nonblank(browser, "#geo4-kpi-hubs", timeout=10)
    cost = wait_nonblank(browser, "#geo4-kpi-cost", timeout=10)
    status = geo.read_text(browser, "#geo4-status")
    graph_status = geo.read_text(browser, "#geo4-graph-status")

    if "快速 OD" not in status and "Fast OD" not in status:
        raise RuntimeError(f"Fallback solve did not surface its recovery mode: {status!r}")
    if "OD" not in graph_status:
        raise RuntimeError(f"Graph status did not record Fast OD recovery: {graph_status!r}")
    if hubs in {"", "—"} or cost in {"", "—"}:
        raise RuntimeError(
            f"Fast OD fallback did not produce a usable optimisation result: hubs={hubs!r}, cost={cost!r}"
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
        "OSM failure recovery browser verification passed: bundled Leaflet starts locally, the default OSM result is stale before execution, and Fast OD solves automatically after a synthetic Overpass outage."
    )


if __name__ == "__main__":
    main()
