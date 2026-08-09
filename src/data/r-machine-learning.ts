export type MetricKey = "accuracy" | "auc" | "sensitivity" | "specificity";

export interface ModelResult {
  id: string;
  name: string;
  family: string;
  engine: string;
  parameters: string;
  recipe: string;
  input: string;
  strength: string;
  limitation: string;
  accuracy: number;
  auc: number;
  sensitivity: number;
  specificity: number;
  reading: string;
}

export const projectBasePath = "/zh/projects/customer-churn-machine-learning/";

export const projectImages = {
  numericDistributions: "/projects/customer-churn/numeric-distributions.webp",
  predictorComparisons: "/projects/customer-churn/predictor-comparisons.webp",
  categoricalRates: "/projects/customer-churn/categorical-churn-rates.webp",
  serviceInteractions: "/projects/customer-churn/service-interactions.webp",
  holdoutRoc: "/projects/customer-churn/holdout-roc.webp",
  oddsRatioCi: "/projects/customer-churn/odds-ratio-ci.webp",
} as const;

export const metricLabels: Record<MetricKey, string> = {
  accuracy: "Accuracy",
  auc: "AUC-ROC",
  sensitivity: "Sensitivity",
  specificity: "Specificity",
};

export const modelResults: ModelResult[] = [
  {
    id: "logistic-regression",
    name: "Logistic Regression",
    family: "线性概率分类",
    engine: "glm",
    parameters: "默认二项逻辑回归规格",
    recipe: "数值中位数保护、未知水平、Dummy、零方差、折内上采样",
    input: "数值矩阵；plan_tier 转换为相对 Basic 的指示变量",
    strength: "AUC 最高，Sensitivity 接近最高值，系数可转换为 odds ratio。",
    limitation: "加性 log-odds 结构不能自动捕捉复杂非线性和高阶交互。",
    accuracy: 0.8136,
    auc: 0.9024,
    sensitivity: 0.8281,
    specificity: 0.8071,
    reading: "AUC 排名第 1，Sensitivity 距最高值仅 0.0037，同时保留变量解释路径。",
  },
  {
    id: "naive-bayes",
    name: "Naive Bayes",
    family: "条件概率分类",
    engine: "klaR",
    parameters: "smoothness = 1",
    recipe: "数值中位数保护、未知水平、零方差、折内上采样；保留 factor",
    input: "数值变量按类别估计条件分布，分类变量保留水平",
    strength: "Sensitivity 0.8318 为五模型最高，适合观察召回上限。",
    limitation: "条件独立假设与部分相关变量不完全一致，Specificity 最低。",
    accuracy: 0.8098,
    auc: 0.8996,
    sensitivity: 0.8318,
    specificity: 0.7999,
    reading: "Sensitivity 排名第 1，但 Accuracy 与 Specificity 在五个模型中最低。",
  },
  {
    id: "random-forest",
    name: "Random Forest",
    family: "Bagging 树集成",
    engine: "ranger",
    parameters: "500 trees；min_n = 20；impurity importance",
    recipe: "数值中位数保护、未知水平、零方差、折内上采样；保留 factor",
    input: "混合数值与分类输入；无需 Dummy 或标准化",
    strength: "可捕捉非线性与变量交互，Accuracy 和 Specificity 均较高。",
    limitation: "Sensitivity 低于线性和概率模型，单棵树的判断不再直接可读。",
    accuracy: 0.8187,
    auc: 0.8964,
    sensitivity: 0.7966,
    specificity: 0.8286,
    reading: "Accuracy 排名第 2、Specificity 排名第 3，但流失召回低于前两名。",
  },
  {
    id: "lightgbm",
    name: "LightGBM",
    family: "Boosting 树集成",
    engine: "lightgbm",
    parameters: "200 trees",
    recipe: "数值中位数保护、未知水平、零方差、折内上采样；保留 factor",
    input: "混合数值与分类输入；由 lightgbm 引擎处理 factor",
    strength: "Accuracy 0.8199 为五模型最高，Specificity 也保持在 0.8291。",
    limitation: "AUC 与 Sensitivity 均未领先，复杂度高于最终线性模型。",
    accuracy: 0.8199,
    auc: 0.8955,
    sensitivity: 0.7994,
    specificity: 0.8291,
    reading: "Accuracy 排名第 1，但 AUC 比 Logistic Regression 低 0.0069。",
  },
  {
    id: "xgboost",
    name: "XGBoost",
    family: "Boosting 树集成",
    engine: "xgboost",
    parameters: "200 trees；depth 6；learn rate 0.3；min_n 1",
    recipe: "数值中位数保护、未知水平、Dummy、零方差、折内上采样",
    input: "数值矩阵；分类输入先转换为指示变量",
    strength: "Specificity 0.8370 为五模型最高，最少把留存客户标成流失。",
    limitation: "Sensitivity 0.7632 最低，意味着更多真实流失客户会被漏掉。",
    accuracy: 0.8142,
    auc: 0.8842,
    sensitivity: 0.7632,
    specificity: 0.837,
    reading: "Specificity 排名第 1，同时也是流失召回最低的模型。",
  },
];

