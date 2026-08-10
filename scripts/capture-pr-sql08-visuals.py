from __future__ import annotations

import importlib.util
import subprocess
import threading
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts" / "capture-pr-sql-visuals.py"

spec = importlib.util.spec_from_file_location("sql_visuals_base", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load the shared SQL visual proof helpers.")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


def capture_sql08(browser: object) -> None:
    browser.navigate("sql-order-by")
    browser.assert_toc_targets()
    browser.scroll_to("[data-order-by-lab]")
    browser.click('[data-order-rule="multi"]')
    browser.wait_for_text("[data-order-contract]", "secondary key")
    browser.wait_for_text("[data-order-body]", "50002")
    browser.screenshot("sql08-order-by-multi-desktop.png")

    browser.scroll_to("[data-order-sql-run]")
    browser.click("[data-order-sql-run]")
    browser.wait_for_text("[data-order-sql-summary]", "4 rows × 3 columns")
    browser.wait_for_text("[data-order-sql-output]", "50003")
    browser.scroll_to("[data-order-sql-output]")
    browser.screenshot("sql08-order-by-sqlite-desktop.png")

    browser.set_viewport(390, 844, mobile=True)
    browser.navigate("sql-order-by")
    browser.assert_toc_targets()
    browser.scroll_to("[data-order-by-lab]")
    browser.click('[data-order-rule="stable"]')
    browser.wait_for_text("[data-order-contract]", "unique tie-breaker")
    browser.screenshot("sql08-order-by-mobile.png")

    browser.navigate("sql-order-by")
    browser.assert_toc_targets()
    browser.scroll_to("[data-order-sql-run]")
    browser.click("[data-order-sql-run]")
    browser.wait_for_text("[data-order-sql-summary]", "4 rows × 3 columns")
    browser.scroll_to("[data-order-sql-output]")
    browser.screenshot("sql08-order-by-sqlite-mobile.png")


def main() -> None:
    if not base.DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before visual capture.")
    base.OUTPUT.mkdir(exist_ok=True)

    handler = partial(base.QuietHandler, directory=str(base.DIST))
    server = base.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = server.server_address[1]
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    driver_port = 9516
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
        capture_sql08(browser)
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

    expected = 26
    actual = len(list(base.OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} combined SQL visual proofs, generated {actual}.")
    print(f"Captured SQL 08 proofs; combined SQL Learning Note proof count is {actual}.")


if __name__ == "__main__":
    main()
