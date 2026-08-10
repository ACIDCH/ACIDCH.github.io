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


def capture_desktop(browser: object) -> None:
    browser.set_viewport(1440, 1000, mobile=False)

    navigate_path(browser, "/zh/notes/")
    browser.require('[data-learning-folder="decision-models"]')
    browser.wait_for_text('[data-learning-folder="decision-models"]', "供应链与优化")
    browser.wait_for_text('[data-learning-folder="decision-models"]', "10 篇已发布")
    browser.scroll_to('[data-learning-folder="decision-models"]')
    browser.screenshot("dm-folder-index-desktop.png")

    browser.navigate("series/decision-models")
    browser.require('[data-note-folder="decision-models"]')
    browser.wait_for_text('[data-note-folder="decision-models"]', "供应链与优化")
    browser.wait_for_text('[data-note-folder="decision-models"]', "10 篇已发布笔记")
    browser.scroll_to('[data-folder-module="DM 01"]')
    browser.screenshot("dm-folder-series-desktop.png")

    browser.navigate("optimisation-model-anatomy")
    browser.assert_toc_targets()
    browser.scroll_to("[data-optimisation-anatomy]")
    browser.click('[data-anatomy-choice="hub"]')
    browser.wait_for_text("[data-anatomy-question]", "网络结构")
    browser.screenshot("dm01-anatomy-hub-desktop.png")

    browser.navigate("unconstrained-optimisation")
    browser.assert_toc_targets()
    browser.scroll_to("[data-unconstrained-lab]")
    set_value(browser, "[data-capacity-slider]", "575")
    browser.wait_for_text("[data-gap-value]", "50")
    browser.screenshot("dm02-unconstrained-575-desktop.png")

    browser.navigate("constrained-optimisation")
    browser.assert_toc_targets()
    browser.scroll_to("[data-feasible-lab]")
    set_value(browser, "[data-material-capacity]", "260")
    browser.wait_for_text("[data-material-total]", "260")
    browser.screenshot("dm03-feasible-sensitivity-desktop.png")

    browser.navigate("optimisation-sensitivity-analysis")
    browser.assert_toc_targets()
    browser.require("[data-feasible-lab]")

    browser.navigate("binary-milp-decisions")
    browser.assert_toc_targets()
    browser.scroll_to("[data-milp-lab]")
    browser.click('[data-hub-toggle="harbour"]')
    browser.wait_for_text("[data-open-count]", "2")
    browser.wait_for_text("[data-open-capacity]", "1100")
    browser.screenshot("dm05-milp-two-hubs-desktop.png")

    browser.navigate("sets-indices-model-scale")
    browser.assert_toc_targets()
    browser.scroll_to("[data-scale-lab]")
    set_value(browser, "[data-scale-t]", "4")
    browser.wait_for_text("[data-scale-dim]", "4D")
    browser.wait_for_text("[data-scale-vars]", "96")
    browser.screenshot("dm06-scale-4d-desktop.png")

    browser.navigate("pulp-model-architecture")
    browser.assert_toc_targets()
    browser.scroll_to("[data-pulp-lab]")
    browser.click('[data-pulp-step="constraints"]')
    browser.wait_for_text("[data-pulp-math]", "capacity")
    browser.screenshot("dm07-pulp-constraints-desktop.png")

    browser.navigate("multidimensional-optimisation")
    browser.assert_toc_targets()
    browser.require("[data-scale-lab]")

    browser.navigate("transportation-models")
    browser.assert_toc_targets()
    browser.scroll_to("[data-horizon-lab]")
    browser.click('[data-horizon-choice="Tactical"]')
    browser.wait_for_text("[data-horizon-decision]", "capacity")
    browser.screenshot("dm09-horizon-tactical-desktop.png")
    browser.scroll_to("[data-flow-panel=\"carrier\"]")
    browser.wait_for_text("[data-carrier-status]", "Feasible")
    browser.screenshot("dm09-carrier-allocation-desktop.png")

    browser.navigate("multi-period-production-inventory")
    browser.assert_toc_targets()
    browser.scroll_to("[data-flow-panel=\"period\"]")
    browser.click('[data-production-plan="batch"]')
    browser.wait_for_text("[data-period-cost]", "12324")
    browser.wait_for_text("[data-period-setups]", "2")
    browser.screenshot("dm10-two-batch-plan-desktop.png")