export const pipelineSteps = [
  {
    number: "01",
    group: "DATA",
    title: "界定客户观察",
    input: "200,000 条记录、25 个原始字段",
    action: "统一单位、百分比、二元字段和目标水平",
    output: "每行表示一位客户的一组行为、计划、服务和支付状态",
    detail: "把 retained_binary 转换为 retained / churned，并将 churned 设为正类。",
    evidence: "200,000 rows · 25 fields · churned = positive",
    why: "模型需要明确预测对象和事件方向，后续 Sensitivity 才不会被反向解释。",
    codeKey: "cleaning",
    nextQuestion: "商业 Fleet 与个人会员是否属于同一预测总体？",
  },
  {
    number: "02",
    group: "DATA",
    title: "限定建模总体",
    input: "包含 Fleet、Basic、Plus、Pro 的清洗数据",
    action: "排除合同与流失机制不同的 Fleet，并以 Basic 为计划基准",
    output: "196,000 条个人客户记录",
    detail: "4,000 条 Fleet 记录不进入个人客户流失模型，计划水平删除空水平后重新排序。",
    evidence: "200,000 → 196,000",
    why: "混合两个流失机制不同的总体，会让模型系数同时承担个人行为与商业合同差异。",
    codeKey: "population",
    nextQuestion: "25 个字段中哪些能够形成稳定、可解释的输入？",
  },
  {
    number: "03",
    group: "DATA",
    title: "筛选七个预测变量",
    input: "客户、计划、使用、服务、支付、互动和目标字段",
    action: "移除标识、目标来源和不优先字段，检查相关性与调查应答质量",
    output: "7 predictors + churn",
    detail:
      "保留服务质量、商业摩擦、使用间隔与计划层级；删除与 last charge 相关 0.88 的 signup 周数。",
    evidence: "25 fields → 7 predictors · correlation 0.88",
    why: "精简输入降低冗余，并让最终 odds ratio 对应可辨认的风险信号。",
    codeKey: "features",
    nextQuestion: "怎样隔离最终答案，避免模型选择污染测试数据？",
  },
  {
    number: "04",
    group: "VALIDATION",
    title: "隔离留出集",
    input: "196,000 条合格记录",
    action: "按 churn 进行 80/20 分层切分",
    output: "156,800 条训练数据；39,200 条留出数据",
    detail: "模型比较、预处理选择和候选模型判断只使用训练部分。",
    evidence: "156,800 train · 39,200 hold-out · seed 404713359",
    why: "留出集只在最终模型确定后使用一次，才代表真正的选择外表现。",
    codeKey: "split",
    nextQuestion: "五种模型如何在可控计算量下接受同一验证？",
  },
  {
    number: "05",
    group: "VALIDATION",
    title: "建立五折比较样本",
    input: "仅来自训练部分的 156,800 条记录",
    action: "分层抽取 30,000 条，再建立 5-fold CV",
    output: "每折约 24,000 条分析数据和 6,000 条验证数据",
    detail: "每一条 CV 预测来自没有用于该折拟合的 assessment 部分。",
    evidence: "30,000 CV sample · 5 folds · ≈24k / 6k",
    why: "同一组 folds 让五模型接受相同的数据边界，同时控制计算成本。",
    codeKey: "resampling",
    nextQuestion: "类别不平衡应在什么时候处理才不会泄漏？",
  },
  {
    number: "06",
    group: "PREPROCESSING",
    title: "折内预处理与上采样",
    input: "每折的 analysis 数据",
    action: "执行模型专用 recipe，并只在 analysis fold 内将类别上采样到 1:1",
    output: "平衡的拟合数据；保持自然分布的 assessment 数据",
    detail: "所有可学习的变换与复制都位于 recipe 内，不越过折边界。",
    evidence: "step_unknown · step_zv · step_upsample(over_ratio = 1)",
    why: "如果先上采样再切折，复制记录可能同时进入训练与验证，造成过于乐观的分数。",
    codeKey: "recipes",
    nextQuestion: "五类算法需要怎样不同的输入结构？",
  },
  {
    number: "07",
    group: "MODELLING",
    title: "拟合五个候选模型",
    input: "两类 recipe × 同一组 CV folds",
    action: "分别拟合 Logistic、Naive Bayes、Random Forest、XGBoost、LightGBM",
    output: "Accuracy、AUC、Sensitivity、Specificity 的五折平均结果",
    detail: "glm 和 xgboost 使用 Dummy 输入，另外三种引擎保留 factor。",
    evidence: "5 models · 4 metrics · same folds",
    why: "线性、概率、bagging 与 boosting 模型对同一问题给出互补的误差结构。",
    codeKey: "models",
    nextQuestion: "哪项领先最符合流失识别的决策目标？",
  },
  {
    number: "08",
    group: "SELECTION",
    title: "按判别力与错误取舍选择",
    input: "五模型交叉验证结果",
    action: "以 mean AUC 为首要标准，同时检查 Sensitivity、Specificity 和解释路径",
    output: "Logistic Regression",
    detail: "它的 AUC 为 0.9024，Sensitivity 为 0.8281，且能把系数转换为风险信号。",
    evidence: "AUC #1 · near-leading Sensitivity · interpretable",
    why: "Accuracy 最高并不意味着最能区分客户，也不说明漏判与误报的方向。",
    codeKey: "selection",
    nextQuestion: "最终模型在从未参与选择的客户上表现怎样？",
  },
  {
    number: "09",
    group: "FINAL EVALUATION",
    title: "一次性留出评估",
    input: "确定的 Logistic workflow + 原始 80/20 split",
    action: "在完整训练部分重拟合，并对 39,200 条留出记录预测",
    output: "混淆矩阵、AUC 0.9053 与四项最终指标",
    detail: "留出集只在模型选择完成后进入 last_fit。",
    evidence: "TN 21,825 · FP 5,261 · FN 2,022 · TP 10,092",
    why: "这一阶段回答的不是谁赢了，而是已选模型面对新记录会怎样犯错。",
    codeKey: "finalEvaluation",
    nextQuestion: "哪些变量最明显改变流失 odds？",
  },
  {
    number: "10",
    group: "INTERPRETATION",
    title: "解释风险信号",
    input: "自然类别分布下重新拟合的 Logistic Regression",
    action: "指数化系数并计算 95% confidence interval",
    output: "支付失败、退款、使用间隔、服务摩擦和计划层级的 odds ratio",
    detail: "解释模型不使用上采样，以免人工 1:1 分布改变截距与系数含义。",
    evidence: "payment failure OR 15.9 · last charge OR 2.01 per week",
    why: "预测排名回答谁更可能流失，odds ratio 回答哪些已选变量与风险方向最相关。",
    codeKey: "oddsRatios",
    nextQuestion: "这些信号如何共同构成最终分析结论？",
  },
] as const;

