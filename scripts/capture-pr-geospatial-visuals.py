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


def capture_desktop(browser: object) -> None:
    navigate_path(browser, "/zh/lab/geospatial-supply-chain/")
    browser.require("#geo-v4")
    browser.require("#geo4-map")
    browser.require(".geo4__console")
    browser.require(".geo4__results")
    browser.require("#geo4-layer")
    browser.wait_for_text(".geo4__identity", "基于地理空间的供应链优化")

    # Desktop web is the release target: map-first shell with right-side controls and results.
    browser.screenshot("geospatial-baseline-desktop.png")

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

    expected = 3
    actual = len(list(OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} desktop geospatial visual proofs, generated {actual}.")
    print(f"Captured {actual} desktop geospatial decision-sandbox visual proofs in {OUTPUT}.")


if __name__ == "__main__":
    main()
