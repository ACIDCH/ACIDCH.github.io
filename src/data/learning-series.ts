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
    description: "先把数据看明白，再进入概率、推断和统计建模。R 用来计算，判断仍然回到数据和问题本身。",
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
    description: "从一条回归线开始，再处理残差、非线性、多变量、影响点和分类问题。每一篇都先回答实际问题，再补公式和诊断。",
    tools: ["R", "Base R", "glmnet", "统计建模"],
    modules: [
      {
        code: "REG 01",
        title: "简单线性回归",
        summary: "先读懂一条回归线，再看斜率、R²、置信区间和预测区间各自说明什么。",
      },
      {
        code: "REG 02",
        title: "回归诊断",
        summary: "模型跑完以后，继续从残差里检查曲率、异方差、尾部问题和异常结构。",
      },
      {
        code: "REG 03",
        title: "非线性回归与交互",
        summary: "直线不够时，再考虑多项式、类别变量和交互项；复杂度只在有理由时增加。",
      },
      {
        code: "REG 04",
        title: "多元线性回归",
        summary: "多个变量一起进入模型后，重点看条件解释、整体检验、共线性和系数稳定性。",
      },
      {
        code: "REG 05",
        title: "异常点与影响点",
        summary: "残差大、杠杆高和真正会改变模型结果是三件事，需要分开判断。",
      },
      {
        code: "REG 06",
        title: "特征选择与正则化",
        summary: "比较模型复杂度和样本外表现，再看 Ridge、Lasso 各自适合解决什么问题。",
      },
      {
        code: "REG 07",
        title: "逻辑回归",
        summary: "从概率和 odds 开始，逐步理解 odds ratio、预测概率和分类阈值。",
      },
    ],
  },
  {
    slug: "sql",
    title: "SQL 与关系数据",
    description: "先把表和关系设计清楚，再进入查询、聚合、连接、索引和事务。所有例子沿用同一套业务数据，方便前后核对。",
    tools: ["SQL", "SQLite", "关系数据库"],
    modules: [
      { code: "SQL 01", title: "关系数据库", summary: "理解表、行、列、粒度、数据类型、NULL 和 Schema。" },
      { code: "SQL 02", title: "主键", summary: "给每条记录一个稳定、唯一而且不会随普通业务变化的身份。" },
      { code: "SQL 03", title: "外键", summary: "让一张表安全引用另一张表，并维护引用完整性。" },
      { code: "SQL 04", title: "表关系", summary: "分清一对多、多对多和一对一，以及它们会怎样改变 JOIN 粒度。" },
      { code: "SQL 05", title: "SELECT 查询", summary: "从表里读取数据，先掌握 SELECT、FROM 和结果集。" },
      { code: "SQL 06", title: "WHERE 筛选", summary: "用比较、逻辑、区间、文本和 NULL 条件留下需要的记录。" },
      { code: "SQL 07", title: "列选择与表达式", summary: "选择需要的列，用别名和计算表达式整理查询结果。" },
      { code: "SQL 08", title: "ORDER BY 排序", summary: "给查询结果一个明确、可重复的行顺序。" },
      { code: "SQL 09", title: "分页查询", summary: "用 LIMIT、OFFSET 或 cursor 沿稳定顺序分批读取数据。" },
      { code: "SQL 10", title: "聚合", summary: "用 COUNT、SUM、AVG、MIN 和 MAX 把多行数据汇总成指标。" },
      { code: "SQL 11", title: "GROUP BY 分组", summary: "按业务维度分别聚合，同时保持结果粒度清楚。" },
      { code: "SQL 12", title: "JOIN 连接", summary: "沿真实表关系连接数据，弄清不同 JOIN 会保留哪些记录。" },
      { code: "SQL 13", title: "子查询", summary: "把一个查询的结果交给另一个查询继续筛选或比较。" },
      { code: "SQL 14", title: "INSERT 插入", summary: "按字段和值的对应关系安全加入新记录。" },
      { code: "SQL 15", title: "UPDATE 更新", summary: "用明确条件修改已有数据，避免无意更新整张表。" },
      { code: "SQL 16", title: "DELETE 删除", summary: "删除前先确认筛选范围和引用关系。" },
      { code: "SQL 17", title: "索引", summary: "看索引怎样改变查找路径，也理解它带来的写入和维护成本。" },
      { code: "SQL 18", title: "事务", summary: "把多条相关修改放进同一个原子工作单元。" },
      { code: "SQL 19", title: "隔离级别", summary: "处理并发读写时的脏读、不可重复读和幻读。" },
      { code: "SQL 20", title: "SQL 分析案例", summary: "把表设计、查询、连接、聚合和数据质量检查串成一次完整分析。" },
    ],
  },
  {
    slug: "python",
    title: "Python 数据分析",
    description: "从可读的数据处理流程出发，组织读取、清洗、转换、分析、可视化与复查。",
    tools: ["Python", "pandas"],
    modules: [
      { code: "PY 01", title: "数据结构与流程", summary: "用变量、函数和清晰步骤表达分析过程。" },
      { code: "PY 02", title: "表格数据处理", summary: "读取、检查、转换与合并数据表。" },
      { code: "PY 03", title: "缺失与异常", summary: "把数据质量判断写成可重复的规则。" },
      { code: "PY 04", title: "分组分析", summary: "按业务维度聚合并保留可追溯的粒度。" },
      { code: "PY 05", title: "图形表达", summary: "选择能够回答问题的图形与标注。" },
    ],
  },
  {
    slug: "decision-models",
    title: "供应链与优化",
    description: "从一个小型优化问题开始，再逐步加入约束、整数选择、模型规模、运输和库存。重点不是堆术语，而是把业务规则写清楚，并能解释结果为什么成立。",
    tools: ["Excel Solver", "Python", "PuLP", "优化"],
    modules: [
      { code: "DM 01", title: "优化建模", summary: "先分清目标、参数、决策变量和约束，再开始求解。" },
      { code: "DM 02", title: "无约束优化", summary: "从函数形状和边际变化理解最优点，也看看附近方案究竟差多少。" },
      { code: "DM 03", title: "受约束优化", summary: "资源有限以后，最优解会怎样改变？从可行域和紧约束开始看。" },
      { code: "DM 04", title: "敏感性分析", summary: "资源和参数稍微变化以后，检查目标值和最优决策是否仍然稳定。" },
      { code: "DM 05", title: "二进制决策与 MILP", summary: "把开不开、选不选这类离散决定直接写进优化模型。" },
      { code: "DM 06", title: "集合与索引", summary: "模型变大以后，用集合和索引把重复规则组织得更清楚。" },
      { code: "DM 07", title: "PuLP 建模", summary: "把数学模型整理成可检查、可扩展、便于复算的 Python 优化程序。" },
      { code: "DM 08", title: "多维优化", summary: "产品、工厂、资源和时期同时出现时，先把维度和参数对应关系理顺。" },
      { code: "DM 09", title: "供应链规划与运输", summary: "把网络布局、运输分配、容量和需求放在同一套供应链逻辑里。" },
      { code: "DM 10", title: "多期生产与库存", summary: "沿时间连接生产、需求和库存，再比较 setup cost 与 holding cost。" },
    ],
  },
];

export function getLearningSeries(slug: string) {
  return learningSeries.find((series) => series.slug === slug);
}
