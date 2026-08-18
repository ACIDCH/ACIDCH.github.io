from __future__ import annotations

import importlib.util
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
    time.sleep(1.0)


def set_select(browser: object, selector: str, value: str) -> None:
    browser.require(selector)
    browser.execute(
        "const e=document.querySelector(%r);e.value=%r;e.dispatchEvent(new Event('change',{bubbles:true}));"
        % (selector, value)
    )
    time.sleep(0.25)


def set_input(browser: object, selector: str, value: str) -> None:
    browser.require(selector)
    browser.execute(
        "const e=document.querySelector(%r);e.value=%r;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));"
        % (selector, value)
    )
    time.sleep(0.2)


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


def assert_services_idle_on_load(browser: object) -> None:
    states = browser.execute(
        "return Object.fromEntries([...document.querySelectorAll('.geo4__service-chip')].map(e=>[e.dataset.service,e.dataset.state]));"
    )
    expected = {"nominatim": "idle", "osrm": "idle", "overpass": "idle"}
    if states != expected:
        raise RuntimeError(
            f"External GIS services must remain idle until a user-triggered action: {states}"
        )


def assert_state_cycle(browser: object) -> None:
    browser.require(".geo4__service-health")
    browser.require("#geo4-utilisation-buffer")
    browser.require("#geo4-lead-time-sd")
    browser.require(".geo4__fleet-planner")
    browser.require(".geo4__transshipment")
    assert_single_mounts(browser)
    assert_services_idle_on_load(browser)

    # The first visible result must already include the 85% planning-capacity
    # buffer. A Reset must reproduce the same baseline rather than silently
    # changing the solution after the page has already been shown to the user.
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    initial = read_kpis(browser)
    if any(value in {"", "—"} for value in initial.values()):
        raise RuntimeError(f"Initial geospatial KPIs were not fully solved: {initial}")

    browser.click("#geo4-reset")
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    baseline = read_kpis(browser)
    if initial != baseline:
        raise RuntimeError(
            f"Initial KPI state does not match the 85%-buffered Reset baseline: initial={initial}, reset={baseline}"
        )

    set_input(browser, "#geo4-demand-multiplier", "1.25")
    set_input(browser, "#geo4-lead-time-sd", "0.6")
    set_input(browser, "#geo4-utilisation-buffer", "75")

    # With demand at 1.25x, reducing the fleet to 19 vehicles gives only
    # 19 * 120 * 5 = 11,400 units of hard fleet capacity against 12,000 units
    # of demand. The model must report infeasibility rather than silently relax it.
    browser.click('[data-step="fleet"][data-delta="-1"]')
    browser.click("#geo4-run")
    browser.wait_for_text("#geo4-status", "没有可行方案", timeout=12)
    if read_text(browser, "#geo4-kpi-hubs") != "—":
        raise RuntimeError("Infeasible hard-fleet scenario retained a stale facility KPI.")

    # Increase to 21 vehicles (12,600 units) and verify recovery from the
    # infeasible state before continuing the A/B scenario cycle.
    browser.click('[data-step="fleet"][data-delta="1"]')
    browser.click('[data-step="fleet"][data-delta="1"]')
    browser.click("#geo4-run")
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    browser.click("#geo4-save-a")
    browser.wait_for_text("#geo4-status", "已保存情景 A", timeout=5)

    set_select(browser, "#geo4-road-mode", "congestion")
    set_input(browser, "#geo4-congestion", "55")
    browser.click("#geo4-run")
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    browser.click("#geo4-save-b")
    browser.wait_for_text("#geo4-status", "已保存情景 B", timeout=5)
    browser.click("#geo4-compare")
    browser.wait_for_text("#geo4-ab", "Δ Facilities", timeout=5)

    browser.click("#geo4-reset")
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)

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
    }
    wrong = {
        selector: (read_value(browser, selector), expected)
        for selector, expected in expected_values.items()
        if read_value(browser, selector) != expected
    }
    if wrong:
        raise RuntimeError(f"Reset left stale geospatial scenario state: {wrong}")
    if read_text(browser, "#geo4-ab"):
        raise RuntimeError("Scenario A/B comparison survived Reset.")

    restored = read_kpis(browser)
    if restored != baseline:
        raise RuntimeError(f"Baseline KPI state was not restored: before={baseline}, after={restored}")
    assert_single_mounts(browser)


