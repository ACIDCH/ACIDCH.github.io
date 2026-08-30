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
updatedAt: 2026-08-30
---

## Project overview

This project places supply-chain optimisation back into real geographic space. The study area is Auckland. A versioned compact OSM road snapshot makes the first solve independent of live Overpass availability; the Fast OD engine supports immediate scenario work, while the OSM engine recomputes the directed graph under congestion, temporary closure and access-improvement scenarios and renders paths from that same scenario. Facilities, transport, inventory and road events share one decision state so that each parameter change produces a new, explainable supply-chain plan.

[Open the interactive GIS decision sandbox →](../../lab/geospatial-supply-chain/)

## Decision questions this sandbox answers

The facility layer asks which candidate locations should open, how many may open, which locations must be included or excluded, and how cost changes under capacity and service-coverage constraints. The road layer asks whether existing service areas and allocation relationships still hold after congestion, closures or proposed access improvements. The fleet layer then separates two very different execution risks: road infeasibility versus a reachable road plan that simply lacks enough vehicles or trips.

The two-echelon module asks whether Factory → Warehouse → Demand flow can satisfy all demand under strict warehouse-throughput limits and how the flow should be reallocated when road conditions change. Inventory and Monte Carlo add safety stock, ROP, stockout risk, infeasibility probability and facility-selection stability to the same scenario decision. A / B comparison finally brings together what assumptions changed, what happened to cost and service, and whether the movement represents an improvement or a trade-off rather than reporting a few context-free deltas.

## Two complementary network engines

Every network matrix carries road distance in km, duration in minutes and a generalised cost in NZD. Cost per km and cost per minute are explicit assumptions, so the optimisation objective keeps the same physical meaning across the Fast OD and OSM engines. The summary never compares Fast OD kilometres from OSM minutes as though they were the same measure. Entity changes rebuild the complete affected matrix rather than mixing calculation methods. Network / Flow / Coverage / Utilisation / Cost / Inventory / Risk views consume the same structured result; changing a view does not change the decision.

## Road uncertainty and service coverage

Road scenarios include Baseline, Congestion, Temporary Closure, New Road / Access Improvement and Mixed uncertainty. In OSM mode, congestion modifies edge travel time, closures make affected roads unavailable, and hypothetical new links enter the same road graph before shortest paths are recomputed. Coverage first determines Covered / Uncovered demand from network distance or road reachability, then uses restrained pulse halos to identify active service facilities. OSM mode also renders roads reachable within the time threshold and distinguishes single coverage from 2×+ overlap.

Seeded correlated presets combine road and business effects for Harbour disruption, CBD congestion, warehouse outage, factory capacity loss, demand surge and severe weather. A severe event may correctly produce an explicit infeasible result rather than silently falling back to an unrelated scenario.

## Integrated two-echelon logistics and fleet routing

The main model solves Factory → Candidate Warehouse → Demand as one network. Factory supply, warehouse opening, throughput, service coverage, redundancy, must-open / excluded policies and demand satisfaction are enforced together. Small candidate sets use exact subset enumeration plus minimum-cost flow; larger sets switch to a deterministic heuristic and are labelled accordingly.

The fleet module reads those structured Warehouse → Demand allocations directly. Split-delivery Clarke–Wright construction and 2-opt produce capacity-feasible routes, including depot return. Trips are then assigned to individual vehicles, with shift hours and trips per vehicle checked for every vehicle rather than only as an aggregate. Factory-to-warehouse, warehouse-to-demand and fleet routes retain separate map semantics.

## Inventory and uncertainty

The inventory layer places mean demand, demand SD, lead time, service level and holding cost in the same scenario console as the spatial network. Lead-time variability is combined with demand variability before safety stock and reorder point are calculated. Seeded Monte Carlo runs in a revision-aware Web Worker and outputs expected cost, P95, CVaR95, failure rate, expected unmet demand, stockout probability, facility-selection stability and a cost distribution. Browsers that block module Workers use an explicitly labelled portfolio-scale fallback.

Road criticality tests the current high-flow route edges by removing each candidate, rerouting affected shipments and measuring additional generalised NZD cost, delay and unmet demand. A criticality map makes the scale explicit. A true two-echelon Sankey uses solved flow as link width, while clicking a Factory, Warehouse or Demand node opens a structured explanation of its assignment, utilisation, alternative, upstream path and risk evidence.

## Geographic editing and scenario comparison

Natural-language addresses can be geocoded to real coordinates and inserted as Factory, Warehouse or Demand nodes. Locations can also be added by clicking the map, after which the complete affected road matrix is rebuilt; custom nodes remain removable. Scenario A / B saves the current assumptions, solved KPIs, open facilities and any current Monte Carlo result. Comparison reports changes in cost, coverage, facility count and like-for-like network performance, and blocks cost deltas when the underlying metric or pricing definition is not comparable.

## Reading the result and its boundaries

On desktop, the map remains the primary interface, with a scrollable parameter console in the upper right and a compact result module in the lower right. The road layer reflects hierarchy; Congestion, Closure and proposed links have distinct event semantics; optimal routes use flow-scaled directional particles, glow and node pulses, while Fleet Tour and two-echelon transshipment use separate line styles. The result module separates physical network measures from monetary measures: Fast OD reports average delivery distance, OSM reports average travel time, and transport cost remains distinct from total scenario cost. The A / B decision summary turns cost–service movements into neutral interpretation without assuming the manager's preferred trade-off.

The current release supports both desktop and mobile interaction: desktop keeps the parallel map, controls and results workspace, while narrow screens use a Map / Controls / Results switcher with the map as the default view. Facility allocation, two-echelon transshipment, fleet planning and inventory risk remain separate decision layers, while the visual system only renders solved network and flow results.

OpenStreetMap supplies road topology, OSRM supplies optional road tables and route geometry, Nominatim supplies optional geocoding, and CARTO / OSM supply the basemap. Demand and capacity values are illustrative portfolio inputs rather than confidential operational data. Public GIS services are best-effort: requests use timeout, caching, retry and pacing controls, and failures preserve the built-in Auckland graph and existing valid decisions where appropriate. Congestion remains scenario-based rather than live traffic; the fleet module uses split-delivery Clarke–Wright plus 2-opt rather than a globally exact full CVRP solver; large-candidate results are also not guaranteed globally optimal; and criticality is a current-allocation route-contingency analysis rather than exhaustive network interdiction.
