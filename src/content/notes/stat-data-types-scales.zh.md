---
translationKey: stat-data-types-scales
locale: zh
slug: stat-data-types-scales
title: 数据类型与尺度
summary: 从业务字段的真实含义出发，分清数值、类别、顺序、日期时间和测量尺度，再决定该怎样汇总、画图和建模。
tags:
  - 统计学
  - 数据类型
  - R
topics:
  - R 与统计
  - 数据理解
  - 数据质量
tools:
  - R
  - Base R
  - ggplot2
series: R 与统计
seriesSlug: r-statistics
order: 2
publishedAt: 2026-08-11
updatedAt: 2026-08-11
status: published
draft: false
isPlaceholder: false
relatedProjects: []
relatedNotes:
  - descriptive-statistics
---

## 为什么先判断变量类型

一列数据看起来像数字，不代表它适合做加减乘除。客户编号 `10017`、仓库代码 `3`、满意度 `1–5` 和月销售额 `125000` 都可能以数字形式保存，但四者代表的东西完全不同。

真正需要先问的是：**这个字段记录的是什么，值之间允许怎样比较，差值和比例有没有实际意义。** 数据类型决定能不能求均值、能不能排序、该用哪种图，以及后面的统计模型怎样解释系数。

假设有一张客户服务数据表：

```r
service <- data.frame(
  customer_id = c(1001, 1002, 1003, 1004, 1005),
  channel = c("Web", "Store", "Web", "Phone", "Store"),
  satisfaction = c(4, 2, 5, 3, 4),
  waiting_minutes = c(6.4, 18.2, 4.8, 11.1, 7.6),
  resolved = c(TRUE, FALSE, TRUE, TRUE, TRUE),
  visit_time = as.POSIXct(c(
    "2026-07-01 09:10:00", "2026-07-01 10:25:00",
    "2026-07-01 13:40:00", "2026-07-02 08:55:00",
    "2026-07-02 16:20:00"
  ))
)
```

这张表已经同时包含标识符、无序类别、有序等级、连续数值、逻辑变量和时间变量。后续分析是否合理，取决于这些角色有没有被分清。

## 类别变量和数值变量是第一层区分

统计分析中最常用的第一层划分，是 categorical 与 numeric。

**类别变量**把记录放进有限的组。例如渠道、地区、产品类别、会员等级。它最基本的汇总是频数和比例。

```r
table(service$channel)
prop.table(table(service$channel))
```

**数值变量**记录数量或测量结果，例如订单金额、等待时间、需求量、配送距离。常见汇总包括均值、中位数、标准差、分位数和范围。

```r
mean(service$waiting_minutes)
median(service$waiting_minutes)
sd(service$waiting_minutes)
```

把类别代码误当成数值，会得到数学上能算、业务上没有意义的结果。例如 `channel = 1, 2, 3` 的平均值等于 2，并不能说明“平均渠道是第二类”。

## 名义变量没有天然顺序

Nominal variable 只有类别差异，没有高低次序。渠道、城市、付款方式、产品类别都属于这一类。

R 中通常用 factor 表示：

```r
service$channel <- factor(service$channel)
levels(service$channel)
```

factor 的内部编码是整数，但这些整数只是存储方式，不能被解释成数值距离。

```r
as.integer(service$channel)
```

上面的结果可能是 1、2、3，但不能据此说 3 比 1 “多两单位”。如果模型中加入 factor，R 会按类别建立对比编码，系数表示相对某个参考类别的差异。

### 参考类别会影响系数写法

假设希望把 Web 设为基准：

```r
service$channel <- relevel(service$channel, ref = "Web")
```

这不会改变数据事实，只会改变模型系数的比较方向。看到类别变量的回归系数时，必须先确认 reference level。

## 顺序变量有高低但距离未必相等

Ordinal variable 可以排序，但相邻等级之间的距离未必相同。

满意度 1–5、信用等级低/中/高、配送优先级普通/加急/紧急，都属于常见顺序变量。

```r
service$satisfaction <- ordered(
  service$satisfaction,
  levels = 1:5
)
```

