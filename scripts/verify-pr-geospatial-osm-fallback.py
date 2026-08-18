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


def assert_osm_failure_fallback(browser: object) -> None:
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    geo.seed_cached_coordinates(browser)
    geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4[data-usability-refinement-ready='true']")
    if browser.execute("return document.querySelector('#geo4-engine')?.value") != "osm":
        raise RuntimeError("OSM is not selected before failure-recovery test.")

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
    browser.wait_for_text("#geo4-graph-status", "已切换至快速 OD 网络", timeout=8)
    browser.wait_for_text("#geo4-status", "快速 OD 网络完成优化", timeout=8)
    engine = browser.execute("return document.querySelector('#geo4-engine')?.value")
    hubs = geo.read_text(browser, "#geo4-kpi-hubs")
    if engine != "od":
        raise RuntimeError(f"OSM outage did not switch to Fast OD: engine={engine!r}")
    if hubs in {"", "—"}:
        raise RuntimeError("Fast OD fallback did not produce a fresh optimisation result.")


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

    print("OSM failure recovery browser verification passed: Fast OD solves automatically after an Overpass outage.")


if __name__ == "__main__":
    main()
