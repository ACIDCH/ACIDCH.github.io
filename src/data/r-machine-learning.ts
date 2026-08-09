export type MetricKey = "accuracy" | "auc" | "sensitivity" | "specificity";

export interface ModelResult {
  id: string;
  name: string;
  family: string;
  engine: string;
  parameters: string;
  recipe: string;
  accuracy: number;
  auc: number;
  sensitivity: number;
  specificity: number;
  reading: string;
}

export const projectBasePath = "/zh/projects/customer-churn-machine-learning/";

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
    family: "线性分类",
    engine: "glm",
    parameters: "默认逻辑回归规格",
    recipe: "Dummy 编码、零方差移除、折内上采样",
    accuracy: 0.8136,
    auc: 0.9024,
    sensitivity: 0.8281,
    specificity: 0.8071,
    reading: "AUC 排名第 1，Sensitivity 接近最高值，并可用系数解释变量方向。",
  },
  {
    id: "naive-bayes",
    name: "Naive Bayes",
    family: "概率分类",
    engine: "klaR",
    parameters: "Laplace smoothness = 1",
    recipe: "保留分类变量、零方差移除、折内上采样",
    accuracy: 0.8098,
    auc: 0.8996,
    sensitivity: 0.8318,
    specificity: 0.7999,
    reading: "Sensitivity 排名第 1，但 Accuracy 与 Specificity 在五个模型中最低。",
  },
  {
    id: "random-forest",
    name: "Random Forest",
    family: "Bagging 集成",
    engine: "ranger",
    parameters: "500 trees；min_n = 20",
    recipe: "保留分类变量、零方差移除、折内上采样",
    accuracy: 0.8187,
    auc: 0.8964,
    sensitivity: 0.7966,
    specificity: 0.8286,
    reading: "Accuracy 与 Specificity 较高，但对流失客户的召回低于线性和概率模型。",
  },
  {
    id: "lightgbm",
    name: "LightGBM",
    family: "Boosting 集成",
    engine: "lightgbm",
    parameters: "200 trees",
    recipe: "保留分类变量、零方差移除、折内上采样",
    accuracy: 0.8199,
    auc: 0.8955,
    sensitivity: 0.7994,
    specificity: 0.8291,
    reading:
      "Accuracy 排名第 1，Specificity 排名第 2，但 AUC 和 Sensitivity 没有领先。",
  },
  {
    id: "xgboost",
    name: "XGBoost",
    family: "Boosting 集成",
    engine: "xgboost",
    parameters: "200 trees；默认 depth 6、learn rate 0.3",
    recipe: "Dummy 编码、零方差移除、折内上采样",
    accuracy: 0.8142,
    auc: 0.8842,
    sensitivity: 0.7632,
    specificity: 0.837,
    reading: "Specificity 排名第 1，同时也是漏掉流失客户最多的模型。",
  },
];

export const pipelineSteps = [
  {
    number: "01",
    title: "数据理解",
    detail: "检查 200,000 条合成客户记录、25 个字段和约 31% 的流失比例。",
    evidence: "200,000 行 · 25 个字段 · 约 31% 流失",
    nextQuestion: "合同结构不同的 Fleet 是否应与个人会员共同建模？",
  },
  {
    number: "02",
    title: "字段清理",
    detail: "统一单位、百分比、分类字段和二元字段，删除记录标识并定义正类。",
    evidence: "churned 设为第二水平；记录标识不进入模型",
    nextQuestion: "哪些字段能回答流失问题，哪些会带来缺失或代理风险？",
  },
  {
    number: "03",
    title: "变量筛选",
    detail: "排除 Fleet 计划，保留 7 个输入变量，并移除高度相关的注册时长。",
    evidence: "196,000 行 · 7 个输入 · 相关系数 0.88",
    nextQuestion: "怎样在比较模型之前隔离最终测试数据？",
  },
  {
    number: "04",
    title: "训练 / 测试划分",
    detail: "按流失状态进行 80/20 分层划分，测试集在模型选择前保持隔离。",
    evidence: "训练 156,800 · 测试 39,200 · seed 404713359",
    nextQuestion: "完整训练集较大，如何建立一致且可复查的比较样本？",
  },
  {
    number: "05",
    title: "交叉验证样本",
    detail: "从训练部分分层抽取 30,000 行，建立 5 折分层交叉验证。",
    evidence: "30,000 行 · 5 folds · churn 分层",
    nextQuestion: "类别不平衡应在哪个环节处理，才能避免验证泄漏？",
  },
  {
    number: "06",
    title: "折内预处理",
    detail: "按模型选择编码方式，并在每个训练折内部将流失类别上采样至 1:1。",
    evidence: "两套 recipe · 训练折内 1:1 上采样",
    nextQuestion: "哪些指标能同时反映排序能力、漏判与误报？",
  },
  {
    number: "07",
    title: "五模型比较",
    detail: "用 Accuracy、AUC-ROC、Sensitivity 和 Specificity 比较五折均值。",
    evidence: "5 个模型 · 4 项指标 · Logistic AUC 0.9024",
    nextQuestion: "交叉验证中的首选模型能否在未参与选择的数据上保持表现？",
  },
  {
    number: "08",
    title: "留出集评价",
    detail: "选择 Logistic Regression 后，在 39,200 条测试记录上完成一次评价。",
    evidence: "AUC 0.9053 · Sensitivity 0.8332 · Specificity 0.8058",
    nextQuestion: "预测错误和变量方向分别说明什么？",
  },
  {
    number: "09",
    title: "结果解释",
    detail: "结合混淆矩阵、ROC AUC 和 odds ratio 解释模型边界与主要变量。",
    evidence: "TP 10,092 · FN 2,022 · 8 项 odds ratio",
    nextQuestion: "结果应如何转化为筛查顺序，而不越过数据边界？",
  },
];

