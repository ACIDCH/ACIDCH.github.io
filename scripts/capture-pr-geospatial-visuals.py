from __future__ import annotations

import importlib.util
import json
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts" / "capture-pr-sql-visuals.py"
OUTPUT = ROOT / "geospatial-proofs"

spec = importlib.util.spec_from_file_location("sql_visual_helpers", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load shared browser proof helpers.")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.OUTPUT = OUTPUT


class GeospatialBrowserSession(base.BrowserSession):
    """Chrome session tuned for the locally bundled geospatial runtime."""

    def __init__(self, driver_base: str, site_base: str) -> None:
        self.site_base = site_base
        payload = {
            "capabilities": {
                "alwaysMatch": {
                    "browserName": "chrome",
                    "pageLoadStrategy": "eager",
                    "goog:chromeOptions": {
                        "args": [
                            "--headless=new",
                            "--no-sandbox",
                            "--disable-gpu",
                            "--disable-dev-shm-usage",
                            "--disable-background-networking",
                            "--disable-extensions",
                            "--no-first-run",
                            "--no-default-browser-check",
                            "--disable-features=Translate,MediaRouter,OptimizationHints",
                            "--window-size=1440,1000",
                        ]
                    },
                }
            }
        }
        session_id = None
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                response = base.request_json(
                    "POST", f"{driver_base}/session", payload, timeout=40
                )
                value = response.get("value")
                if isinstance(value, dict) and isinstance(value.get("sessionId"), str):
                    session_id = value["sessionId"]
                    break
                last_error = RuntimeError(
                    f"Unexpected ChromeDriver session response: {response}"
                )
            except Exception as error:
                last_error = error
                deadline = time.time() + 8
                while time.time() < deadline and session_id is None:
                    session_id = base.recover_session(driver_base)
                    if session_id is None:
                        time.sleep(0.5)
                if session_id is not None:
                    break
            if attempt == 0:
                time.sleep(1.0)
        if session_id is None:
            raise RuntimeError(
                f"Geospatial ChromeDriver session did not start after bounded recovery: {last_error}"
            )
        self.session_id = session_id
        self.session_base = f"{driver_base}/session/{session_id}"
        self.set_viewport(1440, 1000, mobile=False)


# verify-pr-geospatial-hotfix.py imports this module and then reuses geo.base.
# Expose the same eager session so all geospatial browser gates share one runtime policy.
base.BrowserSession = GeospatialBrowserSession


def navigate_path(browser: object, path: str) -> None:
    target = f"{browser.site_base}{path}"
    requires_geo_root = "/lab/geospatial-supply-chain/" in path
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            base.request_json(
                "POST",
                f"{browser.session_base}/url",
                {"url": target},
                timeout=12,
            )
        except Exception as error:
            last_error = error

        deadline = time.time() + 18
        while time.time() < deadline:
            try:
                state = browser.execute(
                    "return {ready:document.readyState,path:location.pathname,root:Boolean(document.querySelector('#geo-v4'))};"
                )
            except Exception as error:
                last_error = error
                time.sleep(0.2)
                continue
            if not isinstance(state, dict) or state.get("path") != path:
                time.sleep(0.15)
                continue
            if requires_geo_root:
                if state.get("root") is True and state.get("ready") in {"interactive", "complete"}:
                    time.sleep(0.35)
                    return
            elif state.get("ready") in {"interactive", "complete"}:
                time.sleep(0.35)
                return
            time.sleep(0.15)

        time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"Unable to navigate geospatial proof browser to {target}: {last_error}")


def wait_leaflet(browser: object, timeout: float = 20) -> None:
    deadline = time.time() + timeout
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            state = browser.execute(
                "return {ready:Boolean(globalThis.L && document.querySelector('#geo4-map .leaflet-map-pane')),leafletState:document.querySelector('#geo-v4')?.dataset.leafletState||'',source:document.querySelector('#geo-v4')?.dataset.leafletSource||''};"
            )
            if isinstance(state, dict) and state.get("ready") is True:
                if state.get("source") != "bundle":
                    raise RuntimeError(f"Leaflet did not start from the local bundle: {state}")
                return
        except Exception as error:
            last_error = error
        time.sleep(0.25)
    try:
        state = browser.execute(
            "return {leaflet:Boolean(globalThis.L),page:document.readyState,leafletState:document.querySelector('#geo-v4')?.dataset.leafletState||'',source:document.querySelector('#geo-v4')?.dataset.leafletSource||''};"
        )
    except Exception as error:
        state = {"executeError": repr(error), "priorError": repr(last_error)}
    raise RuntimeError(f"Leaflet did not become ready within the browser budget: {state}")


def set_select(browser: object, selector: str, value: str) -> None:
    browser.require(selector)
    browser.execute(
        "const e=document.querySelector(%r);e.value=%r;e.dispatchEvent(new Event('change',{bubbles:true}));"
        % (selector, value)
    )
    time.sleep(0.25)


