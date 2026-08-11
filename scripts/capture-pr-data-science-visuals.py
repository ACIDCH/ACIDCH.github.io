from __future__ import annotations

import importlib.util
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts" / "capture-pr-sql-visuals.py"
OUTPUT = ROOT / "data-science-proofs"

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
    deadline = time.time() + 10
    while time.time() < deadline:
        if browser.execute("return document.readyState") == "complete":
            break
        time.sleep(0.1)
    time.sleep(0.5)


def set_value(browser: object, selector: str, value: str) -> None:
    browser.require(selector)
    browser.execute(
        "const e=document.querySelector(%r);e.value=%r;"
        "e.dispatchEvent(new Event('input',{bubbles:true}));" % (selector, value)
    )
    time.sleep(0.25)


def assert_no_overflow(browser: object, label: str) -> None:
    overflow = browser.execute(
        "return document.documentElement.scrollWidth > window.innerWidth + 2;"
    )
    if overflow is True:
        raise RuntimeError(f"{label} has horizontal overflow.")


def handbook_proofs(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"
    navigate_path(browser, "/zh/notes/r-data-analysis-prediction/")
    browser.assert_toc_targets()
    browser.require("[data-prediction-threshold-lab]")
    browser.scroll_to("[data-prediction-threshold-lab]")
    set_value(browser, "[data-threshold-slider]", "65" if not mobile else "35")
    browser.wait_for_text(
        "[data-threshold-output]", "0.65" if not mobile else "0.35"
    )
    browser.require("[data-threshold-sensitivity]")
    browser.require("[data-threshold-specificity]")
    browser.require("[data-threshold-precision]")
    browser.require("[data-threshold-f1]")
    assert_no_overflow(browser, f"R data science handbook ({suffix})")
    browser.screenshot(f"r-data-science-threshold-{suffix}.png")

    browser.require("[data-data-science-advanced]")
    browser.require("#bayesian-hierarchical")
    browser.require("#loss-bias-variance")
    browser.require("#resampling-selection")
    browser.require("#calibration-decision-cost")
    placed = browser.execute(
        "return document.querySelector('[data-data-science-advanced]')?.dataset.learningPlaced === 'true';"
    )
    if placed is not True:
        raise RuntimeError("Advanced data-science sections were not placed before references.")
    browser.scroll_to("#loss-bias-variance")
    assert_no_overflow(browser, f"Advanced data science handbook ({suffix})")
    browser.screenshot(f"r-data-science-advanced-{suffix}.png")


def productivity_proofs(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"
    navigate_path(browser, "/zh/productivity/")
    browser.require(".productivity-page")
    browser.require("#unix")
    browser.require("#git")
    browser.require("#reports")
    browser.scroll_to(".productivity-git-flow")
    assert_no_overflow(browser, f"Productivity page ({suffix})")
    browser.screenshot(f"productivity-git-{suffix}.png")


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

    driver_port = 9521
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
        handbook_proofs(browser, mobile=False)
        productivity_proofs(browser, mobile=False)
        browser.set_viewport(390, 844, mobile=True)
        handbook_proofs(browser, mobile=True)
        productivity_proofs(browser, mobile=True)
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
        raise RuntimeError(
            f"Expected {expected} data-science/productivity visual proofs, generated {actual}."
        )
    print(f"Captured {actual} R data-science and productivity visual proofs in {OUTPUT}.")


if __name__ == "__main__":
    main()
