from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def build_overpass_grid(rows: int = 15, cols: int = 15) -> dict[str, object]:
    lat_min, lat_max = -36.945, -36.825
    lon_min, lon_max = 174.715, 174.835
    elements: list[dict[str, object]] = []
    ids: list[list[int]] = []
    next_node = 1
    for r in range(rows):
        row: list[int] = []
        lat = lat_min + (lat_max - lat_min) * r / (rows - 1)
        for c in range(cols):
            lon = lon_min + (lon_max - lon_min) * c / (cols - 1)
            node_id = next_node
            next_node += 1
            row.append(node_id)
            elements.append({"type": "node", "id": node_id, "lat": lat, "lon": lon})
        ids.append(row)

    way_id = 10000
    for r in range(rows):
        elements.append(
            {
                "type": "way",
                "id": way_id,
                "nodes": ids[r],
                "tags": {"highway": "primary" if r % 4 == 0 else "residential", "maxspeed": "50"},
            }
        )
        way_id += 1
    for c in range(cols):
        elements.append(
            {
                "type": "way",
                "id": way_id,
                "nodes": [ids[r][c] for r in range(rows)],
                "tags": {"highway": "secondary" if c % 4 == 0 else "residential", "maxspeed": "50"},
            }
        )
        way_id += 1
    return {"version": 0.6, "generator": "acidch-ci-grid", "elements": elements}


_PAYLOAD = json.dumps(build_overpass_grid()).encode("utf-8")


class QuietGisHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length:
            self.rfile.read(length)
        if self.path.startswith("/api/interpreter"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(_PAYLOAD)))
            self.end_headers()
            self.wfile.write(_PAYLOAD)
            return
        self.send_error(404)

    def do_GET(self) -> None:
        if self.path.startswith("/health"):
            payload = b'{"ok":true}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self.send_error(404)


def start_fake_overpass() -> tuple[ThreadingHTTPServer, threading.Thread, str]:
    server = ThreadingHTTPServer(("127.0.0.1", 0), QuietGisHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    endpoint = f"http://127.0.0.1:{server.server_address[1]}/api/interpreter"
    return server, thread, endpoint
