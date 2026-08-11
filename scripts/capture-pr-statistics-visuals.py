from __future__ import annotations

import importlib.util
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts" / "capture-pr-sql-visuals.py"
OUTPUT = ROOT / "statistics-proofs"

spec = importlib.util.spec_from_file_location("sql_visual_helpers", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load shared browser proof helpers.")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.OUTPUT = OUTPUT

NOTES = [
    ("/zh/notes/stat-data-types-scales/", "数据类型与尺度"),
    ("/zh/notes/stat-sampling-estimation/", "抽样与估计"),
    ("/zh/notes/stat-interval-estimation/", "区间估计"),
    ("/zh/notes/stat-hypothesis-testing/", "假设检验"),
    ("/zh/notes/stat-categorical-data-analysis/", "分类数据分析"),
]


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
    time.sleep(0.45)


def assert_no_overflow(browser: object, label: str) -> None:
    overflow = browser.execute(
        "return document.documentElement.scrollWidth > window.innerWidth + 2;"
    )
    if overflow is True:
        raise RuntimeError(f"{label} has horizontal overflow.")


def folder_proof(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"
    navigate_path(browser, "/zh/notes/series/r-statistics/")
    for code in ["STAT 01", "STAT 02", "STAT 03", "STAT 04", "STAT 05", "STAT 06"]:
        browser.require(f'[data-folder-module="{code}"]')
    has_pending = browser.execute("return document.body.innerText.includes('待发布');")
    if has_pending is True:
        raise RuntimeError("R statistics folder still exposes a pending module.")
    assert_no_overflow(browser, f"R statistics folder ({suffix})")
    browser.screenshot(f"statistics-folder-{suffix}.png")


def note_route_proofs(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"
    for path, title in NOTES:
        navigate_path(browser, path)
        browser.require(".learning-note")
        browser.require(".learning-note__grid")
        browser.wait_for_text("h1", title)
        browser.assert_toc_targets()
        assert_no_overflow(browser, f"{title} ({suffix})")


def sampling_proof(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"
    navigate_path(browser, "/zh/notes/stat-interval-estimation/")
    browser.require("[data-sampling-precision-lab]")
    browser.require("[data-sampling-n]")
    browser.require("[data-sampling-confidence]")
    browser.require("[data-sampling-reset]")
    placed = browser.execute(
        "return document.querySelector('[data-learning-block=\"sampling-precision-lab\"]')?.dataset.learningPlaced === 'true';"
    )
    if placed is not True:
        raise RuntimeError("Sampling precision lab was not placed into the note body.")

    browser.execute(
        "const e=document.querySelector('[data-sampling-n]');"
        "e.value='400';e.dispatchEvent(new Event('input',{bubbles:true}));"
        "const c=document.querySelector('[data-sampling-confidence]');"
        "c.value='2.576';c.dispatchEvent(new Event('change',{bubbles:true}));"
    )
    browser.wait_for_text("[data-sampling-n-output]", "400")
    browser.scroll_to("[data-sampling-precision-lab]")
    assert_no_overflow(browser, f"Sampling precision lab ({suffix})")
    browser.screenshot(f"statistics-sampling-{suffix}.png")


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

    driver_port = 9522
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
        folder_proof(browser, mobile=False)
        note_route_proofs(browser, mobile=False)
        sampling_proof(browser, mobile=False)

        browser.set_viewport(390, 844, mobile=True)
        folder_proof(browser, mobile=True)
        note_route_proofs(browser, mobile=True)
        sampling_proof(browser, mobile=True)
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

    expected = 4
    actual = len(list(OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} statistics visual proofs, generated {actual}.")
    print(f"Captured {actual} statistics-series visual proofs in {OUTPUT}.")


if __name__ == "__main__":
    main()
