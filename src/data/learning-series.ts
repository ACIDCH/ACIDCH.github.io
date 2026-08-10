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
      "从关系模型到可复查查询，把业务问题翻译为稳定的数据结构、连接条件与结果表。",
    tools: ["SQL", "关系数据库"],
    modules: [
      { code: "SQL 01", title: "关系模型基础", summary: "表、主键、外键与记录粒度。" },
      { code: "SQL 02", title: "筛选与排序", summary: "用明确条件缩小分析对象。" },
      { code: "SQL 03", title: "聚合与分组", summary: "按正确粒度得到可解释的汇总。" },
      {
        code: "SQL 04",
        title: "表连接",
        summary: "识别一对一、一对多与重复计数风险。",
      },
      {
        code: "SQL 05",
        title: "子查询与窗口函数",
        summary: "处理排名、时间比较和分组内计算。",
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
      "通过网络、库存、模拟与优化模型，将成本、服务与约束转为可比较的决策结构。",
    tools: ["Excel", "优化", "模拟"],
    modules: [
      { code: "DM 01", title: "问题建模", summary: "定义决策变量、目标与约束。" },
      {
        code: "DM 02",
        title: "网络与运输",
        summary: "用节点、路径、需求与容量表达流动。",
      },
      {
        code: "DM 03",
        title: "库存决策",
        summary: "把需求波动、补货与服务水平放在同一口径。",
      },
      {
        code: "DM 04",
        title: "蒙特卡洛模拟",
        summary: "用重复随机抽样观察不确定性下的结果范围。",
      },
      { code: "DM 05", title: "敏感性分析", summary: "识别结论对关键输入变化的反应。" },
    ],
  },
];

export function getLearningSeries(slug: string) {
  return learningSeries.find((series) => series.slug === slug);
}
