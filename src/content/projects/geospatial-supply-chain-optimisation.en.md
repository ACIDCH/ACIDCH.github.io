---
translationKey: geospatial-supply-chain-optimisation
locale: en
slug: geospatial-supply-chain-optimisation
title: Geospatial Supply Chain Optimisation
summary: An Auckland-focused spatial decision project combining real road networks with facility location, service coverage, fleet routing, two-echelon transshipment, inventory and road uncertainty.
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
tags:
  - supply chain optimisation
  - geospatial analytics
  - facility location
  - road network
  - Auckland
  - GIS
updatedAt: 2026-08-18
---

## Project overview

This project places supply-chain optimisation back into real geographic space. The study area is Auckland: a verified 6×10 road-distance matrix remains available as a fast regression baseline, while an OSM edge-level mode builds a directed road graph, reruns Dijkstra under the active congestion, temporary-closure and hypothetical new-road scenario, and renders the optimal road path produced by that same scenario.

[Open the interactive GIS decision sandbox →](../../lab/geospatial-supply-chain/)

## From baseline model to real road network

The facility layer retains demand, capacity, service threshold, minimum coverage count, maximum open facilities, fixed cost and Auto / Must open / Exclude decision constraints. Course OD mode supports fast reproduction and high-run scenario simulation; OSM mode snaps facilities and demand points to a directed road graph and regenerates the OD matrix using travel time. Network / Flow / Coverage / Utilisation / Cost / Inventory / Risk map views all consume the same solved result rather than changing optimisation decisions themselves.

## Road uncertainty and service coverage

Road scenarios include Baseline, Congestion, Temporary Closure, New Road / Access Improvement and Mixed uncertainty. In OSM mode, congestion modifies edge travel time, closures make affected edges unavailable, and hypothetical new links enter the same road graph before shortest paths are recomputed. Coverage does not present a straight-line radius as a road service area: it runs bounded Dijkstra from the currently open facilities, renders the roads that are actually reachable within the service-time threshold, and distinguishes single coverage from 2×+ overlap.

## Fleet and two-echelon logistics

The fleet module converts solved Hub → Demand flows into a road-based TSP visit order, then splits the flow into actual trips using vehicle capacity. It checks both Fleet Size × Trips per Vehicle and the aggregate Fleet Size × Shift Hours capacity. Small networks use Exact TSP; larger custom networks use an explicitly labelled heuristic fallback. This module does not claim to be a full CVRP or per-vehicle time-window scheduler.

A separate Factory → Warehouse → Demand transshipment module is also available. Factory nodes are created through address input or map click, while Warehouse nodes use the warehouses currently opened by the main model. The network-flow formulation uses Warehouse-In → Warehouse-Out node splitting to impose a strict total throughput capacity, then solves a two-echelon minimum-cost flow using the active road-scenario costs. Factory-to-warehouse and warehouse-to-demand routes use separate semantics and visual encoding.

## Inventory and uncertainty

The inventory layer places mean demand, demand SD, lead time, service level and holding cost in the same scenario console as the spatial network. In addition to fixed lead time, Lead-time SD can be entered; the model combines demand variability and lead-time variability into a combined lead-time demand SD, then updates safety stock, ROP, holding-cost contribution and stockout simulation. Monte Carlo outputs include expected cost, P95 cost, infeasibility rate, average network cost, stockout probability and facility-selection stability, with a retained random seed for reproducibility.

## Geographic editing and scenario comparison

Natural-language addresses can be geocoded to real coordinates and inserted as Factory, Warehouse or Demand nodes. Locations can also be added by clicking the map, after which a batched road matrix updates the network input; custom nodes remain removable. Scenario A / B stores two parameter-and-solution states for comparison of facility count, cost and average network cost.

## Visual system and validation

The map remains the primary interface, with a scrollable parameter console in the upper right and a compact result module in the lower right. The real road layer reflects road hierarchy; Congestion, Closure and proposed links have distinct event semantics; verified optimal routes use flow-scaled directional particles, glow and node pulses, while Fleet Tour and two-echelon transshipment use separate line styles. Advanced visuals only consume verified model and route output.

The current version is formally delivered for Desktop Web. Core solvers, numerical acceptance, GIS functional checks, advanced visuals, Astro/TypeScript, ESLint, unit tests, security scanning, bilingual parity, production build and repository-wide regression are covered by automated validation; the verified course baseline remains visibly distinct from GIS-enhanced modes, and visual layers never change optimisation decisions.
