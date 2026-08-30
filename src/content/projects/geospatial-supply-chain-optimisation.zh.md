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
updatedAt: 2026-08-30
---

## 项目概览

这个项目把供应链优化放回真实地理空间。研究区域为 Auckland。页面内置带版本信息的紧凑 OSM 道路快照，首次求解不依赖实时 Overpass；快速 OD 引擎用于即时情景分析，OSM 引擎则在拥堵、临时封路和通行改善情景下重算有向路网，并绘制同一情景产生的道路路径。设施、运输、库存与道路事件共享同一组决策状态，使每一次参数变化都能重新形成可解释的供应链方案。

[打开交互式 GIS 决策沙盘 →](../../lab/geospatial-supply-chain/)

## 这个沙盘回答什么问题

设施层回答“应该开启哪些候选点、最多开多少、哪些必须开启或排除，以及在容量和服务覆盖约束下成本会怎样变化”。道路层回答“拥堵、封路或新增通道发生后，原来的服务范围和最优配送关系是否仍然成立”。车队层进一步区分“道路本身不可达”和“道路可达但车辆 / trips 不够”这两类完全不同的执行风险。

两级转运模块回答 Factory → Warehouse → Demand 网络在严格仓库吞吐容量下能否完成全部流量，以及道路情景改变后流量应该如何重分配。库存与 Monte Carlo 则把安全库存、ROP、缺货风险、不可行概率和设施选择稳定性加入同一个情景判断。A / B 比较最终把“改了什么假设、成本和服务发生了什么变化、这个变化属于改善还是 trade-off”放在一起阅读，而不是只给出几个脱离上下文的差值。

## 两套互补的网络引擎

每个路网矩阵都明确保存公里、分钟与 NZD 广义成本。每公里成本和每分钟成本是独立可见的假设，因此快速 OD 与 OSM 引擎使用相同物理含义的优化目标。结果不会把 km 与 OSM 的 min 当成同一量纲直接比较。实体变化后会重建完整受影响矩阵，不混用不同计算方法。Network / Flow / Coverage / Utilisation / Cost / Inventory / Risk 七个视图只读取同一份结构化求解结果。

## 路网不确定性与覆盖

路网情景支持 Baseline、Congestion、Temporary Closure、New Road / Access Improvement 和 Mixed uncertainty。OSM 模式下，拥堵修改道路行程时间，封路使相应路段不可用，假设新增连接进入同一张道路图，然后重新计算最短路。Coverage 视图先按网络距离或道路可达性判断需求点的 Covered / Uncovered 状态，再用柔和扩散环强调当前服务据点；OSM 模式同时绘制阈值内可达道路，并区分单覆盖与 2×+ 重叠覆盖。

带固定种子的关联事件会组合道路与业务影响，包括港湾通道中断、CBD 拥堵、仓库停运、工厂产能损失、需求激增和严重天气。严重情景如果不可行，会明确显示不可行，而不是静默切换到无关基线。

## 统一两级物流与车队路线

主模型统一求解 Factory → Candidate Warehouse → Demand。工厂供给、仓库开启与吞吐容量、服务覆盖、冗余、Must open / Exclude 和需求满足同时进入约束。候选仓库较少时使用精确子集枚举与最小成本流；规模扩大后切换到确定性启发式，并在界面如实标注。

车队模块直接读取结构化 Warehouse → Demand 分配。Split-delivery Clarke–Wright 与 2-opt 生成满足容量和返仓要求的路线，再把每趟分配给具体车辆，逐车检查班次小时与趟数上限。工厂到仓库、仓库到需求和车队路线仍保留不同的地图语义。

## 库存与不确定性

库存层将 mean demand、demand SD、lead time、service level 和 holding cost 与空间网络放在同一个控制台；需求波动与提前期波动先合并，再计算 safety stock 和 ROP。带固定种子的 Monte Carlo 在带情景版本号的 Web Worker 中运行，输出 expected cost、P95、CVaR95、failure rate、expected unmet demand、stockout probability、facility-selection stability 与成本分布。浏览器如果阻止模块 Worker，会明确标注使用作品集规模的 FALLBACK。

道路关键性分析从当前高流量最优路径挑选候选边，逐条移除后重新计算受影响运输路径，衡量广义 NZD 成本增量、延误与未满足需求。关键性地图清楚解释分值；真正的两级 Sankey 以实际求解流量控制连线宽度；点击 Factory、Warehouse 或 Demand 节点会打开结构化解释抽屉，显示分配、利用率、替代方案、上游路径与风险证据。

## 地理编辑与情景比较

自然语言地址可以通过 geocoding 转成真实坐标并加入 Factory、Warehouse 或 Demand；也可以直接点击地图增加节点，随后重建完整受影响道路矩阵。自定义节点可以删除。Scenario A / B 在保存时同时记录当前关键假设、求解 KPI、开启设施以及可用的 Monte Carlo 结果；比较时展示成本、覆盖、设施和同单位网络指标的变化。如果成本定义、定价签名或网络指标不一致，系统会阻止没有物理意义的差值比较。

## 结果阅读与模型边界

桌面端以地图为项目主体，右上为可滚动参数控制台，右下为结果模块。道路层按 road hierarchy 显示，Congestion、Closure 和 proposed links 分别使用不同事件视觉；主最优路径根据实际 flow 显示方向性粒子、路线辉光和节点脉冲，Fleet Tour 与两级转运采用独立线型。结果模块把物理网络指标与货币指标分开：快速 OD 网络显示平均配送距离，OSM 路网显示平均行程时间，运输成本与情景总成本分别呈现。A / B 决策摘要进一步把成本—服务权衡转成中性解释，不替使用者预设管理偏好。

当前交互同时支持桌面与移动端：桌面保留地图、参数与结果并行工作区；窄屏通过“地图 / 参数 / 结果”三视图切换，并默认优先展示地图。设施分配、两级转运、车队规划和库存风险分别保持清晰的模型边界；地图视觉层只读取已经求解的道路与物流结果。

道路拓扑来自 OpenStreetMap，OSRM 提供可选道路矩阵与路线几何，Nominatim 提供可选地理编码，底图来自 CARTO / OSM。需求与容量是作品集演示数据，不是保密商业数据。公共 GIS 服务只按 best-effort 使用：请求具备 timeout、cache、retry 与 pacing 控制；失败时保留内置 Auckland 路网和适用的有效结果。拥堵是情景假设而非实时交通；当前车队模块采用拆单 Clarke–Wright 与 2-opt 启发式，不是完整 CVRP 的全局精确求解器；大规模候选点结果也不保证全局最优；关键性属于当前分配下的路径应急分析，不是全路网穷举阻断优化。