顺序信息意味着可以讨论“更高”或“更低”，也可以计算中位数和分位位置。但是否应该直接计算均值，要看业务解释。

例如满意度从 1 到 2 的心理差距，不一定和从 4 到 5 完全一样。平均满意度 3.7 在报告中很常见，但不应因此假定量表间距具有严格的物理等距意义。

当等级只有少数几个时，频数分布通常比单独一个均值更有信息：

```r
prop.table(table(service$satisfaction))
```

## 离散数值和连续数值回答不同问题

数值变量还可以分为 discrete 与 continuous。

**离散数值**通常来自计数，例如一天收到 17 张订单、一周发生 4 次设备故障、客户打过 3 次服务电话。理论上它们只能取某些分离的值。

**连续数值**来自测量，例如 6.4 分钟、12.7 公里、84.3 千克。只要测量精度允许，它们可以在区间内取得任意值。

这一区分会影响概率模型和图形选择。计数数据经常与 Binomial、Poisson 一类离散分布联系；连续测量则更常使用密度、分位数和连续概率模型。

```r
orders_per_day <- c(18, 23, 20, 16, 27, 21)
waiting_time <- c(6.4, 18.2, 4.8, 11.1, 7.6)

class(orders_per_day)
class(waiting_time)
```

注意：R 会把两者都存成 numeric。**统计类型来自变量含义，不是 `class()` 一条命令能够完全判断的。**

## 标识符不是分析数值

客户号、订单号、SKU、邮编经常由数字组成，却属于 identifier。

```r
mean(service$customer_id)
```

R 会正常返回结果，但这个均值没有分析意义。标识符的主要作用是唯一定位记录、连接表格和追踪实体，而不是参与数值计算。

建模前最好明确排除这类字段，避免算法把编号大小误当成某种连续关系。

一个实用检查是：**如果把编号重新随机分配，业务含义是否应该完全不变？** 如果答案是“是”，它通常就不应该作为普通数值特征。

## 日期时间既有顺序也有间隔

日期和时间不能只当字符串处理。正确的日期类型可以做排序、时间差、按月汇总和周期特征构造。

```r
class(service$visit_time)
range(service$visit_time)
difftime(service$visit_time[2], service$visit_time[1], units = "mins")
```

时间变量常同时携带多层信息：

- 绝对时间点：订单在什么时候发生；
- 时间间隔：从下单到配送用了多久；
- 周期位置：星期几、小时、月份；
- 顺序：哪条记录更早。

把日期直接转成普通整数再解释系数时要特别小心。模型可能在利用“距离某个时间原点的天数”，而业务真正关心的可能是季节性或周末效应。

## 测量尺度决定哪些运算有意义

统计教材常把测量尺度进一步区分为 nominal、ordinal、interval 与 ratio。这个框架最重要的价值，是提醒分析者：**不是所有数字都支持同样的数学解释。**

| 尺度     | 能比较类别 | 能排序 | 差值有意义 | 比例有意义 | 示例             |
| -------- | ---------: | -----: | ---------: | ---------: | ---------------- |
| Nominal  |         是 |     否 |         否 |         否 | 渠道、地区       |
| Ordinal  |         是 |     是 |       未必 |         否 | 满意度等级       |
| Interval |         是 |     是 |         是 |         否 | 摄氏温度         |
| Ratio    |         是 |     是 |         是 |         是 | 金额、重量、时长 |

Interval scale 有等距差值，但零点不是“完全不存在”。摄氏 20°C 比 10°C 高 10 度，却不能说“温度是两倍”。

Ratio scale 有有意义的零点，因此 20 分钟确实可以解释为 10 分钟的两倍时长。

在商业数据里，很多金额、数量、距离和持续时间都接近 ratio scale，但评分、指数和编码字段经常不是。

## 数据类型会直接改变图形选择

不同类型的变量适合不同图形。

### 一个类别变量

```r
library(ggplot2)

ggplot(service, aes(channel)) +
  geom_bar()
```

柱状图展示每个类别的频数。横轴之间没有连续距离含义。

