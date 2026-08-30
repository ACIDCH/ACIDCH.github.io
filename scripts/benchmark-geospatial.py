"""Reproducible differential benchmark for the browser GIS solvers.

NetworkX is a development-only reference dependency. It is not bundled into the site.
"""

from __future__ import annotations

import itertools
import json
import math
import pathlib
import subprocess
import sys

try:
    import networkx as nx
except ImportError as error:
    raise SystemExit(
        "NetworkX is required for this development benchmark. "
        "Install with: python -m pip install -r requirements-geospatial-benchmark.txt"
    ) from error


ROOT = pathlib.Path(__file__).resolve().parents[1]


def project_results() -> dict:
    completed = subprocess.run(
        ["node", "scripts/benchmark-geospatial-project.mjs"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def assert_close(label: str, actual: float, expected: float, tolerance: float = 1e-8) -> None:
    if not math.isclose(actual, expected, rel_tol=tolerance, abs_tol=tolerance):
        raise AssertionError(f"{label}: project={actual}, reference={expected}")


def shortest_path_reference() -> float:
    graph = nx.DiGraph()
    graph.add_weighted_edges_from(
        [("a", "b", 2), ("a", "c", 5), ("b", "c", 1), ("b", "d", 10), ("c", "d", 2)]
    )
    return nx.shortest_path_length(graph, "a", "d", weight="weight")


def transport_reference() -> tuple[float, float]:
    graph = nx.DiGraph()
    graph.add_node("source", demand=-10)
    graph.add_node("sink", demand=10)
    for facility, capacity in enumerate([6, 6]):
        graph.add_edge("source", f"f{facility}", capacity=capacity, weight=0)
    for demand, required in enumerate([4, 6]):
        graph.add_edge(f"d{demand}", "sink", capacity=required, weight=0)
    costs = [[2, 5], [3, 1]]
    for facility in range(2):
        for demand in range(2):
            graph.add_edge(
                f"f{facility}", f"d{demand}", capacity=10, weight=costs[facility][demand]
            )
    flow = nx.min_cost_flow(graph)
    return nx.cost_of_flow(graph, flow), sum(flow[f"d{d}"]["sink"] for d in range(2))


def facility_reference() -> tuple[list[int], float]:
    fw = [1, 2]
    wd = [[1, 5], [4, 1]]
    demands = [3, 2]
    best = None
    for count in (1, 2):
        for selected in itertools.combinations(range(2), count):
            graph = nx.DiGraph()
            total = sum(demands)
            graph.add_node("source", demand=-total)
            graph.add_node("sink", demand=total)
            graph.add_edge("source", "factory", capacity=total, weight=0)
            for warehouse in selected:
                graph.add_edge("factory", f"w{warehouse}", capacity=5, weight=fw[warehouse])
                for demand in range(2):
                    graph.add_edge(
                        f"w{warehouse}",
                        f"d{demand}",
                        capacity=total,
                        weight=wd[warehouse][demand],
                    )
            for demand, required in enumerate(demands):
                graph.add_edge(f"d{demand}", "sink", capacity=required, weight=0)
            try:
                flow = nx.min_cost_flow(graph)
            except nx.NetworkXUnfeasible:
                continue
            candidate = (nx.cost_of_flow(graph, flow), list(selected))
            if best is None or candidate < best:
                best = candidate
    assert best is not None
    return best[1], best[0]


def fleet_reference() -> float:
    matrix = [[0, 1, 2, 3], [1, 0, 1, 2], [2, 1, 0, 1], [3, 2, 1, 0]]
    return min(
        matrix[0][route[0]]
        + sum(matrix[a][b] for a, b in zip(route, route[1:]))
        + matrix[route[-1]][0]
        for route in itertools.permutations((1, 2, 3))
    )


def main() -> None:
    project = project_results()
    shortest = shortest_path_reference()
    assert_close("Dijkstra vs NetworkX", project["shortestPath"]["dijkstra"], shortest)
    assert_close("A* vs NetworkX", project["shortestPath"]["astar"], shortest)

    flow_cost, flow_quantity = transport_reference()
    assert_close("min-cost flow cost", project["minCostFlow"]["cost"], flow_cost)
    assert_close("min-cost flow quantity", project["minCostFlow"]["flow"], flow_quantity)

    selected, facility_cost = facility_reference()
    if project["facility"]["selected"] != selected:
        raise AssertionError(
            f"facility subset: project={project['facility']['selected']}, reference={selected}"
        )
    assert_close("facility transport cost", project["facility"]["cost"], facility_cost)

    exact_fleet_cost = fleet_reference()
    if not project["fleet"]["feasible"] or project["fleet"]["routedDemand"] != 9:
        raise AssertionError("project Fleet route failed capacity/completeness validation")
    assert_close("tiny Fleet route vs exact TSP", project["fleet"]["cost"], exact_fleet_cost)

    print(
        "[geospatial-benchmark] PASS: project Dijkstra/A*, min-cost flow, exact facility "
        "enumeration and tiny Fleet route match independent NetworkX/exhaustive references."
    )


if __name__ == "__main__":
    main()