def assert_service_degradation(browser: object) -> None:
    # Do not hit a public routing service in CI. Redirect the runtime endpoint to a
    # deliberately unreachable local port and verify that the service-health layer
    # records the failure without changing the current optimisation result.
    before = read_text(browser, "#geo4-kpi-cost")
    browser.execute(
        "globalThis.__ACIDCH_GIS_ENDPOINTS__={osrm:'http://127.0.0.1:9'};"
        "globalThis.fetch('https://router.project-osrm.org/table/v1/driving/0,0;1,1')"
        ".catch(()=>{});return true;"
    )
    wait_dataset(browser, "serviceOsrm", "degraded", timeout=8)
    after = read_text(browser, "#geo4-kpi-cost")
    if after != before:
        raise RuntimeError("External GIS service failure mutated the current optimisation result.")
    browser.execute("globalThis.__ACIDCH_GIS_ENDPOINTS__={};return true;")


def capture_desktop(browser: object) -> None:
    navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4")
    browser.require("#geo4-map")
    browser.require(".geo4__console")
    browser.require(".geo4__results")
    browser.require("#geo4-layer")
    browser.require("#geo4-map .leaflet-map-pane")

    # Exercise initial-baseline parity plus a full infeasible -> feasible -> A/B compare -> reset cycle
    # before any external GIS request is made.
    browser.wait_for_text("#geo4-status", "当前情景已完成重新优化", timeout=12)
    assert_state_cycle(browser)

    # Initialise real geocoded points through the same explicit user action exposed by the UI.
    # This keeps the production page idle on first load while giving the visual proof real geometry.
    browser.click("#geo4-init")
    browser.wait_for_text("#geo4-graph-status", "GIS 点位已加载并缓存。", timeout=35)
    browser.require(".geo4-demand-node")
    browser.screenshot("geospatial-baseline-desktop.png")

    set_select(browser, "#geo4-layer", "coverage")
    browser.require(".geo4-coverage-pulse")
    browser.require(".geo4-demand-node.is-covered")
    browser.screenshot("geospatial-coverage-layer-desktop.png")

    set_select(browser, "#geo4-layer", "flow")
    browser.wait_for_text(".geo4__layer-chip", "货物流")
    browser.screenshot("geospatial-flow-layer-desktop.png")

    # Verify the advanced analysis-layer visual state is interactive and mounted.
    set_select(browser, "#geo4-layer", "risk")
    browser.require(".geo4__layer-chip")
    browser.wait_for_text(".geo4__layer-chip", "风险")
    mode = browser.execute(
        "const s=document.querySelector('.geo4__shell');return s?.dataset.analysisLayer||'';"
    )
    if mode != "risk":
        raise RuntimeError(f"Expected risk analysis visual mode, got {mode!r}.")
    browser.screenshot("geospatial-risk-layer-desktop.png")

    # Verify road-event visual state reacts to a scenario change.
    set_select(browser, "#geo4-road-mode", "mixed")
    browser.require(".geo4__scenario-ribbon")
    browser.wait_for_text(".geo4__scenario-ribbon", "混合路网事件")
    road_mode = browser.execute(
        "const s=document.querySelector('.geo4__shell');return s?.dataset.roadVisual||'';"
    )
    if road_mode != "mixed":
        raise RuntimeError(f"Expected mixed road visual mode, got {road_mode!r}.")
    browser.screenshot("geospatial-mixed-event-desktop.png")

    assert_service_degradation(browser)


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
        browser = base.BrowserSession(driver_base, f"http://127.0.0.1:{site_port}")
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

    expected = 5
    actual = len(list(OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} desktop geospatial visual proofs, generated {actual}.")
    print(
        f"Captured {actual} desktop geospatial proofs and passed initial-baseline / state-cycle / service-degradation acceptance in {OUTPUT}."
    )


if __name__ == "__main__":
    main()
