from __future__ import annotations

import importlib.util
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY_SCRIPT = ROOT / "scripts" / "capture-pr-geospatial-visuals.py"

spec = importlib.util.spec_from_file_location("geospatial_visual_proofs", LEGACY_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load geospatial visual proof helpers.")
proofs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proofs)


# V4 switched from the old scene-index fixture selector to a session seed.
# Seed the browser before navigation so the randomized production scene is
# deterministic for visual regression, while production sessions remain random.
_original_navigate_path = proofs.navigate_path


def navigate_path(browser: object, path: str) -> None:
    browser.execute(
        "sessionStorage.setItem('acidch-geo-v4-scene-seed','20260823');"
        "sessionStorage.removeItem('acidch-geo-v4-scene-index');return true;"
    )
    _original_navigate_path(browser, path)


proofs.navigate_path = navigate_path


def assert_local_routing_resilience(browser: object) -> None:
    before = proofs.read_text(browser, "#geo4-kpi-cost")
    browser.execute(
        "globalThis.__acidchLocalRoutingProbe=null;"
        "globalThis.__ACIDCH_GIS_ENDPOINTS__={osrm:'http://127.0.0.1:9'};"
        "globalThis.fetch('https://router.project-osrm.org/table/v1/driving/174.76,-36.87;174.78,-36.87?sources=0&destinations=1&annotations=distance,duration')"
        ".then(async r=>{globalThis.__acidchLocalRoutingProbe={ok:r.ok,header:r.headers.get('X-ACIDCH-Fallback'),payload:await r.json()};})"
        ".catch(e=>{globalThis.__acidchLocalRoutingProbe={ok:false,error:String(e)};});"
        "return true;"
    )

    deadline = time.time() + 8
    probe = None
    while time.time() < deadline:
        probe = browser.execute("return globalThis.__acidchLocalRoutingProbe;")
        if isinstance(probe, dict):
            break
        time.sleep(0.2)

    if not isinstance(probe, dict):
        raise RuntimeError("Timed out waiting for loaded-OSM local Table fallback.")
    if probe.get("ok") is not True or probe.get("header") != "osm-graph":
        raise RuntimeError(f"OSRM failure did not use the loaded OSM graph locally: {probe!r}")
    payload = probe.get("payload") or {}
    if payload.get("code") != "Ok" or not payload.get("distances") or not payload.get("durations"):
        raise RuntimeError(f"Local OSM Table fallback returned an invalid OSRM-compatible payload: {payload!r}")

    osrm_state = browser.execute(
        "return document.querySelector('#geo-v4')?.dataset.serviceOsrm || '';"
    )
    if osrm_state == "degraded":
        raise RuntimeError(
            "Loaded-graph Table fallback still marked OSRM degraded even though no public OSRM call was needed."
        )

    after = proofs.read_text(browser, "#geo4-kpi-cost")
    if after != before:
        raise RuntimeError("Local routing fallback mutated the current optimisation result.")
    browser.execute(
        "globalThis.__ACIDCH_GIS_ENDPOINTS__={};globalThis.__acidchLocalRoutingProbe=null;return true;"
    )


def assert_random_scene_default_max_open(browser: object) -> None:
    value = int(proofs.read_value(browser, "#geo4-max-open-out"))
    if value < 5:
        raise RuntimeError(f"Randomized 22-entity scene must allow at least five open facilities; found {value}.")


proofs.assert_service_degradation = assert_local_routing_resilience
_original_assert_state_cycle = proofs.assert_state_cycle


def assert_state_cycle(browser: object) -> None:
    _original_assert_state_cycle(browser)
    assert_random_scene_default_max_open(browser)


proofs.assert_state_cycle = assert_state_cycle
proofs.main()