### 一个连续数值变量

```r
ggplot(service, aes(waiting_minutes)) +
  geom_histogram(binwidth = 3)
```

直方图用区间展示分布形状。它不是简单的类别计数图，因为相邻 bin 对应连续数值区间。

### 类别加连续数值

```r
ggplot(service, aes(channel, waiting_minutes)) +
  geom_boxplot()
```

这里的问题变成：不同渠道的等待时间分布是否不同。

### 两个连续数值

通常先看散点图，再考虑相关或回归。变量类型其实已经在模型选择之前提供了第一层路线图。

## 类型转换不能只为了让代码通过

数据导入后经常需要转换类型：

```r
service$customer_id <- as.character(service$customer_id)
service$resolved <- as.logical(service$resolved)
service$channel <- factor(service$channel)
```

但转换的理由应该是语义，而不是“这个函数报错，所以换一种类型”。

常见危险包括：

- 把 `"1", "2", "3"` 强制转成 numeric，却没有确认这些值究竟是数量还是代码；
- 把缺失值编码 `"N/A"`、`"unknown"` 当成真实类别；
- 把类别 factor 直接 `as.numeric()`，得到的是内部 level 编号；
- 把日期字符串按字典顺序排序，却没有解析成日期；
- 把有顺序的等级当成无序 factor，丢失本来存在的顺序信息。

类型清洗的目标不是让每一列“看起来整齐”，而是让数据结构与业务含义一致。

## 一个实用的数据字典

正式分析前，可以为关键字段建立一个简短 data dictionary。

| 字段            | 观察单位 | 统计角色         | R 类型         | 允许的值        | 缺失含义   |
| --------------- | -------- | ---------------- | -------------- | --------------- | ---------- |
| customer_id     | 客户     | 标识符           | character      | 唯一编号        | 不应缺失   |
| channel         | 服务记录 | nominal          | factor         | Web/Store/Phone | 未记录渠道 |
| satisfaction    | 服务记录 | ordinal          | ordered factor | 1–5             | 未完成评价 |
| waiting_minutes | 服务记录 | continuous ratio | numeric        | ≥ 0             | 未成功计时 |
| resolved        | 服务记录 | binary           | logical        | TRUE/FALSE      | 状态未知   |
| visit_time      | 服务记录 | datetime         | POSIXct        | 合法时间        | 未记录时间 |

这张表会影响后面几乎所有步骤：数据质量检查、描述统计、图形、推断、特征工程和模型解释。

## 常见误判

**“是数字就求均值。”** 编号和类别代码最容易触发这个错误。

**“1–5 评分一定是连续变量。”** 它至少首先是一项有序等级；是否近似当作连续变量，要结合量表设计和分析目的说明。

**“R 显示 numeric，所以它就是连续变量。”** R class 描述存储方式，不自动替代统计判断。

**“factor 的整数编码代表真实距离。”** factor 内部数字只是索引。

**“日期只是一个格式问题。”** 时间字段会影响排序、周期、窗口和信息泄漏判断。

## 从数据类型进入后续统计分析

变量类型决定了后面应该问什么问题。

如果结果是连续数值，可以研究均值、分布、相关和线性模型；如果结果是二元类别，可以研究比例、odds 与逻辑回归；如果比较的是多个类别，可以从频数、条件比例和列联表开始；如果数据带时间顺序，则不能随意把记录看成可交换的独立样本。

因此，数据类型不是 R 入门阶段的一段语法知识，而是统计分析的第一道约束。只有先确认“这列数据允许怎样比较”，后面的平均数、置信区间和模型系数才有明确含义。

## 参考资料

知识结构参考 Rafael A. Irizarry 的 _Introduction to Data Science_，尤其是 R basics 中的数据类型与 factor，以及 Data Visualization 中对 categorical、ordinal、discrete 和 continuous variables 的区分。正文、业务示例与代码均重新组织。

参考站点：<https://rafalab.dfci.harvard.edu/dsbook-part-1/> 。原资料采用 CC BY-NC-SA 4.0 许可。
