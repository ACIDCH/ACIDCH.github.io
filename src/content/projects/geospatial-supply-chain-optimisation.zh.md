---
translationKey: geospatial-supply-chain-optimisation
locale: zh
slug: geospatial-supply-chain-optimisation
title: 基于地理空间的供应链优化
summary: 以真实奥克兰道路网络为地理基础，把设施选址、服务覆盖、容量约束、物流分配与路径计算组织成一个可交互的供应链空间决策项目。
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

## 项目概览

这个项目把供应链优化模型放回真实地理空间中。第一阶段以奥克兰为研究区域，保留设施选址与覆盖模型中的需求、容量、服务水平和固定成本逻辑，同时使用真实道路网络替代简单直线距离，让“距离”变成可行道路上的网络距离。

[打开交互式 GIS 原型 →](/zh/lab/geospatial-supply-chain/)

## 当前 V1

V1 先实现两个可以核验的层次。第一层是道路网络覆盖：候选设施到需求区域之间使用课程模型中由 OSMnx 与 NetworkX 最短路生成的道路距离矩阵，根据服务距离阈值重新计算最少设施数量与覆盖关系。第二层是容量与成本基线：保留容量上限、85% 利用率缓冲、分区最低服务水平、系统服务水平和固定租赁成本，用作后续 GIS 增强模型的验证基准。

## 为什么需要 GIS

传统设施选址如果直接使用坐标距离，会默认两个地点之间可以直线通行。真实城市网络存在海湾、道路方向、桥梁、道路等级和不可达连接，因此这个项目把地理层与供应链决策层分开：道路网络负责生成可行的距离、时间和路径，优化模型负责决定设施是否开启、哪些区域由哪些设施服务，以及物流量如何分配。

## 方法结构

当前原型采用“地理网络 → 距离矩阵 → 覆盖矩阵 → 优化决策 → 地图解释”的流程。课程基线继续使用 OSMnx、NetworkX 与 PuLP 的方法逻辑；网页端负责对已经核验的矩阵进行快速情景计算，并将设施、需求区域和分配关系放回奥克兰地图。后续版本会加入按道路时间计算的服务区、运输流、库存与服务水平、需求与提前期不确定性，以及道路中断等情景。

## 数据与验证

候选设施、需求区域以及当前容量/服务约束来自已核验的学习模型；道路地图使用 OpenStreetMap。网页不会把直线连接冒充真实行车路线：分配关系与道路路径采用不同图层表示，只有成功取得道路路由几何后才显示为实际道路路径。

## 开发状态

当前项目处于开发阶段。正式上线前需要完成模型复现、GIS 数据检查、路由可达性检查、双语同步、移动端检查以及网站构建与回归测试。