def read_text(browser: object, selector: str) -> str:
    browser.require(selector)
    value = browser.execute(
        "return (document.querySelector(%r)?.textContent || '').trim();" % selector
    )
    if not isinstance(value, str):
        raise RuntimeError(f"Unable to read text from {selector}.")
    return value


def prime_geospatial_document(browser: object) -> None:
    hubs = [
        {"lat": -36.855, "lon": 174.746, "label": "Ponsonby"},
        {"lat": -36.866, "lon": 174.735, "label": "Grey Lynn"},
        {"lat": -36.892, "lon": 174.777, "label": "Greenlane"},
        {"lat": -36.846, "lon": 174.776, "label": "CBD East"},
        {"lat": -36.858, "lon": 174.812, "label": "Orakei"},
        {"lat": -36.918, "lon": 174.789, "label": "Onehunga"},
    ]
    demands = [
        {"lat": -36.848, "lon": 174.763, "label": "CBD"},
        {"lat": -36.886, "lon": 174.775, "label": "Epsom"},
        {"lat": -36.862, "lon": 174.735, "label": "Grey Lynn"},
        {"lat": -36.878, "lon": 174.761, "label": "Mount Eden"},
        {"lat": -36.869, "lon": 174.778, "label": "Newmarket"},
        {"lat": -36.922, "lon": 174.786, "label": "Onehunga"},
        {"lat": -36.857, "lon": 174.810, "label": "Orakei"},
        {"lat": -36.856, "lon": 174.744, "label": "Ponsonby"},
        {"lat": -36.881, "lon": 174.798, "label": "Remuera"},
        {"lat": -36.906, "lon": 174.755, "label": "Three Kings"},
    ]
    coords_json = json.dumps({"hubs": hubs, "demands": demands})
    source = r"""
      try {
        localStorage.setItem('acidch-geo-v4-base-coords', %s);
      } catch {}
      if (!globalThis.__geoProofFetchInstalled && typeof globalThis.fetch === 'function') {
        globalThis.__geoProofFetchInstalled = true;
        const prior = globalThis.fetch.bind(globalThis);
        const nodes=[]; const ways=[]; let id=1;
        const rows=11, cols=11, lat0=-36.935, lon0=174.700, dLat=.014, dLon=.017;
        const grid=[];
        for(let r=0;r<rows;r++){
          grid[r]=[];
          for(let c=0;c<cols;c++){
            const nodeId=id++;
            grid[r][c]=nodeId;
            nodes.push({type:'node',id:nodeId,lat:lat0+r*dLat,lon:lon0+c*dLon});
          }
        }
        let wayId=10000;
        for(let r=0;r<rows;r++) ways.push({type:'way',id:wayId++,nodes:grid[r],tags:{highway:'secondary',maxspeed:'50'}});
        for(let c=0;c<cols;c++) ways.push({type:'way',id:wayId++,nodes:grid.map(row=>row[c]),tags:{highway:'secondary',maxspeed:'50'}});
        const overpassBody=JSON.stringify({elements:[...nodes,...ways]});
        globalThis.fetch=async(input,init={})=>{
          const url=typeof input==='string'?input:(input?.url||'');
          if(/overpass|api\/interpreter/i.test(url) && String(init?.method||'GET').toUpperCase()==='POST'){
            return new Response(overpassBody,{status:200,headers:{'content-type':'application/json'}});
          }
          return prior(input,init);
        };
      }
    """ % json.dumps(coords_json)
    base.request_json(
        "POST",
        f"{browser.session_base}/goog/cdp/execute",
        {
            "cmd": "Page.addScriptToEvaluateOnNewDocument",
            "params": {"source": source},
        },
        timeout=8,
    )


def assert_services_idle(browser: object) -> None:
    states = browser.execute(
        "return Object.fromEntries([...document.querySelectorAll('.geo4__service-chip')].map(e=>[e.dataset.service,e.dataset.state]));"
    )
    expected = {"nominatim": "idle", "osrm": "idle", "overpass": "idle"}
    if states != expected:
        raise RuntimeError(f"GIS services must remain idle before a user action: {states}")


def assert_refined_ui(browser: object) -> None:
    browser.require("#geo-v4[data-usability-refinement-ready='true']")
    if browser.execute("return document.querySelector('#geo4-engine')?.value") != "osm":
        raise RuntimeError("OSM Road Network is not the default engine.")
    if read_text(browser, "#geo4-threshold-out") != "30 min":
        raise RuntimeError("OSM-first threshold did not initialise to 30 min.")
    if read_text(browser, "#geo4-facility-count") != "4/6":
        raise RuntimeError(
            f"Expected compact 4/6 facility preset, got {read_text(browser, '#geo4-facility-count')!r}."
        )
    if read_text(browser, "#geo4-map-add") != "点击地图添加":
        raise RuntimeError("Chinese map-add button label was not simplified.")
    merged = browser.execute(
        "return document.querySelector('#geo4-address')?.closest('.geo4__block')===document.querySelector('#geo4-policy-list')?.closest('.geo4__block');"
    )
    if merged is not True:
        raise RuntimeError("Facility and network-entity controls were not merged.")
    toggles = browser.execute("return document.querySelectorAll('.geo4__entity-toggle').length")
    if toggles != 6:
        raise RuntimeError(f"Expected six facility remove/restore controls, found {toggles}.")
    font_px = browser.execute(
        "return parseFloat(getComputedStyle(document.querySelector('.geo4__service-chip strong')).fontSize);"
    )
    if not isinstance(font_px, (int, float)) or font_px < 8:
        raise RuntimeError(f"GIS service-health text remains too small: {font_px}px")


