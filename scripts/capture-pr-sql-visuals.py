from __future__ import annotations

import base64
import json
import os
import shutil
import subprocess
import threading
import time
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
OUTPUT = ROOT / "visual-proofs"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return


def request_json(
    method: str,
    url: str,
    payload: dict[str, object] | None = None,
    timeout: float = 15,
) -> dict[str, object]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read()
    return json.loads(body or b"{}")


def find_chromedriver() -> str:
    direct = shutil.which("chromedriver")
    if direct:
        return direct
    root = os.environ.get("CHROMEWEBDRIVER")
    if root:
        candidate = Path(root) / "chromedriver"
        if candidate.exists():
            return str(candidate)
    raise RuntimeError("ChromeDriver was not found on the runner.")


def recover_session(driver_base: str) -> str | None:
    """Recover a session that ChromeDriver finished creating after a client timeout."""

    try:
        response = request_json("GET", f"{driver_base}/sessions", timeout=4)
    except Exception:
        return None
    value = response.get("value")
    if not isinstance(value, list):
        return None
    for item in reversed(value):
        if not isinstance(item, dict):
            continue
        session_id = item.get("id") or item.get("sessionId")
        if isinstance(session_id, str) and session_id:
            return session_id
    return None


class BrowserSession:
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

        response: dict[str, object] | None = None
        session_id: str | None = None
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                response = request_json(
                    "POST",
                    f"{driver_base}/session",
                    payload,
                    timeout=40,
                )
                value = response.get("value")
                if isinstance(value, dict) and isinstance(value.get("sessionId"), str):
                    session_id = value["sessionId"]
                    break
                last_error = RuntimeError(
                    f"Unexpected ChromeDriver session response: {response}"
                )
            except (TimeoutError, urllib.error.URLError) as error:
                last_error = error
                # A timed-out HTTP client can leave ChromeDriver completing the
                # session in the background. Recover that session before issuing
                # another POST and accidentally launching a second Chrome process.
                deadline = time.time() + 8
                while time.time() < deadline and session_id is None:
                    session_id = recover_session(driver_base)
                    if session_id is None:
                        time.sleep(0.5)
                if session_id is not None:
                    break
            if attempt == 0:
                time.sleep(1.0)

        if session_id is None:
            raise RuntimeError(
                f"ChromeDriver session did not start after bounded recovery/retry: {last_error}"
            )

        self.session_id = session_id
        self.session_base = f"{driver_base}/session/{self.session_id}"
        self.set_viewport(1440, 1000, mobile=False)

    def close(self) -> None:
        try:
            request_json("DELETE", self.session_base)
        except Exception:
            pass

    def set_viewport(self, width: int, height: int, mobile: bool) -> None:
        request_json(
            "POST",
            f"{self.session_base}/goog/cdp/execute",
            {
                "cmd": "Emulation.setDeviceMetricsOverride",
                "params": {
                    "width": width,
                    "height": height,
                    "deviceScaleFactor": 1,
                    "mobile": mobile,
                },
            },
        )

    def navigate(self, slug: str) -> None:
        request_json(
            "POST",
            f"{self.session_base}/url",
            {"url": f"{self.site_base}/zh/notes/{slug}/"},
        )
        deadline = time.time() + 10
        while time.time() < deadline:
            ready = self.execute("return document.readyState")
            if ready in {"interactive", "complete"}:
                break
            time.sleep(0.1)
        time.sleep(0.5)

    def execute(self, script: str) -> object:
        response = request_json(
            "POST",
            f"{self.session_base}/execute/sync",
            {"script": script, "args": []},
        )
        return response.get("value")

    def require(self, selector: str) -> None:
        exists = self.execute(
            f"return Boolean(document.querySelector({json.dumps(selector)}));"
        )
        if exists is not True:
            raise RuntimeError(f"Missing expected visual target: {selector}")

    def assert_toc_targets(self) -> None:
        missing = self.execute(
            "return Array.from(document.querySelectorAll('[data-learning-toc-link]'))"
            ".map((link) => decodeURIComponent(link.hash.slice(1)))"
            ".filter((id) => id && !document.getElementById(id));"
        )
        if isinstance(missing, list) and missing:
            raise RuntimeError(f"Learning Note TOC contains missing targets: {missing}")

    def scroll_to(self, selector: str) -> None:
        self.require(selector)
        geometry = self.execute(
            "const e=document.querySelector(%s);"
            "const r=e.getBoundingClientRect();"
            "return {height:r.height, width:r.width, documentTop:r.top+window.scrollY};"
            % json.dumps(selector)
        )
        if not isinstance(geometry, dict):
            raise RuntimeError(f"Unable to measure visual target: {selector}")
        height = geometry.get("height")
        width = geometry.get("width")
        document_top = geometry.get("documentTop")
        if not isinstance(height, (int, float)) or height < 40:
            raise RuntimeError(f"Visual target is hidden or collapsed: {selector}")
        if not isinstance(width, (int, float)) or width < 100:
            raise RuntimeError(f"Visual target is unexpectedly narrow: {selector}")
        if not isinstance(document_top, (int, float)):
            raise RuntimeError(f"Visual target has no document position: {selector}")

        top = max(0, document_top - 92)
        self.execute(f"window.scrollTo({{top:{top},left:0,behavior:'instant'}});")
        time.sleep(0.3)
        visible = self.execute(
            "const e=document.querySelector(%s);"
            "const r=e.getBoundingClientRect();"
            "return r.bottom>80 && r.top<window.innerHeight-40 && r.width>100 && r.height>40;"
            % json.dumps(selector)
        )
        if visible is not True:
            raise RuntimeError(f"Visual target did not enter the viewport: {selector}")

    def click(self, selector: str) -> None:
        self.require(selector)
        self.execute(f"document.querySelector({json.dumps(selector)}).click();")
        time.sleep(0.2)

    def wait_for_text(self, selector: str, expected: str, timeout: float = 15) -> None:
        self.require(selector)
        deadline = time.time() + timeout
        while time.time() < deadline:
            value = self.execute(
                "return document.querySelector(%s).textContent || '';"
                % json.dumps(selector)
            )
            if isinstance(value, str) and expected in value:
                return
            time.sleep(0.25)
        raise RuntimeError(
            f"Timed out waiting for {expected!r} in visual target {selector}."
        )

    def screenshot(self, name: str) -> None:
        response = request_json("GET", f"{self.session_base}/screenshot")
        encoded = response.get("value")
        if not isinstance(encoded, str):
            raise RuntimeError(f"Screenshot did not return PNG data: {name}")
        (OUTPUT / name).write_bytes(base64.b64decode(encoded))


