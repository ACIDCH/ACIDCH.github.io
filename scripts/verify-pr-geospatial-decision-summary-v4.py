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


def wait_dataset(browser: object, key: str, expected: str, timeout: float = 10) -> None:
    deadline = time.time() + timeout
    last = ""
    while time.time() < deadline:
        last = browser.execute(
            f"return document.querySelector('#geo-v4')?.dataset[{key!r}] || '';"
        )
        if last == expected:
            return
        time.sleep(0.2)
    raise RuntimeError(f"Timed out waiting for data-{key}={expected!r}; last={last!r}")


def set_select(browser: object, selector: str, value: str) -> None:
    script = (
        f"const e=document.querySelector({selector!r});"
        "if(!e)return false;"
        f"e.value={value!r};"
        "e.dispatchEvent(new Event('change',{bubbles:true}));"
        f"return e.value==={value!r};"
    )
    ok = browser.execute(script)
    if not ok:
        raise RuntimeError(f"Unable to set {selector} to {value!r}")


def wait_slot(browser: object, slot: str, timeout: float = 8) -> None:
    wait_dataset(browser, f"scenario{slot}State", "saved", timeout)
    text = geo.read_text(browser, f'.geo4__ab-slot[data-slot="{slot}"]')
    if "已保存" not in text:
        raise RuntimeError(f"Scenario {slot} did not render as saved: {text!r}")


def assert_summary_layout(browser: object) -> None:
    display = browser.execute(
        "return getComputedStyle(document.querySelector('.geo4__ab-summary')).display;"
    )
    if display != "grid":
        raise RuntimeError(
            f"Scenario summary was overridden by legacy A/B layout CSS: display={display!r}"
        )
    dimensions = browser.execute(
        "const a=document.querySelector('#geo4-ab');"
        "const s=document.querySelector('.geo4__ab-summary');"
        "const d=document.querySelector('.geo4__ab-decision');"
        "return {ab:a?.getBoundingClientRect().width||0,summary:s?.getBoundingClientRect().width||0,decision:d?.getBoundingClientRect().width||0};"
    )
    if not isinstance(dimensions, dict):
        raise RuntimeError("Unable to measure the rendered A/B scenario summary.")
    if dimensions.get("decision", 0) <= 0 or dimensions.get("summary", 0) > dimensions.get("ab", 0) + 2:
        raise RuntimeError(f"Scenario summary is horizontally clipped: {dimensions}")


def assert_same_engine_summary(browser: object) -> None:
    browser.click("#geo4-save-a")
    wait_slot(browser, "A")

    set_select(browser, "#geo4-road-mode", "congestion")
    geo.set_input(browser, "#geo4-demand-multiplier", "1.08")
    geo.wait_dataset(browser, "resultFreshness", "stale", timeout=6)
    browser.click("#geo4-run")
    geo.wait_solved(browser)

    browser.click("#geo4-save-b")
    wait_slot(browser, "B")
    browser.click("#geo4-compare")
    wait_dataset(browser, "scenarioComparisonState", "comparable", timeout=8)

    decision = geo.read_text(browser, ".geo4__ab-decision")
    if "决策解读" not in decision:
        raise RuntimeError(f"Decision interpretation is missing: {decision!r}")
    assert_summary_layout(browser)

    changed_count = browser.execute(
        "return document.querySelectorAll('.geo4__ab-change').length;"
    )
    if not isinstance(changed_count, int) or changed_count < 2:
        raise RuntimeError(
            f"Changed assumptions were not surfaced after road/demand edits: {changed_count!r}"
        )

    network_text = browser.execute(
        "const cards=[...document.querySelectorAll('.geo4__ab-delta')];"
        "return cards.find(x=>x.querySelector('span')?.textContent.includes('网络表现'))?.querySelector('strong')?.textContent || '';"
    )
    if "min" not in str(network_text):
        raise RuntimeError(
            f"Same-engine OSM comparison did not retain minute semantics: {network_text!r}"
        )

    browser.execute(
        "document.querySelector('.geo4__ab-decision')?.scrollIntoView({block:'center'});return true;"
    )
    time.sleep(0.4)
    browser.screenshot("geospatial-decision-summary-v4.png")


def assert_cross_engine_guard(browser: object) -> None:
    set_select(browser, "#geo4-engine", "od")
    geo.wait_dataset(browser, "resultFreshness", "stale", timeout=6)
    browser.click("#geo4-run")
    geo.wait_solved(browser)

    browser.click("#geo4-save-b")
    wait_slot(browser, "B")
    browser.click("#geo4-compare")
    wait_dataset(browser, "scenarioComparisonState", "cross-engine", timeout=8)
    assert_summary_layout(browser)

    warning = geo.read_text(browser, ".geo4__ab-warning")
    if "Fast OD 是 km，OSM 是 min" not in warning:
        raise RuntimeError(
            f"Cross-engine unit warning was not explicit enough: {warning!r}"
        )

    network_text = browser.execute(
        "const cards=[...document.querySelectorAll('.geo4__ab-delta')];"
        "return cards.find(x=>x.querySelector('span')?.textContent.includes('网络表现'))?.querySelector('strong')?.textContent || '';"
    )
    if "min" not in str(network_text) or "km" not in str(network_text) or "↔" not in str(network_text):
        raise RuntimeError(
            f"Cross-engine network card did not show non-subtractive units: {network_text!r}"
        )

    change_text = " ".join(
        str(item)
        for item in browser.execute(
            "return [...document.querySelectorAll('.geo4__ab-change')].map(x=>x.textContent.trim());"
        )
    )
    if "网络引擎" not in change_text or "OSM 道路网络" not in change_text or "快速 OD 网络" not in change_text:
        raise RuntimeError(
            f"Changed-assumption list did not expose the engine change: {change_text!r}"
        )

    browser.execute(
        "document.querySelector('.geo4__ab-warning')?.scrollIntoView({block:'center'});return true;"
    )
    time.sleep(0.4)
    browser.screenshot("geospatial-cross-engine-guard-v4.png")


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before browser verification.")

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    site_server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = site_server.server_address[1]
    site_thread = threading.Thread(target=site_server.serve_forever, daemon=True)
    site_thread.start()

    gis_server, _gis_thread, endpoint = gis.start_fake_overpass()
    driver_port = 9543
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
        geo.configure_gis(browser, endpoint)
        geo.navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
        browser.require("#geo-v4[data-scenario-summary-v4-ready='true']")
        browser.require("#geo-v4[data-scenario-summary-layout-v4-ready='true']")
        browser.wait_for_text("#geo4-graph-status", "基础网络已就绪", timeout=20)
        geo.wait_solved(browser)

        assert_same_engine_summary(browser)
        assert_cross_engine_guard(browser)
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
        "Geospatial decision-summary v4 browser verification passed: A/B is visibly stacked in the Scenario Console, captures changed assumptions and managerial trade-off interpretation under like-for-like OSM metrics, and cross-engine Fast OD versus OSM comparisons refuse to subtract kilometres from minutes."
    )


if __name__ == "__main__":
    main()