def capture_mobile(browser: object) -> None:
    browser.set_viewport(390, 844, mobile=True)

    navigate_path(browser, "/zh/notes/")
    browser.require('[data-learning-folder="decision-models"]')
    browser.wait_for_text('[data-learning-folder="decision-models"]', "供应链与优化")
    browser.scroll_to('[data-learning-folder="decision-models"]')
    browser.screenshot("dm-folder-index-mobile.png")

    browser.navigate("series/decision-models")
    browser.require('[data-note-folder="decision-models"]')
    browser.wait_for_text('[data-note-folder="decision-models"]', "10 篇已发布笔记")
    browser.scroll_to('[data-folder-module="DM 01"]')
    browser.screenshot("dm-folder-series-mobile.png")

    browser.navigate("optimisation-model-anatomy")
    browser.assert_toc_targets()
    browser.scroll_to("[data-optimisation-anatomy]")
    browser.click('[data-anatomy-choice="carrier"]')
    browser.wait_for_text("[data-anatomy-question]", "运输商")
    browser.screenshot("dm01-anatomy-carrier-mobile.png")

    browser.navigate("unconstrained-optimisation")
    browser.assert_toc_targets()
    browser.scroll_to("[data-unconstrained-lab]")
    set_value(browser, "[data-capacity-slider]", "625")
    browser.wait_for_text("[data-gap-value]", "50")
    browser.screenshot("dm02-unconstrained-625-mobile.png")

    browser.navigate("constrained-optimisation")
    browser.assert_toc_targets()
    browser.scroll_to("[data-feasible-lab]")
    set_value(browser, "[data-labour-capacity]", "230")
    browser.wait_for_text("[data-labour-total]", "230")
    browser.screenshot("dm03-feasible-sensitivity-mobile.png")

    browser.navigate("binary-milp-decisions")
    browser.assert_toc_targets()
    browser.scroll_to("[data-milp-lab]")
    browser.click('[data-hub-toggle="harbour"]')
    browser.wait_for_text("[data-open-count]", "2")
    browser.screenshot("dm05-milp-two-hubs-mobile.png")

    browser.navigate("sets-indices-model-scale")
    browser.assert_toc_targets()
    browser.scroll_to("[data-scale-lab]")
    set_value(browser, "[data-scale-t]", "12")
    browser.wait_for_text("[data-scale-vars]", "288")
    browser.screenshot("dm06-scale-4d-mobile.png")

    browser.navigate("pulp-model-architecture")
    browser.assert_toc_targets()
    browser.scroll_to("[data-pulp-lab]")
    browser.click('[data-pulp-step="constraints"]')
    browser.wait_for_text("[data-pulp-code]", "for k in K")
    browser.screenshot("dm07-pulp-constraints-mobile.png")

    browser.navigate("transportation-models")
    browser.assert_toc_targets()
    browser.scroll_to("[data-horizon-lab]")
    browser.click('[data-horizon-choice="Operational"]')
    browser.wait_for_text("[data-horizon-decision]", "short-term")
    browser.screenshot("dm09-horizon-operational-mobile.png")
    browser.scroll_to("[data-flow-panel=\"carrier\"]")
    browser.wait_for_text("[data-carrier-status]", "Feasible")
    browser.screenshot("dm09-carrier-allocation-mobile.png")

    browser.navigate("multi-period-production-inventory")
    browser.assert_toc_targets()
    browser.scroll_to("[data-flow-panel=\"period\"]")
    browser.click('[data-production-plan="batch"]')
    browser.wait_for_text("[data-period-cost]", "12324")
    browser.screenshot("dm10-two-batch-plan-mobile.png")


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
        capture_desktop(browser)
        capture_mobile(browser)
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
