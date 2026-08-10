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
    description:
      "从数据口径、描述性统计与抽样推断开始，把统计量放回分析判断，而非孤立地记忆函数。",
    tools: ["R", "Base R"],
    modules: [
      {
        code: "STAT 01",
        title: "描述性统计",
        summary: "中心、离散程度、分布与异常观察。",
      },
      {
        code: "STAT 02",
        title: "数据类型与尺度",
        summary: "区分数值、类别、顺序与时间变量的可用运算。",
      },
      {
        code: "STAT 03",
        title: "抽样与估计",
        summary: "理解样本如何代表总体以及不确定性从何而来。",
      },
      { code: "STAT 04", title: "区间估计", summary: "用区间而非单点描述估计精度。" },
      {
        code: "STAT 05",
        title: "假设检验",
        summary: "把问题、假设、统计量和结论放在同一条证据链中。",
      },
      {
        code: "STAT 06",
        title: "分类数据分析",
        summary: "频数、比例、列联表与关联判断。",
      },
    ],
  },
  {
    slug: "regression",
    title: "回归与统计建模",
    description: "围绕解释、预测、诊断与沟通组织回归分析，明确模型条件与结论边界。",
    tools: ["R", "统计建模"],
    modules: [
      {
        code: "REG 01",
        title: "线性回归问题定义",
        summary: "明确结果变量、解释变量与观察单位。",
      },
      {
        code: "REG 02",
        title: "系数与预测",
        summary: "区分条件关联、边际变化与预测值。",
      },
      { code: "REG 03", title: "模型诊断", summary: "检查残差、杠杆点与函数形式。" },
      {
        code: "REG 04",
        title: "分类结果建模",
        summary: "理解概率、阈值与分类错误的关系。",
      },
      {
        code: "REG 05",
        title: "变量选择",
        summary: "在解释性、稳定性与可用信息之间做取舍。",
      },
    ],
  },
  {
    slug: "sql",
    title: "SQL 与关系数据",
    description:
      "从关系数据库、键与表关系进入查询、数据修改、索引与事务，把业务问题翻译成可复查的数据结构和结果集。",
    tools: ["SQL", "SQLite", "关系数据库"],
    modules: [
      {
        code: "SQL 01",
        title: "Relational Database",
        summary: "数据库、关系模型、记录与字段、数据类型、NULL、SQL 操作类别与方言。",
      },
      {
        code: "SQL 02",
        title: "Primary Key",
        summary: "用稳定、唯一、非空且尽量业务无关的键标识记录。",
      },
      {
        code: "SQL 03",
        title: "Foreign Key",
        summary: "建立父表与子表引用，并理解引用完整性与数据库约束。",
      },
      {
        code: "SQL 04",
        title: "One-to-Many / Many-to-Many / One-to-One",
        summary: "用外键、UNIQUE 与中间表表达关系基数并控制 JOIN 粒度。",
      },
      {
        code: "SQL 05",
        title: "SELECT",
        summary: "读取表数据，理解 SELECT、FROM、星号与二维结果集。",
      },
      {
        code: "SQL 06",
        title: "WHERE",
        summary: "用比较、逻辑与空值条件筛选需要的记录。",
      },
      {
        code: "SQL 07",
        title: "Projection",
        summary: "选择需要的列、计算表达式并使用清晰的结果列别名。",
      },
      {
        code: "SQL 08",
        title: "ORDER BY",
        summary: "按一个或多个字段稳定排序查询结果。",
      },
      {
        code: "SQL 09",
        title: "Pagination",
        summary: "理解分页窗口、LIMIT/OFFSET 与稳定排序的重要性。",
      },
      {
        code: "SQL 10",
        title: "Aggregation",
        summary: "使用 COUNT、SUM、AVG、MIN 与 MAX 汇总记录。",
      },
      {
        code: "SQL 11",
        title: "GROUP BY",
        summary: "按业务维度分组聚合并保持结果粒度清楚。",
      },
      {
        code: "SQL 12",
        title: "JOIN",
        summary: "沿主外键关系连接表，并识别 INNER 与 OUTER JOIN 的保留规则。",
      },
      {
        code: "SQL 13",
        title: "Subquery",
        summary: "把查询结果作为后续查询输入，处理分层筛选与比较问题。",
      },
      {
        code: "SQL 14",
        title: "INSERT",
        summary: "按字段和值的对应关系安全插入一条或多条记录。",
      },
      {
        code: "SQL 15",
        title: "UPDATE",
        summary: "用条件精确修改已有记录并避免无意的全表更新。",
      },
      {
        code: "SQL 16",
        title: "DELETE",
        summary: "用条件删除记录并理解引用关系带来的限制。",
      },
      {
        code: "SQL 17",
        title: "Index",
        summary: "理解索引如何改变查找路径，以及读取收益与写入维护成本。",
      },
      {
        code: "SQL 18",
        title: "Transaction",
        summary: "用事务把多条修改组织成一个原子工作单元。",
      },
      {
        code: "SQL 19",
        title: "Isolation",
        summary: "理解并发读写中的隔离级别、脏读、不可重复读与幻读。",
      },
      {
        code: "SQL 20",
        title: "Analytics SQL Case Study",
        summary: "把建模、查询、连接、聚合与数据质量检查组合成完整分析案例。",
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
    description:
      "从优化问题解剖、LP/MILP、敏感性、Sets 与 Indices 进入 PuLP 和高维模型，再把容量、成本、合同、运输与库存流转成可审计的供应链决策。",
    tools: ["Excel Solver", "Python", "PuLP", "优化"],
    modules: [
      {
        code: "DM 01",
        title: "优化问题解剖",
        summary: "区分目标、参数、决策变量、约束、变量域与可行性。",
      },
      {
        code: "DM 02",
        title: "无约束优化",
        summary: "从函数形状、边际变化和二阶信息理解最优点与近最优区域。",
      },
      {
        code: "DM 03",
        title: "受约束优化与可行域",
        summary: "用资源约束、角点、binding 与 slack 解释线性规划。",
      },
      {
        code: "DM 04",
        title: "敏感性分析",
        summary: "把 RHS、shadow price、目标系数和情景变化转为资源价值判断。",
      },
      {
        code: "DM 05",
        title: "二进制决策与 MILP",
        summary: "用 fixed charge、linking constraints 与逻辑约束表达结构性选择。",
      },
      {
        code: "DM 06",
        title: "Sets、Indices 与模型规模",
        summary: "用变量族、约束族、基数和稀疏索引控制模型扩展。",
      },
      {
        code: "DM 07",
        title: "PuLP 模型架构",
        summary: "把数学模型映射到数据、变量、目标、约束、求解与诊断代码。",
      },
      {
        code: "DM 08",
        title: "多维优化模型",
        summary: "从 0D 到 n-D 管理产品、工厂、资源、技能与时期维度。",
      },
      {
        code: "DM 09",
        title: "供应链规划与运输分配",
        summary: "连接战略网络、战术合同与运营流量，并建立运输平衡模型。",
      },
      {
        code: "DM 10",
        title: "多期生产、库存与履约",
        summary: "用库存结转、setup、holding 与 shortage 建立跨期流量优化。",
      },
    ],
  },
];

export function getLearningSeries(slug: string) {
  return learningSeries.find((series) => series.slug === slug);
}