export const predictors = [
  { name: "avg_wait_minutes", label: "平均等待时间", type: "数值" },
  { name: "app_crashes_30d", label: "30 天应用崩溃次数", type: "数值" },
  { name: "charger_fault_rate", label: "充电设备故障率", type: "数值" },
  { name: "plan_tier", label: "会员计划", type: "分类" },
  { name: "refund_request_last12w", label: "12 周退款申请", type: "分类" },
  { name: "payment_failure_last4w", label: "4 周支付失败", type: "分类" },
  { name: "weeks_since_last_charge", label: "距上次充电周数", type: "数值" },
];

export const sampleFlow = [
  {
    id: "raw",
    value: 200000,
    display: "200,000",
    label: "原始客户记录",
    note: "25 个字段，包含人口属性、计划、行为、服务与互动信号。",
  },
  {
    id: "model",
    value: 196000,
    display: "196,000",
    label: "个人客户建模集",
    note: "排除合同与流失逻辑不同的 Fleet 记录。",
  },
  {
    id: "train",
    value: 156800,
    display: "156,800",
    label: "训练部分",
    note: "用于交叉验证比较与最终模型重拟合。",
  },
  {
    id: "test",
    value: 39200,
    display: "39,200",
    label: "留出测试集",
    note: "模型选择完成后只用于最终评价。",
  },
  {
    id: "cv",
    value: 30000,
    display: "30,000",
    label: "交叉验证样本",
    note: "从训练部分分层抽取，进行 5 折比较。",
  },
] as const;

export const holdoutClassDistribution = [
  { label: "保留", value: 27086, display: "27,086", share: 69.1 },
  { label: "流失", value: 12114, display: "12,114", share: 30.9 },
] as const;

export const behaviourComparisons = [
  {
    label: "距上次充电",
    unit: "周",
    churned: 7.5,
    retained: 3.8,
    max: 8,
    reading: "流失客户距离最近一次充电平均多出 3.7 周。",
  },
  {
    label: "平均等待时间",
    unit: "分钟",
    churned: 27.5,
    retained: 23.7,
    max: 30,
    reading: "流失客户开始充电前的平均等待更长。",
  },
  {
    label: "设备故障率",
    unit: "%",
    churned: 5.5,
    retained: 4.4,
    max: 6,
    reading: "流失客户附近的充电设备故障率更高。",
  },
  {
    label: "12 周充电次数",
    unit: "次",
    churned: 2.76,
    retained: 3.1,
    max: 3.5,
    reading: "流失客户近期完成的充电次数更少。",
  },
] as const;

export const frictionSignals = [
  {
    label: "发生支付失败",
    value: 63,
    comparison: "未发生时 28%",
    note: "4 周支付失败与流失率差异最大。",
  },
  {
    label: "提出退款申请",
    value: 43,
    comparison: "12 周窗口",
    note: "退款摩擦与更高流失率同时出现。",
  },
  {
    label: "受到价格变动影响",
    value: 39,
    comparison: "已暴露客户",
    note: "价格变化信号高于约 31% 的总体流失比例。",
  },
] as const;

