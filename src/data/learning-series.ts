export interface LearningSeries {
  slug: string;
  title: string;
  description: string;
  tools: string[];
  modules: { code: string; title: string; summary: string }[];
}

export const learningSeries: LearningSeries[] = [
  {
    slug: "r-statistics",
    title: "R 与统计",
    description: "先把数据看明白，再进入概率、推断和统计建模。R 负责计算，判断仍然要回到数据和问题本身。",
    tools: ["R", "Base R"],
    modules: [
      {
        code: "STAT 01",
        title: "描述性统计",
        summary: "先看中心、波动、分布和异常值，弄清楚样本本身长什么样。",
      },
      {
        code: "STAT 02",
        title: "数据类型与尺度",
        summary: "不同变量能做的计算不同，先分清数值、类别、顺序和时间数据。",
      },
      {
        code: "STAT 03",
        title: "抽样与估计",
        summary: "用样本估计总体，同时保留对抽样误差和代表性的判断。",
      },
      { code: "STAT 04", title: "区间估计", summary: "一个点估计不够，还要知道这个估计有多精确。" },
      {
        code: "STAT 05",
        title: "假设检验",
        summary: "把原假设、统计证据、效果大小和实际问题放在一起读。",
      },
      {
        code: "STAT 06",
        title: "分类数据分析",
        summary: "用频数、比例和列联表处理类别变量之间的差异与关联。",
      },
    ],
  },
  {
    slug: "regression",
    title: "回归与统计建模",
    description: "从一条回归线开始，逐步处理残差、非线性、多变量、影响点和分类问题。先看模型在回答什么，再看系数和指标。",
    tools: ["R", "Base R", "glmnet", "统计建模"],
    modules: [
      {
        code: "REG 01",
        title: "简单线性回归",
        summary: "从散点图和最小二乘开始，读懂斜率、R² 和区间预测。",
      },
      {
        code: "REG 02",
        title: "回归诊断",
        summary: "从残差里找曲率、异方差、尾部问题和异常结构。",
      },
      {
        code: "REG 03",
        title: "非线性回归",
        summary: "直线不够时，先看残差，再用二次项、类别变量或交互项补上必要结构。",
      },
      {
        code: "REG 04",
        title: "多元线性回归",
        summary: "多个变量一起进入模型后，重点看控制关系、整体检验和共线性。",
      },
      {
        code: "REG 05",
        title: "异常点与影响点",
        summary: "把大残差、高杠杆和真正会改变模型的影响点分开判断。",
      },
      {
        code: "REG 06",
        title: "特征选择与正则化",
        summary: "比较模型复杂度、样本外表现，以及 Ridge 和 Lasso 的取舍。",
      },
      {
        code: "REG 07",
        title: "逻辑回归",
        summary: "从 probability、odds 和 odds ratio 走到预测概率与分类阈值。",
      },
    ],
  },
  {
    slug: "sql",
    title: "SQL 与关系数据",
    description: "先把表和关系设计清楚，再进入查询、聚合、连接、索引和事务。所有例子沿用同一套业务数据，方便前后核对。",
    tools: ["SQL", "SQLite", "关系数据库"],
    modules: [
      {
        code: "SQL 01",
        title: "关系数据库",
        summary: "理解表、行、列、粒度、数据类型、NULL 和 Schema。",
      },
      {
        code: "SQL 02",
        title: "主键",
        summary: "用稳定且唯一的值标识一条记录，避免普通业务字段变化时连带影响关联关系。",
      },
      {
        code: "SQL 03",
        title: "外键",
        summary: "让一张表安全引用另一张表，并维护引用完整性。",
      },
      {
        code: "SQL 04",
        title: "表关系",
        summary: "用客户、订单和产品说明一对多、多对多和一对一，并观察 JOIN 后粒度怎样变化。",
      },
      {
        code: "SQL 05",
        title: "SELECT 查询",
        summary: "从表里读取数据，先掌握 SELECT、FROM 和结果集。",
      },
      {
        code: "SQL 06",
        title: "WHERE 筛选",
        summary: "用比较、逻辑、区间、文本和 NULL 条件留下需要的记录。",
      },
      {
        code: "SQL 07",
        title: "列选择与表达式",
        summary: "选择需要的列，用别名和计算表达式整理查询结果。",
      },
      {
        code: "SQL 08",
        title: "ORDER BY 排序",
        summary: "给查询结果一个明确、可重复的行顺序。",
      },
      {
        code: "SQL 09",
        title: "分页查询",
        summary: "用 LIMIT、OFFSET 或 cursor 沿稳定顺序分批读取数据。",
      },
      {
        code: "SQL 10",
        title: "聚合",
        summary: "用 COUNT、SUM、AVG、MIN 和 MAX 把多行数据汇总成指标。",
      },
      {
        code: "SQL 11",
        title: "GROUP BY 分组",
        summary: "按业务维度分别聚合，同时保持结果粒度清楚。",
      },
      {
        code: "SQL 12",
        title: "JOIN 连接",
        summary: "沿真实表关系连接数据，弄清不同 JOIN 会保留哪些记录。",
      },
      {
        code: "SQL 13",
        title: "子查询",
        summary: "把一个查询的结果交给另一个查询继续筛选或比较。",
      },
      {
        code: "SQL 14",
        title: "INSERT 插入",
        summary: "按字段和值的对应关系安全加入新记录。",
      },
      {
        code: "SQL 15",
        title: "UPDATE 更新",
        summary: "用明确条件修改已有数据，避免无意更新整张表。",
      },
      {
        code: "SQL 16",
        title: "DELETE 删除",
        summary: "删除前先确认筛选范围和引用关系。",
      },
      {
        code: "SQL 17",
        title: "索引",
        summary: "看索引怎样改变查找路径，也理解它带来的写入和维护成本。",
      },
      {
        code: "SQL 18",
        title: "事务",
        summary: "把多条相关修改放进同一个原子工作单元。",
      },
      {
        code: "SQL 19",
        title: "隔离级别",
        summary: "处理并发读写时的脏读、不可重复读和幻读。",
      },
      {
        code: "SQL 20",
        title: "SQL 分析案例",
        summary: "把表设计、查询、连接、聚合和数据质量检查串成一次完整分析。",
      },
    ],
  },
  {
    slug: "python",
    title: "Python 数据分析",
    description: "从可读的数据处理流程出发，组织读取、清洗、转换、分析、可视化与复查。",
    tools: ["Python", "pandas"],
    modules: [
      {
        code: "PY 01",
        title: "数据结构与流程",
        summary: "用变量、函数和清晰步骤表达分析过程。",
      },
      {
        code: "PY 02",
        title: "表格数据处理",
        summary: "读取、检查、转换与合并数据表。",
      },
      {
        code: "PY 03",
        title: "缺失与异常",
        summary: "把数据质量判断写成可重复的规则。",
      },
      {
        code: "PY 04",
        title: "分组分析",
        summary: "按业务维度聚合并保留可追溯的粒度。",
      },
      { code: "PY 05", title: "图形表达", summary: "选择能够回答问题的图形与标注。" },
    ],
  },
  {
    slug: "decision-models",
    title: "供应链与决策模型",
    description: "从一个小型优化问题开始，再逐步加入约束、整数选择、模型规模、运输和库存。重点是把业务规则写清楚，并让结果能够复算。",
    tools: ["Excel Solver", "Python", "PuLP", "优化"],
    modules: [
      {
        code: "DM 01",
        title: "优化建模基础",
        summary: "先分清目标、参数、决策变量和约束，再开始求解。",
      },
      {
        code: "DM 02",
        title: "无约束优化",
        summary: "用函数形状和边际变化理解最优点，也比较附近方案的代价。",
      },
      {
        code: "DM 03",
        title: "受约束优化",
        summary: "用可行域、角点、binding constraint 和 slack 看资源边界。",
      },
      {
        code: "DM 04",
        title: "敏感性分析",
        summary: "资源和参数变了以后，观察目标值和最优决策会怎样动。",
      },
      {
        code: "DM 05",
        title: "二进制决策与 MILP",
        summary: "把开不开、选不选这类离散决定写进优化模型。",
      },
      {
        code: "DM 06",
        title: "集合与索引",
        summary: "用 sets、indices 和稀疏组合控制模型扩展时的规模。",
      },
      {
        code: "DM 07",
        title: "PuLP 建模",
        summary: "把数学模型整理成可检查、可扩展的 Python 优化程序。",
      },
      {
        code: "DM 08",
        title: "多维优化模型",
        summary: "把产品、工厂、资源和时期加进同一个索引模型，并保持维度一致。",
      },
      {
        code: "DM 09",
        title: "供应链运输规划",
        summary: "分清长期网络、中期合同和短期执行，再把容量、承诺量和流量平衡写进模型。",
      },
      {
        code: "DM 10",
        title: "多期生产与库存优化",
        summary: "用库存平衡把不同时期连起来，比较 setup 和 holding cost 的取舍。",
      },
    ],
  },
];

export function getLearningSeries(slug: string) {
  return learningSeries.find((series) => series.slug === slug);
}
