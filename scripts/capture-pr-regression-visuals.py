from __future__ import annotations

import importlib.util
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts" / "capture-pr-sql-visuals.py"
OUTPUT = ROOT / "regression-proofs"

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
        "const e=document.querySelector(%r);e.value=%r;e.dispatchEvent(new Event('input',{bubbles:true}));"
        % (selector, value)
    )
    time.sleep(0.25)


def hover(browser: object, selector: str) -> None:
    browser.require(selector)
    geometry = browser.execute(
        "const e=document.querySelector(%r);const r=e.getBoundingClientRect();"
        "return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};"
        % selector
    )
    if not isinstance(geometry, dict):
        raise RuntimeError(f"Unable to measure hover target: {selector}")
    x = geometry.get("x")
    y = geometry.get("y")
    if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
        raise RuntimeError(f"Invalid hover geometry: {selector}")
    base.request_json(
        "POST",
        f"{browser.session_base}/actions",
        {
            "actions": [
                {
                    "type": "pointer",
                    "id": "mouse",
                    "parameters": {"pointerType": "mouse"},
                    "actions": [
                        {
                            "type": "pointerMove",
                            "duration": 120,
                            "origin": "viewport",
                            "x": int(x),
                            "y": int(y),
                        }
                    ],
                }
            ]
        },
    )
    time.sleep(0.35)


def tag_proofs(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"
    navigate_path(browser, "/zh/notes/")
    browser.require(".tag-cloud-panel--floating")
    tag_count = browser.execute(
        "return document.querySelectorAll('.tag-cloud__item:not(.tag-cloud__item--all)').length;"
    )
    if not isinstance(tag_count, int) or tag_count > 10 or tag_count < 4:
        raise RuntimeError(f"Canonical tag map expected 4–10 themes, got {tag_count}.")
    browser.scroll_to(".tag-cloud-panel--floating")

    regression_tag = '[data-note-tag="回归建模"]'
    browser.require(regression_tag)
    if mobile:
        browser.click(regression_tag)
        pressed = browser.execute(
            "return document.querySelector('[data-note-tag=\"回归建模\"]').getAttribute('aria-pressed');"
        )
        if pressed != "true":
            raise RuntimeError("Regression tag did not retain selected emphasis on mobile.")
    else:
        hover(browser, regression_tag)
        opacity = browser.execute(
            "const e=document.querySelector('[data-note-tag=\"回归建模\"] .tag-cloud__tooltip');"
            "return e ? Number(getComputedStyle(e).opacity) : 0;"
        )
        if not isinstance(opacity, (int, float)) or opacity < 0.9:
            raise RuntimeError("Floating tag tooltip did not become visible on hover.")
    browser.screenshot(f"reg-tag-map-{suffix}.png")


def series_proofs(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"
    navigate_path(browser, "/zh/notes/series/regression/")
    series = '[data-note-folder="regression"]'
    browser.require(series)
    browser.wait_for_text(series, "回归与统计建模")
    browser.wait_for_text(series, "7 篇已发布笔记")
    browser.require('[data-folder-module="REG 01"]')
    browser.require('[data-folder-module="REG 07"]')
    browser.scroll_to('[data-folder-module="REG 01"]')
    browser.screenshot(f"reg-series-{suffix}.png")


def desktop_topic_proofs(browser: object) -> None:
    browser.navigate("regression-foundations")
    browser.assert_toc_targets()
    browser.scroll_to("[data-regression-lab]")
    set_value(browser, "[data-regression-outlier]", "55")
    browser.wait_for_text("[data-regression-outlier-output]", "55")
    browser.screenshot("reg01-outlier-desktop.png")

    browser.navigate("regression-diagnostics")
    browser.assert_toc_targets()
    browser.scroll_to("[data-regression-diagnostics]")
    browser.click('[data-diagnostic-mode="curve"]')
    browser.wait_for_text("[data-diagnostic-signal]", "函数形式可能不足")
    browser.screenshot("reg02-curve-diagnostic-desktop.png")

    browser.navigate("multiple-regression-multicollinearity")
    browser.assert_toc_targets()
    browser.scroll_to("[data-multicollinearity]")
    set_value(browser, "[data-vif-slider]", "90")
    browser.wait_for_text("[data-vif-value]", "5.26")
    browser.wait_for_text("[data-vif-signal]", "高度共线")
    browser.screenshot("reg04-vif-desktop.png")

    browser.navigate("regression-feature-selection")
    browser.assert_toc_targets()
    browser.scroll_to("[data-model-selection]")
    browser.click('[data-selection-metric="bic"]')
    browser.wait_for_text("[data-selection-best]", "Model C")
    browser.screenshot("reg06-model-selection-desktop.png")

    browser.navigate("logistic-regression")
    browser.assert_toc_targets()
    browser.scroll_to("[data-logistic-lab]")
    set_value(browser, "[data-logit-score-slider]", "75")
    set_value(browser, "[data-logit-threshold-slider]", "65")
    browser.wait_for_text("[data-logit-threshold]", "0.65")
    browser.wait_for_text("[data-logit-class]", "High risk")
    browser.screenshot("reg07-logistic-threshold-desktop.png")


def mobile_topic_proof(browser: object) -> None:
    browser.navigate("logistic-regression")
    browser.assert_toc_targets()
    browser.scroll_to("[data-logistic-lab]")
    set_value(browser, "[data-logit-score-slider]", "52")
    set_value(browser, "[data-logit-threshold-slider]", "60")
    browser.wait_for_text("[data-logit-threshold]", "0.60")
    browser.wait_for_text("[data-logit-class]", "Low risk")
    overflow = browser.execute("return document.documentElement.scrollWidth > window.innerWidth + 2;")
    if overflow is True:
        raise RuntimeError("Regression mobile page has horizontal overflow.")
    browser.screenshot("reg07-logistic-threshold-mobile.png")


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

    driver_port = 9519
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
        tag_proofs(browser, mobile=False)
        series_proofs(browser, mobile=False)
        desktop_topic_proofs(browser)
        browser.set_viewport(390, 844, mobile=True)
        tag_proofs(browser, mobile=True)
        series_proofs(browser, mobile=True)
        mobile_topic_proof(browser)
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

    expected = 10
    actual = len(list(OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} regression/tag visual proofs, generated {actual}.")
    print(f"Captured {actual} regression and floating-tag visual proofs in {OUTPUT}.")


if __name__ == "__main__":
    main()
