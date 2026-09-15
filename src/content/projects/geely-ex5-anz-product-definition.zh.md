---
translationKey: geely-ex5-anz-product-definition
locale: zh
slug: geely-ex5-anz-product-definition
title: Geely EX5 澳新市场产品定义与竞品对标
summary: 基于 2026-09-15 的公开市场快照，对 Geely EX5 在澳大利亚与新西兰进行价格、续航、充电、竞品与用户体验对标，并把证据转化为分市场的 Must / Should / Explore 产品需求与验证计划。
tools:
  - Market Research
  - Competitive Benchmarking
  - Product Definition
  - JavaScript
  - Astro
topic: analytics
status: completed
featured: true
priority: 90
tags:
  - product strategy
  - market research
  - competitor analysis
  - EV
  - Australia
  - New Zealand
updatedAt: 2026-09-15
---

## 项目背景

Geely EX5 已进入澳大利亚与新西兰，但两个市场的产品组合并不完全相同。这个项目不把“海外产品定义”理解为简单罗列竞品参数，而是按照公开数据可验证的顺序回答：目标车型当前强在哪里、竞争窗口在哪里、哪些体验问题已经有足够证据、哪些仍只是待验证假设，以及区域产品线应该如何取舍。

吉利公开资料明确提到澳新市场采用本地化运营，并延续 “one country, one policy” 的海外策略。因此，本项目把 Australia 和 New Zealand 分开分析，再寻找可以共用的软件、底盘和版本规划问题。

[打开交互式产品定义工作台 →](../../lab/geely-ex5-anz-product-definition/)

## 数据与方法

市场快照固定在 **2026-09-15**。规格优先来自品牌官网和官方规格表；在官方当前页面没有完整给出澳大利亚价格规格时，使用可追溯的车型媒体数据补充。竞品范围集中在价格和尺寸相近的纯电 SUV，包括 BYD ATTO 3 / ATTO 3 EVO、Kia EV3 与 MG MGS5 EV。

分析保留每一行的价格口径。New Zealand 主要采用 + ORC，Australia 的 Geely、BYD 与 Kia 使用 before ORC；MG 当前公开的是 drive-away 优惠价，因此只做规格参照，不把它强行放进同口径价格效率计算。

用户体验证据分成三层：公开规格回答“车能做什么”，专业评测回答“独立测试发现了什么”，车主社区回答“有哪些问题值得继续问”。社区样本不代表总体，因此只用于生成下一轮用户研究题目，而不会直接写成“用户普遍认为”。

## 竞品对标结果

在 New Zealand，EX5 Complete 以 **NZ$49,990 + ORC / 430 km WLTP** 保持明确的入门价格锚点。Kia EV3 Light SR 为 **NZ$55,520 + ORC / 436 km**，长续航 Light LR 达到 **605 km**，但价格也上升到 **NZ$62,220 + ORC**。EX5 Inspire Extended Range 为 **NZ$56,990 + ORC / 450 km**，说明高配版本的主要竞争压力已经从“是否有足够配置”转向“长途续航与充电能力是否足够有说服力”。

更重要的是版本结构：New Zealand 的 Complete 使用 **60 kWh** 电池，而 Inspire Extended Range 使用 **68 kWh**；Australia 的 2026 Complete 已经采用 **68.39 kWh** Extended Range，达到 **475 km WLTP**。这意味着“Complete Extended Range”并不是虚构配置，而是已经存在于另一个澳新市场的真实产品组合。

在 Australia，EX5 Complete Extended Range 与 ATTO 3 EVO Dynamic 同为 **A$41,990 before ORC**，EX5 为 **475 km WLTP**，比 Dynamic 的 **420 km** 多 **55 km**，因此入门版本仍有很强的价格—续航组合。但在高配区间，EX5 Inspire 为 **A$45,990 / 450 km / 100 kW DC**，ATTO 3 EVO Premium 为 **A$46,990 / 510 km / 220 kW DC / 230 kW RWD**。高配竞争已经明显转向长途能力、充电与动力差异化。

## 用户体验证据

2026 年 CarExpert 对 EX5 的独立评测把 **易用性、驾驶辅助干预和偏软的车身控制**列为主要短板。澳大利亚车主社区也反复出现驾驶配置保存、快捷关闭/调整辅助系统、多驾驶员配置、杯架尺寸和软件细节等讨论。不过社区反馈同时显示 OTA 更新已经改善部分操作，因此更合理的产品定义不是把问题固定为“软件差”，而是把 **本地默认逻辑、设置持久化、快捷入口与多驾驶员场景**列为持续验证和优化对象。

底盘部分也采用同样的证据边界。专业评测在起伏路面记录到明显的上下浮动，但车主主观评价并不完全一致。因此项目没有直接提出“必须更换悬架”，而是把 **ANZ 真实道路底盘标定验证**设为 Must：先在 Auckland / Wellington 与 Sydney / Melbourne 的代表性道路上测试纵向车身控制和转向手感，再决定是否需要区域标定变化。

## 产品定义输出

最终需求不使用虚构的 87 分、92 分之类综合评分，而采用更容易解释和追问的三档优先级。

**Must — ANZ 软件与驾驶设置本地化。** 验证驾驶偏好能否稳定保存、高频 ADAS 设置能否快速到达、双驾驶员家庭能否顺畅切换配置。下一步用 12–15 名现有车主完成任务测试，记录重启后的设置保持、完成常用设置所需点击次数与双用户切换成功率。

**Must — ANZ 本地道路底盘验证。** 用典型城市接缝、起伏郊区道路和高速路面做 A/B 评价，观察一次起伏后的余振、转向中心感和乘员舒适评分。只有验证结果稳定后才进入底盘标定建议。

**Should — New Zealand 测试 Complete Extended Range 中间版本。** 不建议直接用更大电池替换 NZ$49,990 的 60 kWh Complete，因为入门价格本身就是产品竞争力。更值得测试的是把 Australia 已存在的 Complete ER 组合引入 New Zealand，放在 Complete 与 Inspire 之间，验证“需要更长续航但不需要完整高配舒适功能”的用户是否足以支撑一个新增 SKU。

**Should — Australia 强化 Inspire 的长途差异化。** 当 ATTO 3 EVO Premium 已经把 510 km / 220 kW DC 带到接近价位，Inspire 下一阶段的优先研究方向应该是续航、充电和软件体验，而不是继续堆叠不影响长途任务的舒适配置。

**Explore — 家庭共享用车与小型实用性。** 多用户 App、行程能耗可见性、杯架/储物等只来自方向性社区样本，应先做双驾驶员家庭访谈与 7 天日记研究，再决定它属于 OTA、附件方案还是下一年型硬件改动。

## 项目边界

这是独立公开数据案例，不是吉利内部项目，也没有使用销量后台、真实成本、研发可行性、供应链约束或未公开用户数据。因此，“Complete Extended Range 进入 New Zealand”等输出是 **待验证产品概念**，不是对企业真实决策的陈述。

真正进入量产规划前，还需要补充区域销量与版本 mix、价格敏感度、零部件与认证成本、充电行为、经销商反馈、结构化用户研究和工程验证。这个项目的价值在于把公开市场信息整理成一条可以继续验证的产品决策链，而不是用公开资料假装已经完成企业内部产品定义。

### 可复现数据

- [竞品基准 CSV](../../../data/geely-ex5-anz-product-definition/benchmark.csv)
- [用户证据与产品需求 CSV](../../../data/geely-ex5-anz-product-definition/evidence-requirements.csv)
- 交互页保留每项公开数据的来源和价格口径，便于后续按新的车型年、价格或 OTA 状态更新。
