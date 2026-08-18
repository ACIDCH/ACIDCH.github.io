---
translationKey: geospatial-supply-chain-optimisation
locale: zh
slug: geospatial-supply-chain-optimisation
title: 基于地理空间的供应链优化
summary: 以奥克兰真实道路网络为地理基础，把设施选址、服务覆盖、车队路线、两级转运、库存与路网不确定性组织成一个可交互的供应链空间决策项目。
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

## 项目概览

这个项目把供应链优化放回真实地理空间。研究区域为 Auckland：一套已经核验的 6×10 道路距离矩阵作为快速回归基线，同时提供 OSM edge-level 道路图模式，在当前拥堵、临时封路和假设新增道路情景下重新运行 Dijkstra，并把同一个情景产生的最优道路路径重新绘制到地图。

[打开交互式 GIS 决策沙盘 →](/zh/lab/geospatial-supply-chain/)

## 从基线模型到真实路网

设施层保留需求、容量、服务阈值、最低覆盖次数、最多开启设施、固定成本与 Auto / Must open / Exclude 等决策约束。Course OD 模式用于快速复现和大量情景模拟；OSM 模式将候选设施和需求点吸附到有向道路图，用 travel time 重新生成 OD matrix。Network / Flow / Coverage / Utilisation / Cost / Inventory / Risk 七个地图视图使用同一套求解结果，不让视觉图层反过来改变模型。

## 路网不确定性与覆盖

路网情景支持 Baseline、Congestion、Temporary Closure、New Road / Access Improvement 和 Mixed uncertainty。OSM 模式下，拥堵修改 edge travel time，封路使相应 edge 不可用，假设新增连接进入同一张 road graph，然后重新计算最短路。Coverage 视图不使用直线半径冒充道路服务区，而是从当前开启设施执行 bounded Dijkstra，在服务时间阈值内绘制真正可达的道路，并区分单覆盖与 2×+ 重叠覆盖。

## 车队与两级物流

车队模块把已求解的 Hub → Demand 流量转换为 road-based TSP 访问顺序，再根据单车容量拆分为实际 trips，并检查 Fleet Size × Trips per Vehicle 以及 Fleet Size × Shift Hours 的聚合运力。小型网络使用 Exact TSP，规模扩大后使用明确标注的 heuristic fallback；这一模块不宣称为完整 CVRP 或逐车时间窗排班。

另外提供独立的 Factory → Warehouse → Demand 两级转运模块。Factory 由地址输入或地图点击建立，Warehouse 使用主模型当前开启的仓库；网络流采用 Warehouse-In → Warehouse-Out node splitting 严格限制仓库总吞吐量，并用当前道路情景的真实路网成本求解两级最小成本流。工厂到仓库与仓库到需求采用不同路线语义和视觉编码。

## 库存与不确定性

库存层将 mean demand、demand SD、lead time、service level 和 holding cost 与空间网络放在同一个情景控制台。除固定提前期外，还可以输入 Lead-time SD；模型按需求波动与提前期波动的联合方差计算 combined lead-time demand SD，再更新 safety stock、ROP、holding-cost contribution 与 stockout simulation。Monte Carlo 模块进一步输出 expected cost、P95 cost、infeasibility rate、average network cost、stockout probability 和 facility-selection stability，并保留随机种子以便复现。

## 地理编辑与情景比较

自然语言地址可以通过 geocoding 转成真实坐标并加入 Factory、Warehouse 或 Demand；也可以直接点击地图增加节点，再通过 batched road matrix 更新网络输入。自定义节点可以删除。Scenario A / B 可以保存两组参数与求解结果，用于比较设施数量、成本和平均网络成本的变化。

## 视觉与验证

地图是项目主体，右上为可滚动参数控制台，右下为结果模块。真实道路层按 road hierarchy 显示，Congestion、Closure 和 proposed links 分别使用不同事件视觉；主最优路径根据实际 flow 显示方向性粒子、路线辉光和节点脉冲，Fleet Tour 与两级转运采用独立线型。所有高级视觉只读取已经验证的模型和路径结果。

当前版本以 Desktop Web 为正式交付目标。核心求解器、数值验收、GIS 功能验收、高级视觉、Astro/TypeScript、ESLint、单元测试、安全扫描、双语同步、production build 与全站回归均纳入自动化验证；课程基线与 GIS 增强模式保持清晰区分，视觉层不会反向改变优化决策。