export const rawFieldGroups = [
  { group: "记录标识", tone: "neutral", fields: ["user_ID"] },
  { group: "结果变量", tone: "target", fields: ["retained_binary → churn"] },
  { group: "客户资料", tone: "profile", fields: ["age", "gender", "region"] },
  {
    group: "计划与支付",
    tone: "commercial",
    fields: [
      "plan_tier",
      "payment_type",
      "price_change_exposed",
      "payment_failure_last4w",
      "refund_request_last12w",
    ],
  },
  {
    group: "使用与活跃",
    tone: "usage",
    fields: [
      "avg_kwh_per_session",
      "peak_share",
      "charging_sessions_12w",
      "weeks_since_last_charge",
      "weeks_since_signup",
    ],
  },
  {
    group: "服务可靠性",
    tone: "service",
    fields: ["avg_wait_minutes", "charger_fault_rate", "support_ticket"],
  },
  {
    group: "数字互动",
    tone: "digital",
    fields: [
      "app_crashes_30d",
      "app_version_lag_weeks",
      "notification_opt_in",
      "email_opened_last",
      "device_os",
    ],
  },
  {
    group: "接入与体验",
    tone: "experience",
    fields: ["home_charging_access", "satisfaction_survey"],
  },
] as const;

export const predictors = [
  {
    name: "avg_wait_minutes",
    label: "平均等待时间",
    unit: "分钟",
    type: "连续数值",
    dimension: "服务质量",
  },
  {
    name: "app_crashes_30d",
    label: "30 天应用崩溃",
    unit: "次数",
    type: "计数",
    dimension: "服务质量",
  },
  {
    name: "charger_fault_rate",
    label: "充电器故障率",
    unit: "百分点",
    type: "连续数值",
    dimension: "服务质量",
  },
  {
    name: "plan_tier",
    label: "会员计划",
    unit: "Basic / Plus / Pro",
    type: "分类",
    dimension: "会员结构",
  },
  {
    name: "refund_request_last12w",
    label: "12 周退款申请",
    unit: "No / Yes",
    type: "二元分类",
    dimension: "商业摩擦",
  },
  {
    name: "payment_failure_last4w",
    label: "4 周支付失败",
    unit: "No / Yes",
    type: "二元分类",
    dimension: "商业摩擦",
  },
  {
    name: "weeks_since_last_charge",
    label: "距上次充电时间",
    unit: "周",
    type: "整数",
    dimension: "不活跃程度",
  },
] as const;

