import type { Locale } from "../config/site";

type StringShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly StringShape<U>[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: StringShape<T[K]> }
      : T;

const en = {
  correlation: {
    kicker: "Interactive chart · Correlation",
    title: "How does the scatterplot change as correlation strength changes?",
    intro:
      "Adjust the target correlation coefficient to move from a clear negative relationship through a weak relationship to a clear positive one. Correlation describes the strength of a linear relationship; it does not establish causation.",
    target: "Target correlation direction:",
    initialReading: "Clear positive linear relationship",
    chartLabel: "Interactive correlation scatterplot",
    caption:
      "Each point represents one business observation. Read the horizontal axis as service load and the vertical axis as wait time; the fixed teaching data isolates the relationship between the coefficient and the scatter pattern.",
    strongPositive: "Clear positive linear relationship",
    strongNegative: "Clear negative linear relationship",
    moderatePositive: "Moderate positive linear relationship",
    moderateNegative: "Moderate negative linear relationship",
    weak: "Weak linear relationship",
    xAxis: "Standardised service load",
    yAxis: "Standardised wait time",
  },
  descriptiveStatistics: {
    kicker: "Read three charts from the same observations",
    title: "Service response-time workbench",
    intro:
      "The 24 records are measured in minutes. The slider changes only the final 68-minute observation; the mean, median, IQR, sample standard deviation, CV, z-score and all three charts update together. You can restore the baseline at any time.",
    controlsLabel: "Data controls",
    selectedObservation: "Observation 24:",
    minutes: "minutes",
    observationAria: "Observation 24",
    rangeHelp:
      "Range 34–120 minutes; use the arrow keys to adjust, or Home / End for the minimum / maximum.",
    reset: "Restore baseline",
    initialStatus:
      "Baseline: 24 service events; mean 20.75 minutes, median 17.5 minutes.",
    mean: "Mean",
    median: "Median",
    iqr: "IQR",
    sampleSd: "Sample standard deviation",
    selectedZScore: "Observation 24 z-score",
    histogramCaption:
      "Histogram: 0–120 minutes in 12 fixed equal-width bins (10 minutes each)",
    histogramLabel: "Service response-time histogram",
    histogramNote:
      "Keeping the bin rules fixed shows how the right tail and overall mean move when the final observation changes.",
    boxplotCaption:
      "Boxplot: type 7 quartiles, 1.5 × IQR fences and observed whisker endpoints",
    boxplotLabel: "Service response-time boxplot",
    boxplotNote:
      "The box spans Q1 to Q3; whiskers end at the most distant observed records inside the fences, and outside points are marked separately.",
    ecdfCaption: "ECDF: cumulative share at or below a response time",
    ecdfLabel: "Empirical cumulative distribution of service response time",
    ecdfNote:
      "Reading the curve at 20 minutes gives the share of records at or below that time; the baseline is 62.5%.",
    readingTitle: "Reading guide",
    initialReading:
      "Use the mean and median together to distinguish the centre of most observations from the effect of the long tail.",
    formulaMean: "Sample mean",
    formulaMeanDescription:
      "Every observation contributes equally to the overall average.",
    formulaSd: "Sample standard deviation",
    formulaSdDescription:
      "Uses n − 1 in the denominator; R's sd() follows the same convention.",
    formulaZ: "Standard score",
    formulaZDescription:
      "Expresses one observation as a number of sample standard deviations from the mean.",
    rTitle: "Run this R code on the page",
    rIntro:
      "The code runs in an in-browser R environment. Edit it and run it again; errors are shown as readable R output.",
    rCodeLabel: "R code",
    rRun: "Run R code",
    rCopy: "Copy code",
    rReset: "Restore example",
    rInitialOutput:
      "Not run yet. The example calculates a summary, quantiles, mean, median, sample standard deviation and IQR.",
    noscript:
      "Without JavaScript, the baseline summary is still available: 24 records have a mean of 20.75 minutes, a median of 17.5 minutes and a sample standard deviation of 14.30 minutes; 52 and 68 minutes exceed the upper fence of 43 minutes.",
    numberLocale: "en-NZ",
    axisLabel: "First response time (minutes)",
    medianPrefix: "Median",
    twentyMinutesPrefix: "20 minutes",
    currentRecordPrefix: "Observation 24 is",
    meanLower: "mean",
    medianLower: "median",
    readingDifferencePrefix: "The mean and median differ by",
    upperFencePrefix: "The upper fence is",
    outliersPrefix: "records outside the fences are",
    noOutliers: "No records currently lie outside the 1.5 × IQR fences.",
    stableRules:
      "The histogram bins, boxplot rules and ECDF interpretation remain fixed, so the change comes from the same single observation.",
    listSeparator: ", ",
    loadingR: "Loading the R environment…",
    calculating: "Calculating…",
    emptyResult: "The code ran without producing text output.",
    runFailed: "Run failed:",
    copied: "Code copied.",
    copyDenied: "The browser did not grant clipboard access; copy the code manually.",
    restored: "Example code restored; run it to display the calculated result.",
  },
  normalDistribution: {
    kicker: "Interactive chart · Probability distribution",
    title:
      "How do the mean, standard deviation and threshold change cumulative probability?",
    intro:
      "Adjust the mean, standard deviation and threshold to update the curve and cumulative probability together. Focus on the relationship among location, spread and threshold instead of memorising one fixed value.",
    controlsLabel: "Normal distribution parameters",
    mean: "Mean μ:",
    standardDeviation: "Standard deviation σ:",
    threshold: "Threshold x:",
    initialReading:
      "The threshold is above the mean, so cumulative probability exceeds 50%.",
    chartLabel: "Interactive normal distribution curve",
    caption:
      "The vertical axis shows probability density, and the shaded area is the cumulative probability to the left of the threshold. A wider curve does not increase total probability; the area under the curve remains 1.",
    equalReading: "The threshold equals the mean, so cumulative probability is 50%.",
    aboveReading:
      "The threshold is above the mean, so cumulative probability exceeds 50%.",
    belowReading:
      "The threshold is below the mean, so cumulative probability is below 50%.",
    xAxis: "Variable value",
  },
  samplingPrecision: {
    kicker: "Interactive chart · Sampling precision",
    title: "How much does the interval narrow when the sample grows?",
    intro:
      "Keep the sample proportion at 42% while changing sample size and confidence level. This common large-sample normal approximation highlights changes in standard error and margin of error; it is not the only method for proportion intervals.",
    sampleSize: "Sample size n:",
    confidenceLevel: "Confidence level",
    reset: "Restore defaults",
    sampleProportion: "Sample proportion",
    intervalWidth: "Interval width",
    chartLabel: "Proportion confidence interval by sample size and confidence level",
    caption:
      "Increasing the sample size from 100 to 400 roughly halves the standard error. The chart makes the 1/√n relationship visible.",
    largeSample:
      "A larger sample clearly reduces the standard error, so the interval narrows at the same confidence level.",
    highConfidence:
      "A 99% confidence level requires a larger critical value, so the interval is wider than at 95% for the same sample size.",
    defaultMessage:
      "Multiplying n by four roughly halves the standard error; raising the confidence level widens the interval again.",
  },
  regression: {
    kicker: "Interactive chart · Regression",
    title: "How do noise and an extreme point change the fitted line and R²?",
    intro:
      "Adjust random variation and the final observation to recompute the least-squares line. Watch whether one extreme point pulls the fit and whether R² falls as noise increases.",
    controlsLabel: "Regression demonstration parameters",
    noise: "Random variation:",
    outlier: "Final observation offset:",
    intercept: "Intercept",
    slope: "Slope",
    chartLabel: "Interactive linear regression scatterplot and fitted line",
    caption:
      "The horizontal axis is a business input and the vertical axis an outcome. Fixed teaching data is used; the slope describes direction and average change, while R² only reports the share of sample variation explained by the linear model.",
    xAxis: "Business input",
    yAxis: "Outcome variable",
  },
  regressionDiagnostics: {
    kicker: "Interactive chart · Regression diagnostics",
    title: "The same fitted line can hide entirely different residual structures",
    intro:
      "Switch scenarios to compare residuals randomly centred on 0, expanding variance, curvature and a single influential observation.",
    controlsLabel: "Residual scenarios",
    modes: {
      clean: "Random residuals",
      fan: "Funnel shape",
      curve: "Curved pattern",
      influence: "Influential point",
    },
    maxResidual: "Maximum |standardised residual|",
    diagnosticSignal: "Diagnostic signal",
    initialSignal: "Stable structure",
    chartLabel: "Interactive fitted-values versus residuals diagnostic plot",
    caption:
      "The horizontal axis shows fitted values and the vertical axis residuals. An ideal residual plot need not be perfectly uniform, but it should not show persistent curvature, a funnel, or a pattern dominated by one point.",
    signals: {
      clean: "Stable structure",
      fan: "Variance expands with fitted values",
      curve: "Functional form may be inadequate",
      influence: "One point is too influential",
      fallback: "Inspect residuals",
    },
    xAxis: "Fitted values",
    yAxis: "Residuals",
  },
  polynomialRegression: {
    kicker: "Interactive chart · Functional form",
    title: "Does a higher degree capture structure or chase noise?",
    intro:
      "Switch among linear, quadratic and cubic models to compare the fitted curve, training error and behaviour outside the observed range. More complexity does not automatically improve interpretability or generalisation.",
    controlsLabel: "Polynomial degree",
    model: "Model",
    trainingRmse: "Training RMSE",
    interpretation: "Interpretation reminder",
    initialWarning: "First verify that the curvature has a business meaning",
    chartLabel: "Polynomial regression fitted curves",
    caption:
      "The demonstration data is fixed. The curves compare functional forms; a higher degree is not inherently better. Formal modelling should also examine validation error, residual structure and business interpretability.",
    warnings: {
      1: "May omit systematic curvature",
      2: "First verify that the curvature has a business meaning",
      3: "Predictions outside the observed range are more fragile",
    },
    xAxis: "Business input",
    yAxis: "Outcome variable",
  },
  multicollinearity: {
    kicker: "Interactive calculation · Multicollinearity",
    title:
      "As predictors become more alike, individual coefficients become harder to interpret reliably",
    intro:
      "Drag the correlation between two explanatory variables. VIF updates from 1 / (1 − R²) to show how duplicated information inflates coefficient variance.",
    predictorCorrelation: "Predictor correlation:",
    interpretation: "Interpretation",
    initialSignal: "Low information overlap",
    initialNote:
      "This level usually does not materially inflate coefficient uncertainty.",
    lowSignal: "Low information overlap",
    lowNote: "This level usually does not materially inflate coefficient uncertainty.",
    mediumSignal: "Requires attention",
    mediumNote:
      "Coefficient standard errors may now expand noticeably. Check the correlation matrix, business definitions and alternative specifications together.",
    highSignal: "High collinearity",
    highNote:
      "Individual coefficients may be very sensitive to sample variation. Prediction may remain useful, but interpretation requires more caution.",
  },
  modelSelection: {
    kicker: "Interactive comparison · Model selection",
    title:
      "The ‘best model’ depends on whether the goal is explanation, simplicity or out-of-sample error",
    intro:
      "Switch criteria to compare four candidate regression specifications. Adjusted R², BIC and cross-validation MSE can prefer different models, so variable selection must begin with a clear objective.",
    controlsLabel: "Model selection criterion",
    currentBest: "Current preference",
    modelHeader: "Model",
    predictorsHeader: "Predictors",
    predictorLabels: ["Distance", "+ Order size", "+ Priority", "+ 4 extra terms"],
    initialReason:
      "The gain in explanatory power still outweighs the complexity penalty.",
    reasons: {
      adjr2: "The gain in explanatory power still outweighs the complexity penalty.",
      bic: "It strikes a stronger simplicity balance between fit and parameter count.",
      cv: "It has the lowest out-of-sample mean squared error.",
    },
  },
  logisticRegression: {
    kicker: "Interactive chart · Logistic regression",
    title: "A probability model and a classification threshold are different decisions",
    intro:
      "Move the business risk score to inspect the predicted probability, then change the classification threshold to see how the same probabilities produce different TP, FP, FN and TN counts.",
    riskScore: "Risk score:",
    threshold: "Classification threshold:",
    predictedProbability: "Predicted probability",
    predictedClass: "Predicted class",
    odds: "Odds",
    highRisk: "High risk",
    lowRisk: "Low risk",
    xAxis: "Risk score",
    chartLabel: "Logistic regression probability curve",
    caption:
      "The curve outputs a conditional probability. The threshold only turns probability into a business action; changing it does not re-estimate the model coefficients.",
  },
} as const;

