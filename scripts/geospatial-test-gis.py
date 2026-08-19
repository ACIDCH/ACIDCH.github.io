from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any


def build_overpass_fixture() -> dict[str, list[dict[str, Any]]]:
    """Return a deterministic Auckland-sized drivable graph for browser CI.

    The fixture deliberately models only the Overpass response contract used by
    the decision sandbox. It is dense enough for snapping, Dijkstra, coverage,
    fleet routing and transshipment tests while remaining tiny and fully local.
    """

    nodes: list[dict[str, Any]] = []
    ways: list[dict[str, Any]] = []
    grid: list[list[int]] = []

    rows = 11
    cols = 11
    lat0 = -36.935
    lon0 = 174.700
    d_lat = 0.014
    d_lon = 0.017
    node_id = 1

    for row in range(rows):
        ids: list[int] = []
        for col in range(cols):
            ids.append(node_id)
            nodes.append(
                {
                    "type": "node",
                    "id": node_id,
                    "lat": lat0 + row * d_lat,
                    "lon": lon0 + col * d_lon,
                }
            )
            node_id += 1
        grid.append(ids)

    way_id = 10_000
    for row in range(rows):
        ways.append(
            {
                "type": "way",
                "id": way_id,
                "nodes": grid[row],
                "tags": {"highway": "secondary", "maxspeed": "50"},
            }
        )
        way_id += 1

    for col in range(cols):
        ways.append(
            {
                "type": "way",
                "id": way_id,
                "nodes": [grid[row][col] for row in range(rows)],
                "tags": {"highway": "secondary", "maxspeed": "50"},
            }
        )
        way_id += 1

    return {"elements": [*nodes, *ways]}


_FIXTURE_BYTES = json.dumps(build_overpass_fixture(), separators=(",", ":")).encode("utf-8")


class FakeOverpassHandler(BaseHTTPRequestHandler):
    server_version = "ACIDCHGeospatialTestGIS/1.0"

    def log_message(self, _format: str, *_args: object) -> None:
        return

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")

    def do_OPTIONS(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        if self.path.rstrip("/") in {"", "/health"}:
            payload = b'{"ok":true}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self._cors()
            self.end_headers()
            self.wfile.write(payload)
            return
        self.send_response(404)
        self._cors()
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        # Consume the Overpass query body so clients can close/reuse the socket
        # normally. The deterministic graph is independent of the query text.
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length:
            self.rfile.read(length)

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(_FIXTURE_BYTES)))
        self._cors()
        self.end_headers()
        self.wfile.write(_FIXTURE_BYTES)


def start_fake_overpass() -> tuple[ThreadingHTTPServer, threading.Thread, str]:
    """Start the deterministic local Overpass fixture on an ephemeral port."""

    server = ThreadingHTTPServer(("127.0.0.1", 0), FakeOverpassHandler)
    port = int(server.server_address[1])
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    endpoint = f"http://127.0.0.1:{port}/api/interpreter"
    return server, thread, endpoint


if __name__ == "__main__":
    server, _thread, endpoint = start_fake_overpass()
    print(endpoint, flush=True)
    try:
        _thread.join()
    except KeyboardInterrupt:
        server.shutdown()
        server.server_close()