export const sampleFlow = [
  {
    id: "raw",
    label: "原始记录",
    value: 200000,
    display: "200,000",
    note: "25 个字段",
  },
  {
    id: "eligible",
    label: "个人客户总体",
    value: 196000,
    display: "196,000",
    note: "排除 4,000 条 Fleet",
  },
  {
    id: "train",
    label: "训练部分",
    value: 156800,
    display: "156,800",
    note: "80%，用于比较与最终拟合",
  },
  {
    id: "holdout",
    label: "留出部分",
    value: 39200,
    display: "39,200",
    note: "20%，只在最后使用",
  },
  {
    id: "cv",
    label: "CV 比较样本",
    value: 30000,
    display: "30,000",
    note: "仅从训练部分分层抽取",
  },
] as const;

export const holdoutClassDistribution = [
  { id: "retained", label: "Retained", value: 27086, display: "27,086", share: 69.1 },
  { id: "churned", label: "Churned", value: 12114, display: "12,114", share: 30.9 },
] as const;

export const behaviourComparisons = [
  {
    metric: "平均等待时间",
    label: "平均等待时间",
    retained: 23.7,
    churned: 27.5,
    max: 32,
    unit: "分钟",
    reading: "流失客户平均多等待 3.8 分钟。",
  },
  {
    metric: "附近故障率",
    label: "附近故障率",
    retained: 4.4,
    churned: 5.5,
    max: 7,
    unit: "%",
    reading: "流失客户面对更高的充电设施故障率。",
  },
  {
    metric: "12 周充电次数",
    label: "12 周充电次数",
    retained: 3.1,
    churned: 2.76,
    max: 4,
    unit: "次",
    reading: "流失客户近期使用频次更低。",
  },
  {
    metric: "距上次充电",
    label: "距上次充电",
    retained: 3.8,
    churned: 7.5,
    max: 9,
    unit: "周",
    reading: "使用间隔扩大到接近两倍。",
  },
] as const;

export const frictionSignals = [
  {
    label: "支付失败",
    baseline: 28,
    exposed: 63,
    value: 63,
    comparison: "No 28% → Yes 63%",
    note: "出现支付失败时，观察到的流失率明显上升。",
    unit: "% churn",
    reading: "出现支付失败时，观察到的流失率从约 28% 升至约 63%。",
  },
  {
    label: "退款申请",
    baseline: 29,
    exposed: 43,
    value: 43,
    comparison: "No 29% → Yes 43%",
    note: "退款申请对应更高的观察流失比例。",
    unit: "% churn",
    reading: "退款申请对应更高的流失比例。",
  },
  {
    label: "Basic 计划",
    baseline: 31,
    exposed: 36,
    value: 36,
    comparison: "总体约 31% → Basic 36%",
    note: "Basic 高于整体；计划变量仍需与其他输入共同解释。",
    unit: "% churn",
    reading: "Basic 的流失率高于 Pro；Fleet 不进入个人客户模型。",
  },
] as const;

