// Published fragment IDs are part of the URL contract, even when labels change.
// Scope mappings to locale + translationKey; never rewrite another article's IDs.
export const translatedHeadingIds = {
  "regression-diagnostics": {
    "尺度—位置图把方差问题看得更清楚": "scalelocation-图把方差问题看得更清楚",
    "QQ 图看的是尾部和分布形状": "qq-plot-看的是尾部和分布形状",
  },
  "influential-observations": {
    "高杠杆来自 X 空间，而不是 Y": "high-leverage-来自-x-空间而不是-y",
    库克距离把残差和杠杆值放在一起: "cooks-distance-把残差和-leverage-放在一起",
  },
  "logistic-regression": {
    从概率到优势: "从-probability-到-odds",
    "对数优势把 0 到 1 的概率拉到整条数轴": "log-odds-把-0-到-1-的概率拉到整条数轴",
    "同一个优势比，在不同基准概率下影响不同":
      "同一个-odds-ratio在不同基准概率下影响不同",
  },
  "constrained-optimisation": {
    等式和不等式表达的是不同业务规则: "equality-和-inequality-表达的是不同业务规则",
    紧约束表示资源刚好被用完: "binding-constraint-表示资源刚好被用完",
    松弛量告诉资源还剩多少: "slack-告诉资源还剩多少",
    "数值上“接近 0”也可能算紧约束": "数值上接近-0也可能算-binding",
  },
  "binary-milp-decisions": {
    "只有二进制变量还不够，还要把它和流量连起来":
      "只有-binary-variable-还不够还要把它和流量连起来",
    "线性规划松弛为什么会出现 0.4 个仓库": "lp-relaxation-为什么会出现-04-个仓库",
    "固定费用模型为什么经常有“规模门槛”": "fixed-charge-模型为什么经常有规模门槛",
    对称性会让求解器做重复工作: "symmetry-会让求解器做重复工作",
    "用 PuLP 写一个简单的二进制联动结构":
      "用-pulp-写一个简单的-binary-linking-structure",
    "求解状态、时间上限和最优性差距都应该被记录":
      "solver-statustime-limit-和-gap-都应该被记录",
  },
  "descriptive-statistics": {
    皮尔逊相关: "pearson-correlation",
    斯皮尔曼相关: "spearman-correlation",
    单因素方差分析: "one-way-anova",
    层次聚类: "hierarchical-clustering",
  },
  "multi-period-production-inventory": {
    启动成本往往需要二进制变量: "setup-cost-往往需要-binary-variable",
    库存持有成本应该对应真正留下来的库存: "holding-cost-应该对应真正留下来的库存",
    "滚动规划用新信息不断重算，而不是一次锁死全年":
      "rolling-planning-用新信息不断重算而不是一次锁死全年",
    批量生产用库存换更少的启动: "批量生产用库存换更少的-setup",
    "如果允许缺货，需要明确缺货和延期交货是哪一种":
      "如果允许缺货需要明确-shortage-和-backorder-是哪一种",
  },
  "multidimensional-optimisation": {
    流量平衡是供应链高维模型最重要的检查之一:
      "mass-balance-是供应链高维模型最重要的检查之一",
    状态和流量是高维模型里两种不同变量: "state-和-flow-是高维模型里两种不同变量",
  },
  "optimisation-model-anatomy": {
    求解前先用几个手工方案做合理性检查: "求解前先用几个手工方案做-sanity-check",
    近优方案有时比唯一最优点更实用: "near-optimal-方案有时比唯一最优点更实用",
  },
  "optimisation-sensitivity-analysis": {
    "影子价格回答“多一单位资源大约值多少”": "shadow-price-回答多一单位资源大约值多少",
    "影子价格不是永久有效的“资源价格”": "shadow-price-不是永久有效的资源价格",
    "切换点比“某个参数变化了”更有决策意义": "switch-point-比某个参数变化了更有决策意义",
    压力测试用来检查推荐方案有没有明显脆弱点:
      "stress-test-用来检查推荐方案有没有明显脆弱点",
    先从紧约束和松弛量看资源有没有真正用满:
      "先从-binding-和-slack-看资源有没有真正用满",
  },
  "pulp-model-architecture": {
    "求解状态必须先检查，再读取变量值": "solver-status-必须先检查再读取变量值",
    二进制变量没有和连续变量连接: "binary-variable-没有和连续变量连接",
    集合先定义模型有哪些对象: "sets-先定义模型有哪些对象",
    "参数用普通 Python 数据结构保存就够了":
      "parameters-用普通-python-数据结构保存就够了",
    建立模型时先说清楚是最大化还是最小化: "建立-model-时先说清楚是最大化还是最小化",
    求解之前可以把模型导出来检查: "solve-之前可以把模型导出来检查",
  },
  "r-data-analysis-prediction": {
    整洁数据是分析接口: "tidy-data-是分析接口",
  },
  "regression-feature-selection": {
    "调整后 R²给新增变量收一点“复杂度税”": "adjusted-r给新增变量收一点复杂度税",
  },
  "sets-indices-model-scale": {
    复合键最重要的是唯一和完整: "composite-key-最重要的是唯一和完整",
    变量族比单独创建变量更容易维护: "variable-family-比单独创建变量更容易维护",
    约束族也应该按业务规则批量生成: "constraint-family-也应该按业务规则批量生成",
    模型规模可以在建模前先算一遍: "model-scale-可以在建模前先算一遍",
    稠密模型和稀疏模型不应该混为一谈: "dense-model-和-sparse-model-不应该混为一谈",
    建模前做集合与参数审查能省掉很多调试时间:
      "建模前做-setparameter-audit-能省掉很多调试时间",
    索引表示当前正在说集合里的哪一个对象: "index-表示当前正在说集合里的哪一个对象",
    "集合只是“有哪些对象”的清单": "set-只是有哪些对象的清单",
  },
  "sql-order-by": {
    "WHERE、列选择与 ORDER BY 怎样组合": "whereprojection-与-order-by-怎样组合",
    文本排序还受到排序规则影响: "文本排序还受到-collation-影响",
    "商业分析中 ORDER BY 常见在哪里": "business-analytics-中-order-by-常见在哪里",
    "忽略 NULL 和文本排序规则": "忽略-null-和文本-collation",
  },
  "sql-pagination": {
    "分页必须建立在稳定 ORDER BY 上": "pagination-必须建立在稳定-order-by-上",
    "键集分页用“上一页最后一个键”继续向后找":
      "keyset-pagination-用上一页最后一个键继续向后找",
    键集分页不是永远更好: "keyset-pagination-不是永远更好",
    "ORDER BY 有并列值，却没有唯一次级排序键":
      "order-by-有并列值却没有唯一-tie-breaker",
  },
  "sql-projection": {
    列选择改变的是结果集的列: "projection-改变的是结果集的列",
    "列选择可以和 WHERE 组合": "projection-可以和-where-组合",
    列选择不负责排序: "projection-不负责排序",
  },
  "sql-relational-data": {
    "DDL — 数据定义语言": "ddl--data-definition-language",
    "DML — 数据操纵语言": "dml--data-manipulation-language",
    "DQL — 数据查询语言": "dql--data-query-language",
    "记录、行、列与字段怎样对应？": "recordrowcolumn-与-field-怎样对应",
    "模式：结构规则": "schema结构规则",
    层次模型: "层次模型-hierarchical-model",
    网状模型: "网状模型-network-model",
    关系模型: "关系模型-relational-model",
    模式和数据是两件事: "schema-和-data-是两件事",
    "数据：实际记录": "data实际记录",
  },
  "stat-categorical-data-analysis": {
    小样本和稀疏表要考虑费舍尔精确检验: "小样本和稀疏表要考虑-fisher-exact-test",
    为什么优势比会自然连接到逻辑回归: "为什么-odds-ratio-会自然连接到逻辑回归",
    辛普森悖论提醒不要忽略分层结构: "simpsons-paradox-提醒不要忽略分层结构",
    优势和概率不是同一个量: "odds-和-probability-不是同一个量",
    优势比量化两组相对优势: "odds-ratio-量化两组相对-odds",
  },
  "stat-interval-estimation": {
    误差界限来自哪里: "margin-of-error-来自哪里",
  },
  "unconstrained-optimisation": {
    可以给近优区域设置一个可接受损失: "可以给-near-optimal-区域设置一个可接受损失",
  },
  "sql-foreign-key": {
    "SET NULL": "set-null",
  },
};

export function preserveTranslatedHeadingIds() {
  return {
    name: "preserve-translated-heading-ids",
    element: {
      filter: ["h2", "h3", "h4", "h5", "h6"],
      visit(node, ctx) {
        const { locale, translationKey } = ctx.data.astro?.frontmatter ?? {};
        if (locale !== "zh" || node.properties?.id) return;
        const headings = translatedHeadingIds[translationKey];
        const label = ctx.textContent(node);
        if (headings && Object.hasOwn(headings, label)) {
          ctx.setProperty(node, "id", headings[label]);
        }
      },
    },
  };
}
