---
translationKey: geospatial-supply-chain-optimisation
locale: en
slug: geospatial-supply-chain-optimisation
title: Geospatial Supply Chain Optimisation
summary: An Auckland-focused spatial decision project combining real road networks with facility location, service coverage, capacity constraints, logistics allocation and route analysis.
tools:
  - Python
  - PuLP
  - OSMnx
  - NetworkX
  - GIS
  - Leaflet
  - OpenStreetMap
topic: transportation
status: in-development
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

This project places supply-chain optimisation back into real geographic space. The first release focuses on Auckland, retaining the demand, capacity, service-level and fixed-cost logic of facility-location models while replacing straight-line assumptions with network distances on traversable roads.

[Open the interactive GIS prototype →](/lab/geospatial-supply-chain/)

## Current V1

V1 implements two auditable layers. The first is road-network coverage: a verified matrix generated from OSMnx and NetworkX shortest paths links candidate facilities to demand areas, and the browser recomputes the minimum number of facilities as service thresholds change. The second is a capacity-and-cost baseline that preserves capacity limits, an 85% utilisation buffer, minimum area service, overall system service and fixed lease costs for later comparison with GIS-enhanced scenarios.

## Why GIS matters

A coordinate-distance model implicitly assumes that two locations can be connected directly. A real urban network contains water, bridges, directional streets, road hierarchies and disconnected links. This project therefore separates the geographic layer from the optimisation layer: the road network determines feasible distance, time and path geometry, while the supply-chain model determines which facilities open, which areas they serve and how flow is allocated.

## Method structure

The current prototype follows a geographic-network → distance-matrix → coverage-matrix → optimisation-decision → map-explanation pipeline. The baseline keeps the OSMnx, NetworkX and PuLP logic used in the verified learning model. The web layer performs fast scenario calculations on the checked matrix and places facilities, demand areas and allocation links back on an Auckland map. Future versions will add travel-time service areas, transportation flow, inventory and service-level decisions, demand and lead-time uncertainty, and disruption scenarios.

## Data and validation

Candidate facilities, demand areas and the current capacity/service constraints come from a verified learning model; the basemap uses OpenStreetMap. The interface does not present straight allocation links as street routes: allocation and routed geometry are separate layers, and an actual road path is only shown after a routing service returns road geometry successfully.

## Development status

The project is in development. Before production release it will pass model reproduction, GIS data checks, route-reachability checks, bilingual parity, mobile validation, production build and regression testing.