export const correlations = [
  {
    left: "weeks_since_signup",
    right: "weeks_since_last_charge",
    a: "weeks_since_signup",
    b: "weeks_since_last_charge",
    shortA: "Signup weeks",
    shortB: "Last charge",
    value: 0.88,
    decision: "只保留 weeks_since_last_charge",
  },
  {
    left: "app_version_lag_weeks",
    right: "app_crashes_30d",
    a: "app_version_lag_weeks",
    b: "app_crashes_30d",
    shortA: "Version lag",
    shortB: "App crashes",
    value: 0.41,
    decision: "保留更直接的 app_crashes_30d",
  },
  {
    left: "avg_wait_minutes",
    right: "charger_fault_rate",
    a: "avg_wait_minutes",
    b: "charger_fault_rate",
    shortA: "Wait time",
    shortB: "Fault rate",
    value: 0.39,
    decision: "两者含义不同，均保留",
  },
  {
    left: "avg_wait_minutes",
    right: "peak_share",
    a: "avg_wait_minutes",
    b: "peak_share",
    shortA: "Wait time",
    shortB: "Peak share",
    value: 0.37,
    decision: "peak_share 未进入最终七变量",
  },
] as const;

export const featureDecisions = [
  {
    stage: "结构排除",
    label: "结构排除",
    field: "user_ID / retained_binary",
    decision: "删除标识；把结果来源转换为 churn",
    note: "user_ID 不进入模型；retained_binary 转为明确正类。",
  },
  {
    stage: "总体限定",
    label: "总体限定",
    field: "Fleet rows",
    decision: "排除商业计划记录，仅建模个人客户",
    note: "商业 Fleet 与个人计划使用不同总体边界。",
  },
  {
    stage: "应答质量",
    label: "应答质量",
    field: "satisfaction_survey",
    decision: "非应答比例过高，不进入最终模型",
    note: "调查梯度保留在探索分析，不进入七变量输入。",
  },
  {
    stage: "相关筛查",
    label: "相关筛查",
    field: "weeks_since_signup",
    decision: "与 last charge 相关约 0.88，删除冗余变量",
    note: "保留更直接的 weeks_since_last_charge。",
  },
  {
    stage: "结构复杂度",
    label: "结构复杂度",
    field: "region",
    decision: "16 水平且与服务信号重叠，不进入最终模型",
    note: "区域差异由更直接的等待与故障信号承担。",
  },
  {
    stage: "最终输入",
    label: "最终输入",
    field: "7 predictors",
    decision: "覆盖服务、支付、活跃和计划结构",
    note: "形成七个可追溯 predictor。",
  },
] as const;

export const confusionMatrix = {
  tn: 21825,
  fp: 5261,
  fn: 2022,
  tp: 10092,
  accuracy: 0.8142,
  auc: 0.9053,
  sensitivity: 0.8331,
  specificity: 0.8058,
  falseNegativeRate: 0.1669,
  falsePositiveRate: 0.1942,
  trueNegative: 21825,
  falsePositive: 5261,
  falseNegative: 2022,
  truePositive: 10092,
  total: 39200,
} as const;

export const oddsRatios = [
  {
    id: "payment",
    variable: "payment_failure_last4w = Yes",
    label: "4 周内支付失败",
    type: "二元变量",
    unit: "Yes 相对 No",
    value: 15.9,
    direction: "风险上升",
    interpretation:
      "控制其他变量后，出现支付失败的客户流失 odds 约为未失败客户的 15.9 倍。",
  },
  {
    id: "refund",
    variable: "refund_request_last12w = Yes",
    label: "12 周内退款申请",
    type: "二元变量",
    unit: "Yes 相对 No",
    value: 2.5,
    direction: "风险上升",
    interpretation: "提出退款申请的客户流失 odds 约为未申请客户的 2.5 倍。",
  },
  {
    id: "last-charge",
    variable: "weeks_since_last_charge",
    label: "距上次充电",
    type: "数值变量",
    unit: "每增加 1 周",
    value: 2.01,
    direction: "风险上升",
    interpretation: "在其他变量相同时，每多一周未充电，流失 odds 约乘以 2.01。",
  },
  {
    id: "crash",
    variable: "app_crashes_30d",
    label: "应用崩溃",
    type: "计数变量",
    unit: "每增加 1 次",
    value: 1.18,
    direction: "风险上升",
    interpretation: "30 天内每多一次应用崩溃，流失 odds 约增加 18%。",
  },
  {
    id: "wait",
    variable: "avg_wait_minutes",
    label: "平均等待时间",
    type: "数值变量",
    unit: "每增加 1 分钟",
    value: 1.1,
    direction: "风险上升",
    interpretation: "每多等待一分钟，流失 odds 约增加 10%。",
  },
  {
    id: "fault",
    variable: "charger_fault_rate",
    label: "充电器故障率",
    type: "数值变量",
    unit: "每增加 1 个百分点",
    value: 1.08,
    direction: "风险上升",
    interpretation: "故障率每上升一个百分点，流失 odds 约增加 8%。",
  },
  {
    id: "plus",
    variable: "plan_tier = Plus",
    label: "Plus 计划",
    type: "分类变量",
    unit: "相对 Basic",
    value: 0.62,
    direction: "风险下降",
    interpretation: "控制其他变量后，Plus 客户的流失 odds 约为 Basic 的 0.62 倍。",
  },
  {
    id: "pro",
    variable: "plan_tier = Pro",
    label: "Pro 计划",
    type: "分类变量",
    unit: "相对 Basic",
    value: 0.38,
    direction: "风险下降",
    interpretation: "控制其他变量后，Pro 客户的流失 odds 约为 Basic 的 0.38 倍。",
  },
] as const;

