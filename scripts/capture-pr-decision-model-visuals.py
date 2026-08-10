from __future__ import annotations

import importlib.util
import subprocess
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_SCRIPT = ROOT / "scripts" / "capture-pr-sql-visuals.py"
OUTPUT = ROOT / "decision-proofs"

spec = importlib.util.spec_from_file_location("sql_visual_helpers", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load shared browser proof helpers.")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
base.OUTPUT = OUTPUT


def set_value(browser: object, selector: str, value: str) -> None:
    browser.require(selector)
    browser.execute(
        "const e=document.querySelector(%r);e.value=%r;e.dispatchEvent(new Event('input',{bubbles:true}));"
        % (selector, value)
    )


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


def folder_proofs(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"
    navigate_path(browser, "/zh/notes/")
    folder = '[data-learning-folder="decision-models"]'
    browser.require(folder)
    browser.wait_for_text(folder, "供应链与优化")
    browser.wait_for_text(folder, "10 篇已发布")
    browser.scroll_to(folder)
    browser.screenshot(f"dm-folder-index-{suffix}.png")

    browser.navigate("series/decision-models")
    series = '[data-note-folder="decision-models"]'
    browser.require(series)
    browser.wait_for_text(series, "供应链与优化")
    browser.wait_for_text(series, "10 篇已发布笔记")
    browser.scroll_to('[data-folder-module="DM 01"]')
    browser.screenshot(f"dm-folder-series-{suffix}.png")


def common_topic_proofs(browser: object, mobile: bool) -> None:
    suffix = "mobile" if mobile else "desktop"

    browser.navigate("optimisation-model-anatomy")
    browser.assert_toc_targets()
    browser.scroll_to("[data-optimisation-anatomy]")
    choice = "carrier" if mobile else "hub"
    expected = "运输商" if mobile else "网络结构"
    browser.click(f'[data-anatomy-choice="{choice}"]')
    browser.wait_for_text("[data-anatomy-question]", expected)
    browser.screenshot(f"dm01-anatomy-{choice}-{suffix}.png")

    browser.navigate("unconstrained-optimisation")
    browser.assert_toc_targets()
    browser.scroll_to("[data-unconstrained-lab]")
    capacity = "625" if mobile else "575"
    set_value(browser, "[data-capacity-slider]", capacity)
    browser.wait_for_text("[data-gap-value]", "50")
    browser.screenshot(f"dm02-unconstrained-{capacity}-{suffix}.png")

    browser.navigate("constrained-optimisation")
    browser.assert_toc_targets()
    browser.scroll_to("[data-feasible-lab]")
    if mobile:
        set_value(browser, "[data-labour-capacity]", "230")
        browser.wait_for_text("[data-labour-total]", "230")
    else:
        set_value(browser, "[data-material-capacity]", "260")
        browser.wait_for_text("[data-material-total]", "260")
    browser.screenshot(f"dm03-feasible-sensitivity-{suffix}.png")

    browser.navigate("optimisation-sensitivity-analysis")
    browser.assert_toc_targets()
    browser.require("[data-feasible-lab]")

    browser.navigate("binary-milp-decisions")
    browser.assert_toc_targets()
    browser.scroll_to("[data-milp-lab]")
    browser.click('[data-hub-toggle="harbour"]')
    browser.wait_for_text("[data-open-count]", "2")
    if not mobile:
        browser.wait_for_text("[data-open-capacity]", "1100")
    browser.screenshot(f"dm05-milp-two-hubs-{suffix}.png")

    browser.navigate("sets-indices-model-scale")
    browser.assert_toc_targets()
    browser.scroll_to("[data-scale-lab]")
    periods, variables = ("12", "288") if mobile else ("4", "96")
    set_value(browser, "[data-scale-t]", periods)
    browser.wait_for_text("[data-scale-dim]", "4D")
    browser.wait_for_text("[data-scale-vars]", variables)
    browser.screenshot(f"dm06-scale-4d-{suffix}.png")

    browser.navigate("pulp-model-architecture")
    browser.assert_toc_targets()
    browser.scroll_to("[data-pulp-lab]")
    browser.click('[data-pulp-step="constraints"]')
    if mobile:
        browser.wait_for_text("[data-pulp-code]", "for k in K")
    else:
        browser.wait_for_text("[data-pulp-math]", "cap[k]")
    browser.screenshot(f"dm07-pulp-constraints-{suffix}.png")

    browser.navigate("multidimensional-optimisation")
    browser.assert_toc_targets()
    browser.require("[data-scale-lab]")

    browser.navigate("transportation-models")
    browser.assert_toc_targets()
    browser.scroll_to("[data-horizon-lab]")
    horizon = "Operational" if mobile else "Tactical"
    horizon_text = "short-term" if mobile else "capacity"
    browser.click(f'[data-horizon-choice="{horizon}"]')
    browser.wait_for_text("[data-horizon-decision]", horizon_text)
    browser.screenshot(f"dm09-horizon-{horizon.lower()}-{suffix}.png")
    browser.scroll_to('[data-flow-panel="carrier"]')
    browser.wait_for_text("[data-carrier-status]", "Feasible")
    browser.screenshot(f"dm09-carrier-allocation-{suffix}.png")

    browser.navigate("multi-period-production-inventory")
    browser.assert_toc_targets()
    browser.scroll_to('[data-flow-panel="period"]')
    browser.click('[data-production-plan="batch"]')
    browser.wait_for_text("[data-period-cost]", "12324")
    if not mobile:
        browser.wait_for_text("[data-period-setups]", "2")
    browser.screenshot(f"dm10-two-batch-plan-{suffix}.png")


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

    driver_port = 9518
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
        folder_proofs(browser, mobile=False)
        common_topic_proofs(browser, mobile=False)
        browser.set_viewport(390, 844, mobile=True)
        folder_proofs(browser, mobile=True)
        common_topic_proofs(browser, mobile=True)
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
        raise RuntimeError(f"Expected {expected} decision-model visual proofs, generated {actual}.")
    print(f"Captured {actual} supply-chain decision-model visual proofs in {OUTPUT}.")


if __name__ == "__main__":
    main()