type LearningLabUi = StringShape<typeof en>;

const zh = {
  correlation: {
    kicker: "互动图表 · 相关性",
    title: "同样的数据点，相关强度改变时散点图会怎样变化？",
    intro:
      "调整目标相关系数，散点图会从明显负相关逐步过渡到弱相关和明显正相关。相关系数描述线性关系强弱，但不能代替因果解释。",
    target: "目标相关方向：",
    initialReading: "明显正线性关系",
    chartLabel: "可交互相关性散点图",
    caption:
      "每个点代表一条业务观察。横轴可理解为服务负荷，纵轴可理解为等待时间；这里只用固定教学数据展示相关系数与散点形态之间的关系。",
    strongPositive: "明显正线性关系",
    strongNegative: "明显负线性关系",
    moderatePositive: "中等正线性关系",
    moderateNegative: "中等负线性关系",
    weak: "线性关系较弱",
    xAxis: "标准化服务负荷",
    yAxis: "标准化等待时间",
  },
  descriptiveStatistics: {
    kicker: "用同一组观察值读三张图",
    title: "服务响应时长观察台",
    intro:
      "24 条记录以分钟计。滑块只调整最后一条 68 分钟的观察值；均值、中位数、IQR、样本标准差、CV、z-score 与三张图会同步更新。基准值可以随时恢复。",
    controlsLabel: "数据操作",
    selectedObservation: "第 24 条观察值：",
    minutes: "分钟",
    observationAria: "第 24 条观察值",
    rangeHelp: "范围 34–120 分钟；使用方向键微调，Home / End 跳到最小 / 最大值。",
    reset: "恢复基准值",
    initialStatus: "基准数据：24 条服务事件；均值 20.75 分钟，中位数 17.5 分钟。",
    mean: "均值",
    median: "中位数",
    iqr: "IQR",
    sampleSd: "样本标准差",
    selectedZScore: "第 24 条 z-score",
    histogramCaption: "直方图：0–120 分钟，固定 12 个等宽区间（每箱 10 分钟）",
    histogramLabel: "服务响应时长直方图",
    histogramNote:
      "分箱规则保持不变，才能看清最后一条记录改变后，右侧尾部与总体均值如何一起移动。",
    boxplotCaption: "箱线图：type 7 四分位数、1.5 × IQR 围栏与实际须端点",
    boxplotLabel: "服务响应时长箱线图",
    boxplotNote:
      "箱体覆盖 Q1 至 Q3；须端点是围栏内最远的实际记录，围栏外的点单独标记。",
    ecdfCaption: "ECDF：不超过给定时长的累计比例",
    ecdfLabel: "服务响应时长经验累积分布函数",
    ecdfNote: "在 20 分钟处读取曲线，可得到不超过该时长的记录比例；基准数据为 62.5%。",
    readingTitle: "读数提示",
    initialReading: "均值与中位数同时存在，才能分辨主体位置与长尾影响。",
    formulaMean: "样本均值",
    formulaMeanDescription: "每条观察值等权进入总体平均水平。",
    formulaSd: "样本标准差",
    formulaSdDescription: "以 n − 1 为分母；R 的 sd() 使用同一约定。",
    formulaZ: "标准分数",
    formulaZDescription: "把单条记录写成距离均值多少个样本标准差。",
    rTitle: "在页面中运行这段 R 代码",
    rIntro:
      "代码在浏览器内的 R 运行环境执行，可修改后再次运行。错误会直接显示为可阅读的 R 输出。",
    rCodeLabel: "R 代码",
    rRun: "运行 R 代码",
    rCopy: "复制代码",
    rReset: "恢复示例",
    rInitialOutput:
      "尚未运行。示例代码会计算摘要、分位数、均值、中位数、样本标准差和 IQR。",
    noscript:
      "JavaScript 未启用时，基准摘要仍可阅读：24 条记录的均值为 20.75 分钟，中位数为 17.5 分钟，样本标准差为 14.30 分钟；52 与 68 分钟超过 43 分钟的上围栏。",
    numberLocale: "zh-CN",
    axisLabel: "首次响应时长（分钟）",
    medianPrefix: "中位数",
    twentyMinutesPrefix: "20 分钟",
    currentRecordPrefix: "当前第 24 条记录为",
    meanLower: "均值",
    medianLower: "中位数",
    readingDifferencePrefix: "均值与中位数相差",
    upperFencePrefix: "上围栏为",
    outliersPrefix: "围栏外记录为",
    noOutliers: "当前没有落在 1.5 × IQR 围栏外的记录。",
    stableRules:
      "直方图的分箱、箱线图的规则和 ECDF 的读法均保持不变，因此变化来自同一条观察值。",
    listSeparator: "、",
    loadingR: "正在加载 R 运行环境…",
    calculating: "正在计算…",
    emptyResult: "代码已运行，没有产生文本输出。",
    runFailed: "运行失败：",
    copied: "代码已复制。",
    copyDenied: "浏览器未授予复制权限，请手动复制代码。",
    restored: "已恢复示例代码；运行后将显示实际计算结果。",
  },
  normalDistribution: {
    kicker: "互动图表 · 概率分布",
    title: "均值、标准差与阈值如何共同改变累计概率？",
    intro:
      "调整均值、标准差和阈值，曲线与累计概率会同步变化。重点不是记住某个固定数值，而是观察位置、离散程度和阈值之间的关系。",
    controlsLabel: "正态分布参数",
    mean: "均值 μ：",
    standardDeviation: "标准差 σ：",
    threshold: "阈值 x：",
    initialReading: "阈值位于均值右侧，因此累计概率超过 50%。",
    chartLabel: "可交互正态分布曲线",
    caption:
      "纵轴表示概率密度，阴影区域对应阈值左侧的累计概率。曲线变宽并不代表总概率增加，曲线下面积始终为 1。",
    equalReading: "阈值正好位于均值，累计概率为 50%。",
    aboveReading: "阈值位于均值右侧，因此累计概率超过 50%。",
    belowReading: "阈值位于均值左侧，因此累计概率低于 50%。",
    xAxis: "变量取值",
  },
  samplingPrecision: {
    kicker: "互动图表 · 抽样精度",
    title: "样本变多以后，区间究竟会缩多少？",
    intro:
      "固定样本比例为 42%，改变样本量和置信水平。这里使用常见的大样本比例正态近似，重点观察 standard error 与 margin of error 的变化，而不是把这个示例当成所有比例区间的唯一算法。",
    sampleSize: "样本量 n：",
    confidenceLevel: "置信水平",
    reset: "恢复默认",
    sampleProportion: "样本比例",
    intervalWidth: "区间宽度",
    chartLabel: "样本比例置信区间随样本量和置信水平变化",
    caption:
      "样本量从 100 增加到 400 时，standard error 大约减半；这就是 1/√n 关系在图上的表现。",
    largeSample:
      "样本量较大时 standard error 明显缩小；在相同置信水平下，区间随之收窄。",
    highConfidence:
      "99% 置信水平需要更大的临界值，因此即使样本量不变，区间也会比 95% 更宽。",
    defaultMessage:
      "把 n 扩大四倍，standard error 大约减半；提高置信水平则会把区间重新拉宽。",
  },
  regression: {
    kicker: "互动图表 · 回归",
    title: "噪声与极端点如何改变拟合线和 R²？",
    intro:
      "调整随机波动和最后一条观察值，页面会重新计算最小二乘直线。重点观察拟合线是否被单个极端点拉动，以及 R² 是否随着噪声增加而下降。",
    controlsLabel: "回归演示参数",
    noise: "随机波动：",
    outlier: "最后一条记录偏移：",
    intercept: "截距",
    slope: "斜率",
    chartLabel: "可交互线性回归散点图与拟合线",
    caption:
      "横轴代表业务输入，纵轴代表结果变量。演示使用固定教学数据；斜率描述线性方向和平均变化，R² 只表示线性模型解释的样本变异比例。",
    xAxis: "业务输入",
    yAxis: "结果变量",
  },
  regressionDiagnostics: {
    kicker: "互动图表 · Regression diagnostics",
    title: "同一条拟合线，残差结构可能完全不同",
    intro:
      "切换情景，比较残差是否随机围绕 0、方差是否扩大、是否出现弯曲结构，以及单个强影响点如何改变诊断判断。",
    controlsLabel: "残差情景",
    modes: {
      clean: "随机残差",
      fan: "漏斗形",
      curve: "弯曲结构",
      influence: "强影响点",
    },
    maxResidual: "最大 |标准化残差|",
    diagnosticSignal: "诊断信号",
    initialSignal: "结构稳定",
    chartLabel: "拟合值与残差的交互诊断图",
    caption:
      "横轴是 fitted values，纵轴是 residuals。理想残差图不要求“完全均匀”，但不应呈现持续的曲线、漏斗或由单点主导的结构。",
    signals: {
      clean: "结构稳定",
      fan: "方差随拟合值扩大",
      curve: "函数形式可能不足",
      influence: "单点影响过强",
      fallback: "检查残差",
    },
    xAxis: "拟合值",
    yAxis: "残差",
  },
  polynomialRegression: {
    kicker: "互动图表 · 函数形式",
    title: "增加次数，模型究竟是在捕捉结构还是追逐噪声？",
    intro:
      "切换一次、二次和三次模型，观察拟合曲线、训练误差与边界外行为。复杂度增加并不自动意味着更好的可解释性或泛化。",
    controlsLabel: "多项式次数",
    model: "模型",
    trainingRmse: "训练 RMSE",
    interpretation: "解释提醒",
    initialWarning: "优先检查曲率是否有业务含义",
    chartLabel: "多项式回归拟合曲线",
    caption:
      "演示数据固定。图中曲线用于比较函数形式，不代表次数越高越优；正式建模还需结合验证误差、残差结构与业务可解释性。",
    warnings: {
      1: "可能遗漏系统性曲率",
      2: "优先检查曲率是否有业务含义",
      3: "边界外预测更容易失真",
    },
    xAxis: "业务输入",
    yAxis: "结果变量",
  },
  multicollinearity: {
    kicker: "互动计算 · Multicollinearity",
    title: "预测变量越相似，单个系数越难稳定解释",
    intro:
      "拖动两个解释变量之间的相关系数。VIF 根据 1 / (1 − R²) 更新，用来观察“信息重复”如何放大系数方差。",
    predictorCorrelation: "预测变量相关系数：",
    interpretation: "解释",
    initialSignal: "信息重叠较低",
    initialNote: "当前水平通常不会明显放大系数不确定性。",
    lowSignal: "信息重叠较低",
    lowNote: "当前水平通常不会明显放大系数不确定性。",
    mediumSignal: "需要关注",
    mediumNote:
      "系数的标准误可能开始明显扩大，应结合相关矩阵、业务定义和替代规格检查。",
    highSignal: "高度共线",
    highNote: "单个系数可能对样本扰动非常敏感；预测仍可能可用，但解释性需要更谨慎。",
  },
  modelSelection: {
    kicker: "互动比较 · Model selection",
    title: "“最佳模型”取决于优化的是解释、简洁还是样本外误差",
    intro:
      "切换评价标准，比较四个候选回归规格。Adjusted R²、BIC 与 cross-validation MSE 的偏好可能不同，因此变量选择必须先明确目标。",
    controlsLabel: "模型选择标准",
    currentBest: "当前优选",
    modelHeader: "模型",
    predictorsHeader: "预测变量",
    predictorLabels: ["距离", "+ 订单量", "+ 优先级", "+ 4 个额外项"],
    initialReason: "解释度提升仍大于复杂度惩罚。",
    reasons: {
      adjr2: "解释度提升仍大于复杂度惩罚。",
      bic: "在拟合与参数数量之间取得更强的简洁性平衡。",
      cv: "样本外平均平方误差最低。",
    },
  },
  logisticRegression: {
    kicker: "互动图表 · Logistic Regression",
    title: "概率模型与分类阈值是两件不同的事",
    intro:
      "滑动业务风险分数查看预测概率，再调整分类阈值观察同一组概率如何产生不同的 TP、FP、FN 与 TN。",
    riskScore: "风险分数：",
    threshold: "分类阈值：",
    predictedProbability: "预测概率",
    predictedClass: "预测类别",
    odds: "赔率",
    highRisk: "高风险",
    lowRisk: "低风险",
    xAxis: "风险分数",
    chartLabel: "逻辑回归概率曲线",
    caption:
      "曲线输出的是条件概率。阈值只是把概率转成业务行动；改变阈值不会重新估计模型系数。",
  },
} satisfies LearningLabUi;

export const learningLabUi = { en, zh } satisfies Record<Locale, LearningLabUi>;
