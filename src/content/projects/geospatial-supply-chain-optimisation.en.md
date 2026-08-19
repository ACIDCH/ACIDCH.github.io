---
translationKey: geospatial-supply-chain-optimisation
locale: en
slug: geospatial-supply-chain-optimisation
title: Geospatial Supply Chain Optimisation
summary: An Auckland road-network decision project that compares facilities, coverage, fleet, two-echelon flow, inventory and disruption scenarios, then translates cost–service–resilience trade-offs into interpretable management decisions.
tools:
  - JavaScript
  - Astro
  - GIS
  - Leaflet
  - OpenStreetMap
  - Overpass API
  - OSRM
topic: transportation
status: completed
featured: true
priority: 100
tags:
  - supply chain optimisation
  - geospatial analytics
  - facility location
  - road network
  - Auckland
  - GIS
updatedAt: 2026-08-20
---

## Project overview

This project places supply-chain optimisation back into real geographic space. The study area is Auckland: the Fast OD Network supports immediate solving and high-run scenario simulation, while the OSM Road Network builds a directed road graph, reruns Dijkstra under congestion, temporary closure and access-improvement scenarios, and renders the optimal paths produced by that same scenario. The aim is not simply to place points on a map; facilities, transport, inventory and road events share the same decision state so that each parameter change produces a new, explainable supply-chain plan.

[Open the interactive GIS decision sandbox →](../../lab/geospatial-supply-chain/)

## Decision questions this sandbox answers

The facility layer asks which candidate locations should open, how many may open, which locations must be included or excluded, and how cost changes under capacity and service-coverage constraints. The road layer asks whether existing service areas and allocation relationships still hold after congestion, closures or proposed access improvements. The fleet layer then separates two very different execution risks: road infeasibility versus a reachable road plan that simply lacks enough vehicles or trips.

The two-echelon module asks whether Factory → Warehouse → Demand flow can satisfy all demand under strict warehouse-throughput limits and how the flow should be reallocated when road conditions change. Inventory and Monte Carlo add safety stock, ROP, stockout risk, infeasibility probability and facility-selection stability to the same scenario decision. A / B comparison finally brings together what assumptions changed, what happened to cost and service, and whether the movement represents an improvement or a trade-off rather than reporting a few context-free deltas.

## Two complementary network engines

The facility layer retains demand, capacity, service threshold, minimum coverage count, maximum open facilities, fixed cost and Auto / Must open / Exclude decision constraints. The Fast OD Network uses road distance for rapid comparison across parameter sets. The OSM Road Network snaps facilities and demand points to a directed graph and regenerates the OD matrix using travel time. Network / Flow / Coverage / Utilisation / Cost / Inventory / Risk views consume the same solved result; changing the view does not change the optimisation decision.

## Road uncertainty and service coverage

Road scenarios include Baseline, Congestion, Temporary Closure, New Road / Access Improvement and Mixed uncertainty. In OSM mode, congestion modifies edge travel time, closures make affected roads unavailable, and hypothetical new links enter the same road graph before shortest paths are recomputed. Coverage first determines Covered / Uncovered demand from network distance or road reachability, then uses restrained pulse halos to identify active service facilities. OSM mode also renders roads reachable within the time threshold and distinguishes single coverage from 2×+ overlap.

## Fleet and two-echelon logistics

The fleet module converts solved Hub → Demand flows into a road-based TSP visit order, then splits the flow into trips using vehicle capacity. It checks both Fleet Size × Trips per Vehicle and aggregate Fleet Size × Shift Hours capacity. Small networks use Exact TSP; larger custom networks use a heuristic visit order. A road tour is accepted only when it can visit every allocated demand and return to the originating facility. The explicit modelling boundary is road TSP + capacity splitting + aggregate fleet checks; it is not presented as a full CVRP or a time-window VRP.

A separate Factory → Warehouse → Demand transshipment module is also available. Factory nodes are created through address input or map click, while Warehouse nodes use the warehouses currently opened by the main model. The network-flow formulation uses Warehouse-In → Warehouse-Out node splitting to impose a strict total throughput capacity, then solves a two-echelon minimum-cost flow using the active road-scenario costs. Factory-to-warehouse and warehouse-to-demand routes use separate semantics and visual encoding.

## Inventory and uncertainty

The inventory layer places mean demand, demand SD, lead time, service level and holding cost in the same scenario console as the spatial network. In addition to fixed lead time, Lead-time SD can be entered; the model combines demand variability and lead-time variability into a combined lead-time demand SD, then updates safety stock, ROP, holding-cost contribution and stockout simulation. Monte Carlo outputs include expected cost, P95 cost, infeasibility rate, average delivery distance or travel time, stockout probability and facility-selection stability, with a retained random seed for reproducibility.

## Geographic editing and scenario comparison

Natural-language addresses can be geocoded to real coordinates and inserted as Factory, Warehouse or Demand nodes. Locations can also be added by clicking the map, after which a batched road matrix updates the network input; custom nodes remain removable. Scenario A / B now saves the current key assumptions, solved KPIs, open facilities and any current Monte Carlo result. Comparison reports changes in cost, coverage, facility count and like-for-like network performance, and lists which assumptions changed. If A and B use different network engines, the interface does not subtract Fast OD kilometres from OSM minutes; the network KPI is explicitly marked as not directly comparable.

## Reading the result and its boundaries

On desktop, the map remains the primary interface, with a scrollable parameter console in the upper right and a compact result module in the lower right. The road layer reflects hierarchy; Congestion, Closure and proposed links have distinct event semantics; optimal routes use flow-scaled directional particles, glow and node pulses, while Fleet Tour and two-echelon transshipment use separate line styles. The result module separates physical network measures from monetary measures: Fast OD reports average delivery distance, OSM reports average travel time, and transport cost remains distinct from total scenario cost. The A / B decision summary turns cost–service movements into neutral interpretation without assuming the manager's preferred trade-off.

The current release supports both desktop and mobile interaction: desktop keeps the parallel map, controls and results workspace, while narrow screens use a Map / Controls / Results switcher with the map as the default view. Facility allocation, two-echelon transshipment, fleet planning and inventory risk remain separate decision layers, while the visual system only renders solved network and flow results. If an external GIS service is unavailable, the sandbox can continue from its Fast OD Network rather than losing the current decision state.
