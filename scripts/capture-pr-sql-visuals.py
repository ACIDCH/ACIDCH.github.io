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
ELEMENT_KEY = "element-6066-11e4-a52e-4f735466cecf"


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


class BrowserSession:
    def __init__(self, driver_base: str, site_base: str) -> None:
        self.driver_base = driver_base
        self.site_base = site_base
        response = request_json(
            "POST",
            f"{driver_base}/session",
            {
                "capabilities": {
                    "alwaysMatch": {
                        "browserName": "chrome",
                        "goog:chromeOptions": {
                            "args": [
                                "--headless=new",
                                "--no-sandbox",
                                "--disable-gpu",
                                "--disable-dev-shm-usage",
                                "--disable-background-networking",
                                "--window-size=1440,1000",
                            ]
                        },
                    }
                }
            },
        )
        value = response.get("value")
        if not isinstance(value, dict) or not isinstance(value.get("sessionId"), str):
            raise RuntimeError(f"Unexpected ChromeDriver session response: {response}")
        self.session_id = value["sessionId"]
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
            if ready == "complete":
                break
            time.sleep(0.1)
        time.sleep(0.35)

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

    def scroll_to(self, selector: str) -> None:
        self.require(selector)
        self.execute(
            f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'center'}});"
        )
        time.sleep(0.25)

    def click(self, selector: str) -> None:
        self.require(selector)
        self.execute(f"document.querySelector({json.dumps(selector)}).click();")
        time.sleep(0.2)

    def screenshot(self, name: str) -> None:
        response = request_json("GET", f"{self.session_base}/screenshot")
        encoded = response.get("value")
        if not isinstance(encoded, str):
            raise RuntimeError(f"Screenshot did not return PNG data: {name}")
        (OUTPUT / name).write_bytes(base64.b64decode(encoded))


def wait_for_driver(driver_base: str, process: subprocess.Popen[bytes]) -> None:
    deadline = time.time() + 12
    while time.time() < deadline:
        if process.poll() is not None:
            raise RuntimeError("ChromeDriver exited before becoming ready.")
        try:
            request_json("GET", f"{driver_base}/status", timeout=1)
            return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(0.2)
    raise RuntimeError("ChromeDriver did not become ready in time.")


def capture_visuals(browser: BrowserSession) -> None:
    browser.navigate("sql-relational-data")
    browser.scroll_to("[data-relational-model-explorer]")
    browser.screenshot("sql01-model-relational-desktop.png")
    browser.click('[data-model-choice="network"]')
    browser.screenshot("sql01-model-network-desktop.png")
    browser.scroll_to("[data-sql-dataset-explorer]")
    browser.click('[data-dataset-choice="order-items"]')
    browser.screenshot("sql01-dataset-order-items-desktop.png")

    browser.navigate("sql-primary-key")
    browser.scroll_to("[data-primary-key-lab]")
    browser.click('[data-key-choice="email"]')
    browser.click("[data-key-change]")
    browser.screenshot("sql02-primary-key-change-desktop.png")

    browser.navigate("sql-foreign-key")
    browser.scroll_to("[data-foreign-key-lab]")
    browser.execute(
        "const e=document.querySelector('[data-foreign-key-choice]');"
        "e.value='9999';e.dispatchEvent(new Event('change',{bubbles:true}));"
    )
    browser.click('[data-fk-mode="logical"]')
    browser.screenshot("sql03-invalid-logical-foreign-key-desktop.png")

    browser.navigate("sql-relationships")
    browser.scroll_to("[data-relationship-cardinality-lab]")
    browser.click('[data-relation-choice="many-to-many"]')
    browser.screenshot("sql04-many-to-many-desktop.png")

    browser.navigate("sql-select")
    browser.scroll_to("[data-sql-playground]")
    browser.screenshot("sql05-select-playground-desktop.png")

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
    ]
    for slug, selector, name in mobile_targets:
        browser.navigate(slug)
        browser.scroll_to(selector)
        browser.screenshot(name)


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

    expected = 13
    actual = len(list(OUTPUT.glob("*.png")))
    if actual != expected:
        raise RuntimeError(f"Expected {expected} visual proofs, generated {actual}.")
    print(f"Captured {actual} SQL Learning Note visual proofs in {OUTPUT}.")


if __name__ == "__main__":
    main()