export const correlations = [
  {
    a: "距上次充电周数",
    b: "注册周数",
    shortA: "最近充电",
    shortB: "注册时长",
    value: 0.88,
    decision: "只保留距上次充电周数",
  },
  {
    a: "应用版本滞后",
    b: "应用崩溃次数",
    shortA: "版本滞后",
    shortB: "应用崩溃",
    value: 0.41,
    decision: "中度相关，继续结合 EDA 判断",
  },
  {
    a: "平均等待时间",
    b: "设备故障率",
    shortA: "等待时间",
    shortB: "故障率",
    value: 0.39,
    decision: "两项服务质量信号均保留",
  },
  {
    a: "平均等待时间",
    b: "高峰充电占比",
    shortA: "等待时间",
    shortB: "高峰占比",
    value: 0.37,
    decision: "高峰占比未进入最终输入",
  },
] as const;

export const featureDecisions = [
  {
    label: "25 个原始字段",
    note: "人口属性、会员计划、充电行为、服务可靠性、互动和运营事件。",
  },
  {
    label: "统一字段语义",
    note: "解析单位与百分比，规范二元字段、因子水平和 churn 正类。",
  },
  {
    label: "限定分析对象",
    note: "排除 Fleet；Basic 作为个人会员计划的参考水平。",
  },
  {
    label: "EDA 筛选",
    note: "保留服务质量、支付退款摩擦、活跃度和会员结构信号。",
  },
  {
    label: "相关性检查",
    note: "0.88 的变量对只保留更接近近期活跃度的一项。",
  },
  {
    label: "7 个最终输入",
    note: "4 个数值变量、3 个分类变量，加上 churn 目标。",
  },
] as const;

export const rocTrace = [
  [0, 0],
  [0.006, 0.17],
  [0.012, 0.3],
  [0.025, 0.45],
  [0.045, 0.58],
  [0.075, 0.68],
  [0.12, 0.76],
  [0.19, 0.84],
  [0.29, 0.9],
  [0.42, 0.95],
  [0.58, 0.98],
  [0.77, 0.995],
  [1, 1],
] as const;

export const confusionMatrix = {
  trueNegative: 21825,
  falsePositive: 5261,
  falseNegative: 2022,
  truePositive: 10092,
  total: 39200,
  accuracy: 0.8142,
  auc: 0.9053,
  sensitivity: 0.8332,
  specificity: 0.8058,
};

export const oddsRatios = [
  { label: "支付失败", value: 15.9, direction: "risk" },
  { label: "退款申请", value: 2.5, direction: "risk" },
  { label: "距上次充电周数", value: 2.01, direction: "risk" },
  { label: "应用崩溃次数", value: 1.18, direction: "risk" },
  { label: "平均等待时间", value: 1.1, direction: "risk" },
  { label: "设备故障率", value: 1.08, direction: "risk" },
  { label: "Plus 计划", value: 0.62, direction: "protective" },
  { label: "Pro 计划", value: 0.38, direction: "protective" },
] as const;

export const deepDives = [
  {
    slug: "workflow",
    title: "完整建模流程",
    eyebrow: "Technical Deep Dive 01",
    summary: "从字段清理、变量筛选到折内上采样与留出集评价，拆解数据如何进入五个模型。",
    keywords: "R workflow recipe data split preprocessing upsampling 建模流程 数据准备",
  },
  {
    slug: "model-comparison",
    title: "五模型比较",
    eyebrow: "Technical Deep Dive 02",
    summary: "用四项交叉验证指标比较线性、概率、Bagging 与 Boosting 模型的取舍。",
    keywords:
      "model comparison logistic regression random forest xgboost lightgbm naive bayes 模型比较",
  },
  {
    slug: "neural-network",
    title: "非线性分类神经网络",
    eyebrow: "Technical Deep Dive 03",
    summary:
      "独立二维分类实验：两个输入、一层两个隐藏节点和二分类输出，结构与客户流失模型结果分开。",
    keywords:
      "neural network nnet mlp supervised learning classification 神经网络 监督学习 分类",
  },
  {
    slug: "prediction-evaluation",
    title: "预测与评估",
    eyebrow: "Technical Deep Dive 04",
    summary: "检查 39,200 条留出记录的混淆矩阵、AUC 与 odds ratio，解释漏判和误报。",
    keywords:
      "prediction evaluation confusion matrix roc auc odds ratio 预测 评估 混淆矩阵",
  },
];

