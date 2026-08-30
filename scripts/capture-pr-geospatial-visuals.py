from __future__ import annotations

import importlib.util
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts" / "capture-pr-sql-visuals.py"
GIS_SCRIPT = ROOT / "scripts" / "geospatial-test-gis.py"
OUTPUT = ROOT / "geospatial-proofs"

spec = importlib.util.spec_from_file_location("sql_visual_helpers", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load shared browser proof helpers.")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.OUTPUT = OUTPUT

gis_spec = importlib.util.spec_from_file_location("geospatial_test_gis", GIS_SCRIPT)
if gis_spec is None or gis_spec.loader is None:
    raise RuntimeError("Unable to load deterministic GIS fixture server.")
gis = importlib.util.module_from_spec(gis_spec)
gis_spec.loader.exec_module(gis)


def navigate_path(browser: object, path: str) -> None:
    base.request_json(
        "POST",
        f"{browser.session_base}/url",
        {"url": f"{browser.site_base}{path}"},
    )
    deadline = time.time() + 12
    while time.time() < deadline:
        if browser.execute("return document.readyState") == "complete":
            break
        time.sleep(0.1)
    time.sleep(0.6)


def configure_gis(browser: object, endpoint: str) -> None:
    navigate_path(browser, "/")
    browser.execute(
        "localStorage.setItem('acidch-gis-endpoints', JSON.stringify({overpassPrimary:%r,overpassSecondary:%r}));"
        "sessionStorage.setItem('acidch-geo-v4-scene-index','0');return true;"
        % (endpoint, endpoint)
    )


def set_select(browser: object, selector: str, value: str) -> None:
    browser.require(selector)
    browser.execute(
        "const e=document.querySelector(%r);e.value=%r;e.dispatchEvent(new Event('change',{bubbles:true}));"
        % (selector, value)
    )
    time.sleep(0.35)


def set_input(browser: object, selector: str, value: str) -> None:
    browser.require(selector)
    browser.execute(
        "const e=document.querySelector(%r);e.value=%r;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));"
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


def read_value(browser: object, selector: str) -> str:
    browser.require(selector)
    value = browser.execute("return String(document.querySelector(%r)?.value ?? '');" % selector)
    if not isinstance(value, str):
        raise RuntimeError(f"Unable to read value from {selector}.")
    return value


def read_kpis(browser: object) -> dict[str, str]:
    return {
        "hubs": read_text(browser, "#geo4-kpi-hubs"),
        "cost": read_text(browser, "#geo4-kpi-cost"),
        "ss": read_text(browser, "#geo4-kpi-ss"),
        "rop": read_text(browser, "#geo4-kpi-rop"),
    }


def wait_dataset(browser: object, key: str, expected: str, timeout: float = 8) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        value = browser.execute(
            "const r=document.querySelector('#geo-v4');return r?.dataset[%r] || '';" % key
        )
        if value == expected:
            return
        time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for #geo-v4 data-{key}={expected!r}.")


def wait_solved(browser: object, timeout: float = 50) -> None:
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=timeout)


def assert_single_mounts(browser: object) -> None:
    selectors = [
        ".geo4__service-health",
        ".geo4__capacity-buffer",
        ".geo4__lead-variability",
        ".geo4__fleet-planner",
        ".geo4__transshipment",
        ".geo4__flow-panel",
        ".geo4__layer-chip",
    ]
    duplicates = browser.execute(
        "return Object.fromEntries(%r.map(s=>[s,document.querySelectorAll(s).length]));" % selectors
    )
    if not isinstance(duplicates, dict):
        raise RuntimeError("Unable to inspect geospatial extension mount counts.")
    invalid = {key: value for key, value in duplicates.items() if value != 1}
    if invalid:
        raise RuntimeError(f"Geospatial extensions are not idempotently mounted: {invalid}")


def assert_osm_first_state(browser: object) -> None:
    browser.wait_for_text("#geo4-graph-status", "基础网络已就绪", timeout=20)
    wait_solved(browser)
    if read_value(browser, "#geo4-engine") != "osm":
        raise RuntimeError("The production geospatial scene did not start from the Auckland baseline graph in OSM mode.")
    entity_count = browser.execute(
        "return document.querySelectorAll('#geo4-policy-list .geo4__policy-row').length;"
    )
    if entity_count != 22:
        raise RuntimeError(f"Expected a 22-entity randomized initial scene, found {entity_count} rows.")
    if (
        "网络实体与设施决策" not in read_text(browser, "#geo4-policy-list")
        and "网络实体与设施决策" not in read_text(browser, ".geo4__console")
    ):
        raise RuntimeError("Unified network-entity/facility module was not mounted.")
    if read_text(browser, "#geo4-map-add") != "点击地图添加":
        raise RuntimeError("Map-click add button copy is not the requested Chinese wording.")
    states = browser.execute(
        "return Object.fromEntries([...document.querySelectorAll('.geo4__service-chip')].map(e=>[e.dataset.service,e.dataset.state]));"
    )
    if states.get("overpass") != "idle":
        raise RuntimeError(
            f"Baseline-first startup unexpectedly contacted Overpass before an explicit refresh: {states}"
        )
    if states.get("nominatim") != "idle" or states.get("osrm") != "idle":
        raise RuntimeError(f"Baseline-first scene unexpectedly called Nominatim or OSRM: {states}")


def assert_entity_edit_cycle(browser: object) -> None:
    before = browser.execute(
        "return document.querySelectorAll('#geo4-policy-list .geo4__policy-row').length;"
    )
    browser.click('[data-remove-entity="demand:1"]')
    wait_solved(browser)
    after = browser.execute(
        "return document.querySelectorAll('#geo4-policy-list .geo4__policy-row').length;"
    )
    if before != 22 or after != 21:
        raise RuntimeError(
            f"Entity deletion did not change the model-backed list: before={before}, after={after}"
        )
    browser.click("#geo4-reset")
    wait_solved(browser)
    restored = browser.execute(
        "return document.querySelectorAll('#geo4-policy-list .geo4__policy-row').length;"
    )
    if restored != 22:
        raise RuntimeError(f"Reset did not restore the 22-entity randomized base scene: {restored}")


def assert_state_cycle(browser: object) -> None:
    browser.require(".geo4__service-health")
    browser.require("#geo4-utilisation-buffer")
    browser.require("#geo4-lead-time-sd")
    browser.require(".geo4__fleet-planner")
    browser.require(".geo4__transshipment")
    browser.require("#geo-v4[data-scenario-summary-v4-ready='true']")
    assert_single_mounts(browser)
    assert_osm_first_state(browser)

    initial = read_kpis(browser)
    if any(value in {"", "—"} for value in initial.values()):
        raise RuntimeError(f"Initial OSM KPIs were not fully solved: {initial}")

    browser.click("#geo4-reset")
    wait_solved(browser)
    baseline = read_kpis(browser)
    if initial != baseline:
        raise RuntimeError(
            f"Initial OSM KPI state does not match Reset: initial={initial}, reset={baseline}"
        )

    assert_entity_edit_cycle(browser)
    baseline = read_kpis(browser)

    set_input(browser, "#geo4-demand-multiplier", "1.20")
    set_input(browser, "#geo4-lead-time-sd", "0.6")
    set_input(browser, "#geo4-utilisation-buffer", "80")
    browser.click("#geo4-run")
    wait_solved(browser)
    browser.click("#geo4-save-a")
    browser.wait_for_text("#geo4-status", "已保存情景 A", timeout=5)
    wait_dataset(browser, "scenarioAState", "saved", timeout=5)

    set_select(browser, "#geo4-road-mode", "congestion")
    set_input(browser, "#geo4-congestion", "55")
    browser.click("#geo4-run")
    wait_solved(browser)
    browser.click("#geo4-save-b")
    browser.wait_for_text("#geo4-status", "已保存情景 B", timeout=5)
    wait_dataset(browser, "scenarioBState", "saved", timeout=5)
    browser.click("#geo4-compare")
    wait_dataset(browser, "scenarioComparisonState", "comparable", timeout=5)
    browser.wait_for_text("#geo4-ab", "决策解读", timeout=5)
    if browser.execute("return document.querySelectorAll('#geo4-ab .geo4__ab-delta').length;") != 4:
        raise RuntimeError("Scenario A/B managerial summary did not render four comparable KPI cards.")

    browser.click("#geo4-reset")
    wait_solved(browser)
    expected_values = {
        "#geo4-demand-multiplier": "1",
        "#geo4-lead-time-sd": "0",
        "#geo4-utilisation-buffer": "85",
        "#geo4-road-mode": "baseline",
        "#geo4-layer": "network",
        "#geo4-service": "1.645",
        "#geo4-holding-cost": "1",
        "#geo4-facility-capacity-base": "6000",
        "#geo4-facility-capacity": "5100",
        "#geo4-engine": "osm",
    }
    wrong = {
        selector: (read_value(browser, selector), expected)
        for selector, expected in expected_values.items()
        if read_value(browser, selector) != expected
    }
    if wrong:
        raise RuntimeError(f"Reset left stale geospatial scenario state: {wrong}")
    wait_dataset(browser, "scenarioComparisonState", "waiting", timeout=5)
    saved_states = browser.execute(
        "const r=document.querySelector('#geo-v4');return {a:r?.dataset.scenarioAState||'',b:r?.dataset.scenarioBState||''};"
    )
    if saved_states != {"a": "", "b": ""}:
        raise RuntimeError(f"Scenario A/B saved state survived Reset: {saved_states}")
    if browser.execute("return document.querySelectorAll('#geo4-ab .geo4__ab-decision').length;") != 0:
        raise RuntimeError("Scenario A/B decision interpretation survived Reset.")
    if read_text(browser, "#geo4-ab").count("尚未保存") != 2:
        raise RuntimeError("Reset did not return A/B summary to two empty saved-state slots.")
    restored = read_kpis(browser)
    if restored != baseline:
        raise RuntimeError(
            f"Baseline KPI state was not restored: before={baseline}, after={restored}"
        )
    assert_single_mounts(browser)


def assert_local_routing_fallback(browser: object) -> None:
    before = read_text(browser, "#geo4-kpi-cost")
    browser.execute(
        "globalThis.__ACIDCH_GIS_ENDPOINTS__={osrm:'http://127.0.0.1:9'};"
        "const r=document.querySelector('#geo-v4');delete r.dataset.ciLocalRouting;"
        "globalThis.fetch('https://router.project-osrm.org/table/v1/driving/174.75,-36.88;174.78,-36.86?annotations=distance,duration')"
        ".then(x=>{r.dataset.ciLocalRouting=x.headers.get('X-ACIDCH-Fallback')||'none';})"
        ".catch(()=>{r.dataset.ciLocalRouting='error';});return true;"
    )
    wait_dataset(browser, "ciLocalRouting", "osm-graph", timeout=8)
    osrm_state = browser.execute(
        "return document.querySelector('#geo-v4')?.dataset.serviceOsrm || '';"
    )
    if osrm_state == "degraded":
        raise RuntimeError(
            "Local OSM graph routing succeeded but the untouched external OSRM service was falsely marked degraded."
        )
    after = read_text(browser, "#geo4-kpi-cost")
    if after != before:
        raise RuntimeError("Local routing fallback mutated the current optimisation result.")
    browser.execute(
        "globalThis.__ACIDCH_GIS_ENDPOINTS__={};"
        "delete document.querySelector('#geo-v4').dataset.ciLocalRouting;return true;"
    )


def capture_desktop(browser: object, endpoint: str) -> None:
    configure_gis(browser, endpoint)
    navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4")
    browser.require("#geo4-map")
    browser.require(".geo4__console")
    browser.require(".geo4__results")
    browser.require("#geo4-map .leaflet-map-pane")
    assert_state_cycle(browser)

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
    mode = browser.execute(
        "const s=document.querySelector('.geo4__shell');return s?.dataset.analysisLayer||'';"
    )
    if mode != "risk":
        raise RuntimeError(f"Expected risk analysis visual mode, got {mode!r}.")
    browser.screenshot("geospatial-risk-layer-desktop.png")

    set_select(browser, "#geo4-road-mode", "mixed")
    browser.wait_for_text(".geo4__scenario-ribbon", "混合路网事件")
    browser.wait_for_text(".geo4__freshness", "参数已变更", timeout=4)
    road_mode = browser.execute(
        "const s=document.querySelector('.geo4__shell');return s?.dataset.roadVisual||'';"
    )
    if road_mode != "mixed":
        raise RuntimeError(f"Expected mixed road visual mode, got {road_mode!r}.")
    browser.screenshot("geospatial-mixed-event-desktop.png")

    assert_local_routing_fallback(browser)


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before visual capture.")
    OUTPUT.mkdir(exist_ok=True)
    for proof in OUTPUT.glob("*.png"):
        proof.unlink()

    site_handler = partial(base.QuietHandler, directory=str(base.DIST))
    site_server = base.ThreadingHTTPServer(("127.0.0.1", 0), site_handler)
    site_port = site_server.server_address[1]
    site_thread = threading.Thread(target=site_server.serve_forever, daemon=True)
    site_thread.start()

    gis_server, _gis_thread, endpoint = gis.start_fake_overpass()
    driver_port = 9523
    driver_base = f"http://127.0.0.1:{driver_port}"
    driver = subprocess.Popen(
        [
            base.find_chromedriver(),
            f"--port={driver_port}",
            "--allowed-ips=127.0.0.1",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    browser = None
    try:
        base.wait_for_driver(driver_base, driver)
        browser = base.BrowserSession(
            driver_base, f"http://127.0.0.1:{site_port}"
        )
        browser.set_viewport(1440, 1000, mobile=False)
        capture_desktop(browser, endpoint)
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

    expected = 5
    actual = len(list(OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(
            f"Expected {expected} desktop geospatial visual proofs, generated {actual}."
        )
    print(
        f"Captured {actual} OSM-first desktop geospatial proofs and passed compact-scene / entity-edit / state-cycle / local-routing-fallback acceptance in {OUTPUT}."
    )


if __name__ == "__main__":
    main()
