---
translationKey: geospatial-supply-chain-optimisation
locale: zh
slug: geospatial-supply-chain-optimisation
title: 基于地理空间的供应链优化
summary: 以奥克兰真实道路网络为基础，在设施、覆盖、车队、两级转运、库存与道路扰动之间做可复现情景比较，并把成本—服务—韧性权衡转化为可解释的管理决策。
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

## 项目概览

这个项目把供应链优化放回真实地理空间。研究区域为 Auckland：快速 OD 网络支持即时求解和大批量情景模拟，OSM 路网则构建有向道路图，在拥堵、临时封路和通行改善情景下重新运行 Dijkstra，并把同一情景产生的最优道路路径绘制到地图。项目重点不是“在地图上画点”，而是让设施、运输、库存与道路事件共享同一组决策状态，使每一次参数变化都能重新形成可解释的供应链方案。

[打开交互式 GIS 决策沙盘 →](../../lab/geospatial-supply-chain/)

## 这个沙盘回答什么问题

设施层回答“应该开启哪些候选点、最多开多少、哪些必须开启或排除，以及在容量和服务覆盖约束下成本会怎样变化”。道路层回答“拥堵、封路或新增通道发生后，原来的服务范围和最优配送关系是否仍然成立”。车队层进一步区分“道路本身不可达”和“道路可达但车辆 / trips 不够”这两类完全不同的执行风险。

两级转运模块回答 Factory → Warehouse → Demand 网络在严格仓库吞吐容量下能否完成全部流量，以及道路情景改变后流量应该如何重分配。库存与 Monte Carlo 则把安全库存、ROP、缺货风险、不可行概率和设施选择稳定性加入同一个情景判断。A / B 比较最终把“改了什么假设、成本和服务发生了什么变化、这个变化属于改善还是 trade-off”放在一起阅读，而不是只给出几个脱离上下文的差值。

## 两套互补的网络引擎

设施层保留需求、容量、服务阈值、最低覆盖次数、最多开启设施、固定成本与 Auto / Must open / Exclude 等决策约束。快速 OD 网络以道路距离衡量服务成本，适合快速比较多组参数；OSM 路网把候选设施和需求点吸附到有向道路图，以行程时间重新生成 OD 矩阵。Network / Flow / Coverage / Utilisation / Cost / Inventory / Risk 七个地图视图读取同一套求解结果，切换视图不会改变优化决策。

## 路网不确定性与覆盖

路网情景支持 Baseline、Congestion、Temporary Closure、New Road / Access Improvement 和 Mixed uncertainty。OSM 模式下，拥堵修改道路行程时间，封路使相应路段不可用，假设新增连接进入同一张道路图，然后重新计算最短路。Coverage 视图先按网络距离或道路可达性判断需求点的 Covered / Uncovered 状态，再用柔和扩散环强调当前服务据点；OSM 模式同时绘制阈值内可达道路，并区分单覆盖与 2×+ 重叠覆盖。

## 车队与两级物流

车队模块把已求解的 Hub → Demand 流量转换为道路 TSP 访问顺序，再根据单车容量拆分为实际 trips，并检查 Fleet Size × Trips per Vehicle 以及 Fleet Size × Shift Hours 的聚合运力。小型网络使用 Exact TSP，规模扩大后切换为启发式访问顺序；只有能够访问全部已分配需求并返回出发设施的完整道路 tour 才会被接受。这里的模型边界是 road TSP + capacity splitting + aggregate fleet checks，不把它包装成完整 CVRP 或带时间窗 VRP。

另外提供独立的 Factory → Warehouse → Demand 两级转运模块。Factory 由地址输入或地图点击建立，Warehouse 使用主模型当前开启的仓库；网络流采用 Warehouse-In → Warehouse-Out node splitting 严格限制仓库总吞吐量，并用当前道路情景的真实路网成本求解两级最小成本流。工厂到仓库与仓库到需求采用不同路线语义和视觉编码。

## 库存与不确定性

库存层将 mean demand、demand SD、lead time、service level 和 holding cost 与空间网络放在同一个情景控制台。除固定提前期外，还可以输入 Lead-time SD；模型按需求波动与提前期波动的联合方差计算 combined lead-time demand SD，再更新 safety stock、ROP、holding-cost contribution 与 stockout simulation。Monte Carlo 模块进一步输出 expected cost、P95 cost、infeasibility rate、平均配送距离或平均行程时间、stockout probability 和 facility-selection stability，并保留随机种子以便复现。

## 地理编辑与情景比较

自然语言地址可以通过 geocoding 转成真实坐标并加入 Factory、Warehouse 或 Demand；也可以直接点击地图增加节点，再通过 batched road matrix 更新网络输入。自定义节点可以删除。Scenario A / B 在保存时同时记录当前关键假设、求解 KPI、开启设施以及可用的 Monte Carlo 结果；比较时展示成本、覆盖、设施和同单位网络指标的变化，并列出发生变化的参数。若 A 与 B 使用不同网络引擎，系统不会把 Fast OD 的 km 与 OSM 的 min 直接相减，而是明确标记网络 KPI 不可直接比较。

## 结果阅读与模型边界

桌面端以地图为项目主体，右上为可滚动参数控制台，右下为结果模块。道路层按 road hierarchy 显示，Congestion、Closure 和 proposed links 分别使用不同事件视觉；主最优路径根据实际 flow 显示方向性粒子、路线辉光和节点脉冲，Fleet Tour 与两级转运采用独立线型。结果模块把物理网络指标与货币指标分开：快速 OD 网络显示平均配送距离，OSM 路网显示平均行程时间，运输成本与情景总成本分别呈现。A / B 决策摘要进一步把成本—服务权衡转成中性解释，不替使用者预设管理偏好。

当前交互同时支持桌面与移动端：桌面保留地图、参数与结果并行工作区；窄屏通过“地图 / 参数 / 结果”三视图切换，并默认优先展示地图。设施分配、两级转运、车队规划和库存风险分别保持清晰的模型边界；地图视觉层只读取已经求解的道路与物流结果。外部 GIS 服务不可用时，决策沙盘仍可从快速 OD 网络继续进行情景分析，而不会丢失当前决策状态。