def run_osm_first(browser: object) -> None:
    browser.click("#geo4-run")
    browser.wait_for_text("#geo4-graph-status", "nodes /", timeout=12)
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    if browser.execute("return document.querySelector('#geo4-engine')?.value") != "osm":
        raise RuntimeError("OSM-first optimisation fell back despite a valid graph fixture.")
    if browser.execute("return document.querySelector('#geo4-routes')?.disabled") is True:
        raise RuntimeError("Route loading remained disabled after a feasible OSM solve.")


def assert_light_home_contrast(browser: object) -> None:
    navigate_path(browser, "/zh/")
    browser.require(".home-hero__featured-project")
    values = browser.execute(
        "const e=document.querySelector('.home-hero__featured-project');"
        "const s=getComputedStyle(e);"
        "return {theme:document.documentElement.dataset.theme,color:s.color,bg:s.backgroundColor,font:parseFloat(getComputedStyle(e.querySelector('strong')).fontSize)};"
    )
    if not isinstance(values, dict):
        raise RuntimeError("Unable to inspect featured-project light-theme styling.")
    if values.get("theme") != "light":
        browser.execute("document.documentElement.dataset.theme='light';return true;")
        time.sleep(0.2)
        values = browser.execute(
            "const e=document.querySelector('.home-hero__featured-project');const s=getComputedStyle(e);return {color:s.color,bg:s.backgroundColor,font:parseFloat(getComputedStyle(e.querySelector('strong')).fontSize)};"
        )
    if values.get("color") in {"rgb(255, 255, 255)", "rgba(255, 255, 255, 1)"}:
        raise RuntimeError(f"Featured project still uses white text in light mode: {values}")
    if float(values.get("font") or 0) < 16:
        raise RuntimeError(f"Featured-project title remains too small: {values}")
    browser.screenshot("geospatial-home-light-desktop.png")


def capture_desktop(browser: object) -> None:
    prime_geospatial_document(browser)
    navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    wait_leaflet(browser)
    browser.require("#geo4-map .leaflet-map-pane")
    assert_services_idle(browser)
    assert_refined_ui(browser)
    run_osm_first(browser)
    browser.screenshot("geospatial-baseline-desktop.png")

    set_select(browser, "#geo4-layer", "coverage")
    browser.require(".geo4-coverage-pulse")
    browser.require(".geo4-demand-node.is-covered")
    browser.screenshot("geospatial-coverage-layer-desktop.png")

    set_select(browser, "#geo4-layer", "flow")
    browser.wait_for_text(".geo4__layer-chip", "货物流")
    browser.screenshot("geospatial-flow-layer-desktop.png")

    set_select(browser, "#geo4-layer", "risk")
    browser.wait_for_text(".geo4__layer-chip", "风险")
    browser.screenshot("geospatial-risk-layer-desktop.png")

    set_select(browser, "#geo4-road-mode", "mixed")
    browser.wait_for_text(".geo4__scenario-ribbon", "混合路网事件")
    browser.wait_for_text(".geo4__freshness", "参数已变更", timeout=5)
    browser.screenshot("geospatial-mixed-event-desktop.png")

    assert_light_home_contrast(browser)


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before visual capture.")
    OUTPUT.mkdir(exist_ok=True)
    for proof in OUTPUT.glob("*.png"):
        proof.unlink()

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = server.server_address[1]
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    driver_port = 9523
    driver_base = f"http://127.0.0.1:{driver_port}"
    driver = subprocess.Popen(
        [base.find_chromedriver(), f"--port={driver_port}", "--allowed-ips=127.0.0.1"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    browser = None
    try:
        base.wait_for_driver(driver_base, driver)
        browser = GeospatialBrowserSession(driver_base, f"http://127.0.0.1:{site_port}")
        browser.set_viewport(1440, 1000, mobile=False)
        capture_desktop(browser)
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

    expected = 6
    actual = len(list(OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} desktop geospatial visual proofs, generated {actual}.")
    print(
        f"Captured {actual} desktop geospatial proofs and passed OSM-first, compact-facility, merged-editor and light-theme readability acceptance in {OUTPUT}."
    )


if __name__ == "__main__":
    main()