export const deepDives = [
  {
    slug: "data-validation",
    eyebrow: "Technical Deep Dive 01",
    title: "Data & Validation Architecture",
    titleZh: "数据准备、变量筛选与验证架构",
    summary:
      "从 25 字段 schema、Fleet 排除和目标构造进入分层切分、五折验证、折内上采样与两类 recipe，解释每一道数据边界为什么存在。",
  },
  {
    slug: "model-comparison",
    eyebrow: "Technical Deep Dive 02",
    title: "Five-Model Benchmark",
    titleZh: "五种监督学习模型的训练与比较",
    summary:
      "逐一拆解 glm、klaR、ranger、xgboost 与 lightgbm 的输入、参数、预处理和四项指标取舍。",
  },
  {
    slug: "model-selection-error-analysis",
    eyebrow: "Technical Deep Dive 03",
    title: "Model Selection & Error Analysis",
    titleZh: "最终模型选择、ROC 与错误分析",
    summary:
      "从 AUC 选择规则走到 one-time hold-out、概率预测、混淆矩阵、指标公式、ROC 和两类错误的后果。",
  },
  {
    slug: "logistic-interpretation",
    eyebrow: "Technical Deep Dive 04",
    title: "Logistic Regression Interpretation",
    titleZh: "系数、Odds Ratio 与风险信号解释",
    summary:
      "把项目变量放回 log-odds 模型，解释 Basic 参照、单位变化、指数化系数、95% 区间和条件关联边界。",
  },
  {
    slug: "neural-network",
    eyebrow: "Technical Deep Dive 05",
    title: "Neural Network Classification Experiment",
    titleZh: "二维非线性神经网络分类实验",
    summary:
      "独立检验一个 2–2–1 nnet 如何学习弯曲决策边界，展示真实切分、归一化、预测边界、混淆矩阵与测试指标。",
  },
] as const;