export const codeSnippets = {
  variableSelection: {
    title: "筛选 7 个输入变量",
    code: `PRED_VARS <- c(
  "avg_wait_minutes",
  "app_crashes_30d",
  "charger_fault_rate",
  "plan_tier",
  "refund_request_last12w",
  "payment_failure_last4w",
  "weeks_since_last_charge"
)

df_full <- data_model_prep |>
  select(all_of(c(PRED_VARS, "churn")))`,
  },
  split: {
    title: "分层训练 / 测试划分",
    code: `set.seed(404713359)

data_split <- initial_split(
  df_full,
  prop = 0.80,
  strata = churn
)

train_full <- training(data_split)
test_data <- testing(data_split)`,
  },
  crossValidation: {
    title: "30,000 行交叉验证样本",
    code: `train_cv <- train_full |>
  group_by(churn) |>
  slice_sample(prop = 30000 / nrow(train_full)) |>
  ungroup()

set.seed(404713359)
cv_folds <- vfold_cv(train_cv, v = 5, strata = churn)`,
  },
  recipes: {
    title: "按模型拆分预处理 recipe",
    code: `rec_lr <- recipe(churn ~ ., data = train_cv) |>
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
  },
  modelSpecs: {
    title: "五个模型规格",
    code: `lr_model <- logistic_reg() |>
  set_engine("glm")

rf_model <- rand_forest(trees = 500, min_n = 20) |>
  set_engine("ranger", importance = "impurity") |>
  set_mode("classification")

xgb_model <- boost_tree(trees = 200) |>
  set_engine("xgboost") |>
  set_mode("classification")

lgbm_model <- boost_tree(trees = 200) |>
  set_engine("lightgbm") |>
  set_mode("classification")

nb_model <- naive_Bayes(smoothness = 1) |>
  set_engine("klaR") |>
  set_mode("classification")`,
  },
  metricSet: {
    title: "正类方向与评价指标",
    code: `churn_metrics <- metric_set(
  accuracy,
  roc_auc,
  metric_tweak("sens", sens, event_level = "second"),
  metric_tweak(
    "spec",
    yardstick::spec,
    event_level = "second"
  )
)`,
  },
  finalFit: {
    title: "选择模型并评价留出集",
    code: `best_model_row <- all_cv_res |>
  filter(.metric == "roc_auc") |>
  slice_max(mean, n = 1)

final_fit <- final_wflow |>
  last_fit(data_split, metrics = churn_metrics)

final_res <- collect_metrics(final_fit)
final_pred <- collect_predictions(final_fit)`,
  },
  confusion: {
    title: "混淆矩阵与 ROC AUC",
    code: `final_conf <- final_pred |>
  conf_mat(truth = churn, estimate = .pred_class)

roc_data <- final_pred |>
  roc_curve(
    truth = churn,
    .pred_churned,
    event_level = "second"
  )

auc_val <- roc_auc(
  final_pred,
  truth = churn,
  .pred_churned,
  event_level = "second"
)`,
  },
  oddsRatio: {
    title: "重估解释模型并提取 odds ratio",
    code: `rec_lr_interp <- recipe(churn ~ ., data = train_cv) |>
  step_impute_median(all_numeric_predictors()) |>
  step_unknown(all_nominal_predictors()) |>
  step_dummy(all_nominal_predictors()) |>
  step_zv(all_predictors())

lr_final_fit <- workflow() |>
  add_model(lr_model) |>
  add_recipe(rec_lr_interp) |>
  fit(data = train_full)

lr_coef <- lr_final_fit |>
  extract_fit_parsnip() |>
  broom::tidy(exponentiate = TRUE, conf.int = TRUE)`,
  },
  neuralNetwork: {
    title: "二维分类神经网络",
    code: `set.seed(6262)
data_split <- initial_split(
  quad_data,
  prop = 0.8,
  strata = class
)

nnet_recipe <- recipe(class ~ ., data = training(data_split)) |>
  step_normalize(all_predictors())

nnet_model <- mlp(epochs = 1000, hidden_units = 2) |>
  set_engine("nnet") |>
  set_mode("classification")`,
  },
} as const;
