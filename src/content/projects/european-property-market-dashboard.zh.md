---
translationKey: european-property-market-dashboard
locale: zh
slug: european-property-market-dashboard
title: 欧洲房地产开发市场 Power BI 分析
summary: 结合房价、工资与通胀指标，对八个欧洲市场的增长、可负担性和开发优先级进行比较。
tools:
  - Power BI
  - Power Query
  - DAX
  - 数据建模
topic: analytics
status: completed
featured: true
tags:
  - Dashboard
  - 数据可视化
  - 欧洲房地产
  - 房价
  - 工资
  - 通胀
  - 可负担性
updatedAt: 2026-07-30
---

## 项目概览

Dashboard 以 2015–2024 年的房价、工资与 HICP 指标比较 8 个欧洲市场，并用 5 项等权排名回答开发选址问题。4 个报表页面依次呈现长期增长、近期动量、买方可负担性与最终优先级。

## 数据准备与模型

Power Query 将年度住宅房价指数、不变价美元 PPP 工资与未季调 HICP 序列筛选到统一国家和年份范围。Dim_Country 与 Dim_Year 通过 6 条启用的多对一、单向关系连接 Fact_HousePrices、Fact_Wages 与 Fact_HICP，度量集中在独立度量表中。

## 指标设计

指标从 2015 基准变化、2022–2024 滚动动量和风险排名逐层构建。最终得分对长期增长、近期动量、工资支撑、可负担性和成本风险赋予相同权重，使增长机会与需求承受力进入同一比较框架。

## 主要发现

葡萄牙自 2015 年以来的房价增长为 124.4%，高于八国平均的 73.69%，但 2024 年房价增幅与工资增幅之差约为 111 个百分点。波兰在 2022–2024 年的平均房价年增速为 11.86%，同期形成较强动量；其 2015–2024 年 HICP 增幅约为 49%。

## 决策解释

葡萄牙代表高增长同时伴随可负担性压力的机会，波兰则在近期动量和综合风险之间形成更均衡的优先选择。排名用于缩小尽调范围，不应被解释为自动投资决定；土地、融资、监管和项目级需求仍需单独验证。