def wait_for_driver(driver_base: str, process: subprocess.Popen[bytes]) -> None:
    deadline = time.time() + 20
    while time.time() < deadline:
        if process.poll() is not None:
            raise RuntimeError("ChromeDriver exited before becoming ready.")
        try:
            response = request_json("GET", f"{driver_base}/status", timeout=2)
            value = response.get("value")
            if not isinstance(value, dict) or value.get("ready") is not False:
                return
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(0.25)
    raise RuntimeError("ChromeDriver did not become ready in time.")


def capture_visuals(browser: BrowserSession) -> None:
    browser.navigate("sql-relational-data")
    browser.assert_toc_targets()
    browser.scroll_to("[data-relational-model-explorer]")
    browser.screenshot("sql01-model-relational-desktop.png")
    browser.click('[data-model-choice="network"]')
    browser.screenshot("sql01-model-network-desktop.png")
    browser.scroll_to("[data-sql-dataset-explorer]")
    browser.click('[data-dataset-choice="order-items"]')
    browser.screenshot("sql01-dataset-order-items-desktop.png")

    browser.navigate("sql-primary-key")
    browser.assert_toc_targets()
    browser.scroll_to("[data-primary-key-lab]")
    browser.click('[data-key-choice="email"]')
    browser.click("[data-key-change]")
    browser.screenshot("sql02-primary-key-change-desktop.png")
    browser.scroll_to("[data-sql-playground]")
    browser.click("[data-sql-run]")
    browser.wait_for_text("[data-sql-status]", "SQL 执行失败")
    browser.screenshot("sql02-duplicate-primary-key-error-desktop.png")

    browser.navigate("sql-foreign-key")
    browser.assert_toc_targets()
    browser.scroll_to("[data-foreign-key-lab]")
    browser.execute(
        "const e=document.querySelector('[data-foreign-key-choice]');"
        "e.value='9999';e.dispatchEvent(new Event('change',{bubbles:true}));"
    )
    browser.click('[data-fk-mode="logical"]')
    browser.screenshot("sql03-invalid-logical-foreign-key-desktop.png")
    browser.scroll_to("[data-sql-playground]")
    browser.click("[data-sql-run]")
    browser.wait_for_text("[data-sql-status]", "SQL 执行失败")
    browser.screenshot("sql03-invalid-foreign-key-error-desktop.png")

    browser.navigate("sql-relationships")
    browser.assert_toc_targets()
    browser.scroll_to("[data-relationship-cardinality-lab]")
    browser.click('[data-relation-choice="many-to-many"]')
    browser.screenshot("sql04-many-to-many-desktop.png")

    browser.navigate("sql-select")
    browser.assert_toc_targets()
    browser.scroll_to("[data-sql-playground]")
    browser.click("[data-sql-run]")
    browser.wait_for_text("[data-sql-result-summary]", "3 rows × 5 columns")
    browser.screenshot("sql05-select-playground-desktop.png")

    browser.navigate("sql-where")
    browser.assert_toc_targets()
    browser.scroll_to("[data-where-filter-lab]")
    browser.click('[data-where-rule="grouped"]')
    browser.wait_for_text("[data-where-kept]", "1")
    browser.screenshot("sql06-where-grouped-desktop.png")
    browser.scroll_to("[data-sql-playground]")
    browser.click("[data-sql-run]")
    browser.wait_for_text("[data-sql-result-summary]", "2 rows × 4 columns")
    browser.screenshot("sql06-where-playground-desktop.png")

    browser.navigate("sql-projection")
    browser.assert_toc_targets()
    browser.scroll_to("[data-projection-lab]")
    browser.click('[data-projection-mode="alias"]')
    browser.wait_for_text("[data-projection-head]", "customer_key")
    browser.screenshot("sql07-projection-alias-desktop.png")
    browser.scroll_to("[data-sql-playground]")
    browser.click("[data-sql-run]")
    browser.wait_for_text("[data-sql-result-summary]", "3 rows × 3 columns")
    browser.screenshot("sql07-projection-playground-desktop.png")

    browser.set_viewport(390, 844, mobile=True)
    mobile_targets = [
        ("sql-relational-data", "[data-relational-model-explorer]", "sql01-model-mobile.png"),
        ("sql-relational-data", "[data-sql-dataset-explorer]", "sql01-dataset-mobile.png"),
        ("sql-primary-key", "[data-primary-key-lab]", "sql02-primary-key-mobile.png"),
        ("sql-foreign-key", "[data-foreign-key-lab]", "sql03-foreign-key-mobile.png"),
        (
            "sql-relationships",
            "[data-relationship-cardinality-lab]",
            "sql04-relationships-mobile.png",
        ),
        ("sql-select", "[data-sql-playground]", "sql05-select-playground-mobile.png"),
        ("sql-where", "[data-where-filter-lab]", "sql06-where-mobile.png"),
        ("sql-projection", "[data-projection-lab]", "sql07-projection-mobile.png"),
    ]
    for slug, selector, name in mobile_targets:
        browser.navigate(slug)
        browser.assert_toc_targets()
        browser.scroll_to(selector)
        browser.screenshot(name)

    browser.navigate("sql-projection")
    browser.assert_toc_targets()
    browser.scroll_to("[data-sql-playground]")
    browser.click("[data-sql-run]")
    browser.wait_for_text("[data-sql-result-summary]", "3 rows × 3 columns")
    browser.scroll_to("[data-sql-output]")
    browser.screenshot("sql07-projection-playground-mobile.png")


def main() -> None:
    if not DIST.exists():
        raise RuntimeError("dist/ is missing. Run the site build before visual capture.")
    OUTPUT.mkdir(exist_ok=True)
    for existing in OUTPUT.glob("*.png"):
        existing.unlink()

    handler = partial(QuietHandler, directory=str(DIST))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    site_port = server.server_address[1]
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    driver_port = 9515
    driver_base = f"http://127.0.0.1:{driver_port}"
    driver = subprocess.Popen(
        [find_chromedriver(), f"--port={driver_port}", "--allowed-ips=127.0.0.1"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    browser: BrowserSession | None = None
    try:
        wait_for_driver(driver_base, driver)
        browser = BrowserSession(driver_base, f"http://127.0.0.1:{site_port}")
        capture_visuals(browser)
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

    expected = 22
    actual = len(list(OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} visual proofs, generated {actual}.")
    print(f"Captured {actual} SQL Learning Note visual proofs in {OUTPUT}.")


if __name__ == "__main__":
    main()
