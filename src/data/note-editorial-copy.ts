export interface EditorialNoteCopy {
  title: string;
  summary: string;
}

const zhEditorialCopy: Record<string, EditorialNoteCopy> = {
  "descriptive-statistics": {
    title: "统计学与 R",
    summary: "先把数据看清楚，再谈统计方法。这篇把描述统计、概率、估计、检验、相关、回归和聚类放进一条连续的学习路线里。",
  },
  "sql-relational-data": {
    title: "SQL 与关系数据",
    summary: "SQL 不只是写查询。先弄清表、行、列、粒度、NULL 和 Schema，后面的主键、外键和 JOIN 才不会越学越乱。",
  },
  "sql-primary-key": {
    title: "主键",
    summary: "一张表需要一个可靠的记录身份。这篇比较自然键、自增 ID、UUID 和联合主键，重点看什么样的字段真正适合做主键。",
  },
  "sql-foreign-key": {
    title: "外键",
    summary: "订单里的 customer_id 应该指向一个真实客户。外键做的就是这件事：把表之间的引用关系写清楚，并阻止无效关联。",
  },
  "sql-relationships": {
    title: "表关系",
    summary: "一个客户能有多少张订单？一张订单能放多少种产品？从这些业务问题出发，一对多、多对多和一对一会比背定义容易得多。",
  },
  "sql-select": {
    title: "SELECT 查询",
    summary: "先从最基本的读取开始：SELECT 决定拿哪些内容，FROM 决定从哪里拿。把结果集看明白，再继续加筛选和排序。",
  },
  "sql-where": {
    title: "WHERE 筛选",
    summary: "查询通常不是把整张表搬出来，而是留下真正需要的记录。这篇集中处理比较、逻辑、区间、文本和 NULL 条件。",
  },
  "sql-projection": {
    title: "列选择与表达式",
    summary: "结果里不需要的列就不要带着。这里用列选择、别名和计算表达式，把查询结果整理成更适合分析和展示的形状。",
  },
  "sql-order-by": {
    title: "ORDER BY 排序",
    summary: "没有明确排序，数据库并不保证每次都按同样顺序返回结果。这里把单列、多列和稳定排序一次讲清楚。",
  },
  "sql-pagination": {
    title: "分页查询",
    summary: "数据多了以后，通常要分批读取。这里比较 LIMIT/OFFSET 和 cursor 思路，也解释为什么分页一定要建立在稳定排序上。",
  },
  "optimisation-model-anatomy": {
    title: "优化建模",
    summary: "优化模型先别急着求解。把目标、参数、决策变量和约束分清楚，很多建模错误在写代码之前就能发现。",
  },
  "unconstrained-optimisation": {
    title: "无约束优化",
    summary: "没有额外限制时，最优点从哪里来？这篇从函数形状和边际变化出发，同时看看最优点附近的方案到底差多少。",
  },
  "constrained-optimisation": {
    title: "受约束优化",
    summary: "现实决策总会遇到资源上限。把可行域、角点、紧约束和松弛量放在一起看，就能读懂限制条件怎样改变最优解。",
  },
  "optimisation-sensitivity-analysis": {
    title: "敏感性分析",
    summary: "模型算出一个最优解还不够。资源、成本或需求稍微变化以后，答案还稳不稳，往往比那个单独的最优数字更重要。",
  },
  "binary-milp-decisions": {
    title: "二进制决策与 MILP",
    summary: "有些决定不是多做一点或少做一点，而是开不开、选不选。二进制变量就是把这类离散选择直接放进优化模型。",
  },
  "sets-indices-model-scale": {
    title: "集合与索引",
    summary: "模型从几个变量扩到几十个产品、工厂和时期以后，真正难的是组织结构。集合和索引负责把重复规则写得清楚又可扩展。",
  },
  "pulp-model-architecture": {
    title: "PuLP 建模",
    summary: "数学模型写对只是第一步。这里把变量、目标、约束、求解和结果检查整理成一套更容易维护的 PuLP 代码结构。",
  },
  "multidimensional-optimisation": {
    title: "多维优化",
    summary: "产品、工厂、资源和时期同时出现时，模型会迅速变大。这篇重点是把维度组织好，并让每个参数和变量都能对得上。",
  },
  "transportation-models": {
    title: "供应链规划与运输",
    summary: "网络怎么布、货怎么分、容量够不够，是三个不同层次的问题。这里用同一套供应链数据把它们连起来看。",
  },
  "multi-period-production-inventory": {
    title: "多期生产与库存",
    summary: "今天多生产一点，能不能替未来省成本？把生产、需求和库存放进同一条时间线，就能看清 setup cost 和 holding cost 的取舍。",
  },
  "regression-foundations": {
    title: "简单线性回归",
    summary: "先从一条回归线开始。斜率、R²、置信区间和预测区间分别回答什么问题，这篇会放在同一张图里讲清楚。",
  },
  "regression-diagnostics": {
    title: "回归诊断",
    summary: "模型跑完不代表模型可靠。残差图、QQ 图和 Scale–Location 图能帮助判断曲率、异方差、尾部问题和异常结构。",
  },
  "nonlinear-regression-interactions": {
    title: "非线性回归与交互",
    summary: "数据关系不一定是一条直线。这里从残差里的弯曲出发，再看多项式、类别变量和交互项什么时候真的有必要。",
  },
  "multiple-regression-multicollinearity": {
    title: "多元线性回归",
    summary: "多个解释变量一起进入模型以后，系数的含义会发生变化。这里重点看条件解释、整体检验、共线性和系数稳定性。",
  },
  "influential-observations": {
    title: "异常点与影响点",
    summary: "残差大、杠杆高和真正会改变模型结果不是一回事。这里把三种情况分开，并用 Cook’s distance 看哪些点值得进一步检查。",
  },
  "regression-feature-selection": {
    title: "特征选择与正则化",
    summary: "变量越多不一定越好。这里比较调整 R²、BIC、交叉验证、Ridge 和 Lasso，看看怎样在解释力和复杂度之间做取舍。",
  },
  "logistic-regression": {
    title: "逻辑回归",
    summary: "当结果只有两类时，线性回归就不再合适。这里从概率、odds 和 odds ratio 开始，再走到分类阈值和误判成本。",
  },
};

export function getEditorialNoteCopy({
  slug,
  locale,
  title,
  summary,
}: {
  slug: string;
  locale: string;
  title: string;
  summary: string;
}): EditorialNoteCopy {
  if (locale !== "zh") return { title, summary };
  return zhEditorialCopy[slug] ?? { title, summary };
}

export const editorialChineseNoteSlugs = Object.keys(zhEditorialCopy);