export const codeSnippets = {
  cleaning: `data_clean <- data_raw |>
  mutate(
    avg_wait_minutes = parse_number(avg_wait_minutes),
    weeks_since_last_charge = parse_number(weeks_since_last_charge),
    charger_fault_rate = as.numeric(str_remove(charger_fault_rate, "%")),
    churn = factor(
      if_else(retained_binary == 1, "retained", "churned"),
      levels = c("retained", "churned")
    )
  ) |>
  select(-user_ID, -retained_binary)`,
  population: `data_model_prep <- data_clean |>
  filter(tolower(as.character(plan_tier)) != "fleet") |>
  mutate(
    plan_tier = droplevels(plan_tier),
    plan_tier = fct_relevel(plan_tier, "Basic")
  )`,
  features: `PRED_VARS <- c(
  "avg_wait_minutes", "app_crashes_30d",
  "charger_fault_rate", "plan_tier",
  "refund_request_last12w", "payment_failure_last4w",
  "weeks_since_last_charge"
)

df_full <- data_model_prep |>
  select(all_of(c(PRED_VARS, "churn")))`,
  split: `set.seed(404713359)
data_split <- initial_split(df_full, prop = 0.80, strata = churn)
train_full <- training(data_split)
test_data  <- testing(data_split)`,
  resampling: `set.seed(404713359)
train_cv <- train_full |>
  group_by(churn) |>
  slice_sample(prop = 30000 / nrow(train_full)) |>
  ungroup()

set.seed(404713359)
cv_folds <- vfold_cv(train_cv, v = 5, strata = churn)`,
  recipes: `rec_lr <- recipe(churn ~ ., data = train_cv) |>
  step_impute_median(all_numeric_predictors()) |>
  step_unknown(all_nominal_predictors()) |>
  step_dummy(all_nominal_predictors()) |>
  step_zv(all_predictors()) |>
  step_upsample(churn, over_ratio = 1, seed = 404713359)

rec_rf <- recipe(churn ~ ., data = train_cv) |>
  step_impute_median(all_numeric_predictors()) |>
  step_unknown(all_nominal_predictors()) |>
  step_zv(all_predictors()) |>
  step_upsample(churn, over_ratio = 1, seed = 404713359)`,
  models: `lr_model <- logistic_reg() |> set_engine("glm")
rf_model <- rand_forest(trees = 500, min_n = 20) |>
  set_engine("ranger", importance = "impurity") |>
  set_mode("classification")
xgb_model <- boost_tree(trees = 200) |>
  set_engine("xgboost") |> set_mode("classification")
lgbm_model <- boost_tree(trees = 200) |>
  set_engine("lightgbm") |> set_mode("classification")
nb_model <- naive_Bayes(smoothness = 1) |>
  set_engine("klaR") |> set_mode("classification")`,
  metrics: `churn_metrics <- metric_set(
  accuracy,
  roc_auc,
  metric_tweak("sens", sens, event_level = "second"),
  metric_tweak("spec", yardstick::spec, event_level = "second")
)`,
  fitResamples: `lr_res <- lr_wflow |>
  fit_resamples(
    resamples = cv_folds,
    metrics = churn_metrics,
    control = control_grid(save_pred = TRUE)
  )

lr_fold_metrics <- lr_res |>
  collect_metrics(summarize = FALSE)`,
  selection: `best_model_row <- all_cv_res |>
  filter(.metric == "roc_auc") |>
  slice_max(mean, n = 1)

final_wflow <- switch(
  best_model_row$model[1],
  "Logistic Regression" = lr_wflow,
  "Random Forest" = rf_wflow,
  "XGBoost" = xgb_wflow,
  "LightGBM" = lgbm_wflow,
  "Naive Bayes" = nb_wflow
)`,
  finalEvaluation: `final_fit <- final_wflow |>
  last_fit(data_split, metrics = churn_metrics)

final_res  <- collect_metrics(final_fit)
final_pred <- collect_predictions(final_fit)

final_conf <- final_pred |>
  conf_mat(truth = churn, estimate = .pred_class)

roc_data <- final_pred |>
  roc_curve(churn, .pred_churned, event_level = "second")`,
  oddsRatios: `rec_lr_interp <- recipe(churn ~ ., data = train_full) |>
  step_impute_median(all_numeric_predictors()) |>
  step_unknown(all_nominal_predictors()) |>
  step_dummy(all_nominal_predictors()) |>
  step_zv(all_predictors())

lr_coef <- workflow() |>
  add_model(lr_model) |>
  add_recipe(rec_lr_interp) |>
  fit(data = train_full) |>
  extract_fit_parsnip() |>
  broom::tidy(exponentiate = TRUE, conf.int = TRUE)`,
  neuralData: `set.seed(321)
quad_data <- quadBoundaryFunc(3000) |>
  select(A = X1, B = X2, class) |>
  tibble()

set.seed(6262)
data_split <- initial_split(quad_data, prop = 0.8, strata = class)
train_data <- training(data_split)
test_data  <- testing(data_split)`,
  neuralModel: `nnet_recipe <- recipe(class ~ ., data = train_data) |>
  step_normalize(all_predictors())

nnet_model <- mlp(epochs = 1000, hidden_units = 2) |>
  set_engine("nnet") |>
  set_mode("classification")

nnet_workflow <- workflow() |>
  add_recipe(nnet_recipe) |>
  add_model(nnet_model)`,
  neuralEvaluation: `set.seed(987)
nnet_fit <- fit(nnet_workflow, data = train_data)
nnet_res <- augment(nnet_fit, new_data = test_data)

roc_auc(nnet_res, truth = class, .pred_Class1)
accuracy(nnet_res, truth = class, estimate = .pred_class)
conf_mat(nnet_res, truth = class, estimate = .pred_class)`,
} as const;
