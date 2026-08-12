import type { Locale } from "../config/site";

type StringShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly StringShape<U>[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: StringShape<T[K]> }
      : T;

const en = {
  dataset: {
    kicker: "Interactive dataset · Single Source of Truth",
    title: "The whole SQL series uses this same business dataset",
    intro:
      "The later primary-key, foreign-key, relationship, query and join examples all use these records. Switch tables to inspect row grain, key fields and sample size. Amount fields are demo numeric values and do not imply a currency.",
    summaryLabel: "Dataset summary",
    controlsLabel: "Choose a data table",
    grainLabel: "Grain:",
    grains: {
      customers: "One row = one customer · customer_id is the primary key",
      orders: "One row = one order · customer_id references customers",
      products: "One row = one product · product_id is the primary key",
      orderItems:
        "One row = one product line within one order · composite primary key (order_id, product_id)",
      profiles:
        "One row = one optional customer profile · customer_id is both PK and FK",
    },
    relationLabel: "Relationship summary",
  },
  relational: {
    kicker: "Interactive diagram · Data models",
    title: "How can the same business information be organised?",
    intro:
      "All three views use the same customers, orders, products, order_items and customer_profiles. Switch models to see how each structure expresses relationships among the same entities.",
    controlsLabel: "Choose a data model",
    modes: {
      hierarchical: "Hierarchical model",
      network: "Network model",
      relational: "Relational model",
    },
    diagramLabels: {
      hierarchical: "Hierarchical model tree",
      network: "Network model with multiple links",
      relational: "Relational model tables",
    },
    hierarchicalReading:
      "A tree naturally expresses Customers → Orders, but order_items also needs to reference Products. A strict hierarchy cannot naturally make one node connect to another branch, which limits hierarchical models when relationships overlap.",
    networkReading:
      "A network model lets nodes connect through multiple paths and can directly express the intersection of Orders, Products and Order Items; the tradeoff is that applications must understand and traverse the specific link structure.",
    relationOne: "Relationship 1 · a customer owns orders",
    relationTwo: "Relationship 2 · order items connect orders to products",
    relationThree: "Relationship 3 · a customer has one extended profile",
    relationalReading:
      "A relational model divides the same entities into consistent two-dimensional tables and expresses links through PKs, FKs, composite keys and uniqueness rules. The three views clarify each table's role in different links while remaining one schema.",
  },
  primaryKey: {
    kicker: "Interactive diagram · Primary-key design",
    title:
      "If a customer changes email address, which field still represents the same record?",
    intro:
      "Candidate fields and initial records come directly from the shared SQL dataset. Switch candidate keys, then simulate a change to Coast Foods' contact details to see why current uniqueness and long-term stability are different.",
    controlsLabel: "Choose a candidate primary key",
    desktopLabel: "Desktop customer records",
    mobileLabel: "Mobile customer records",
    currentCandidate: "Current candidate",
    messages: {
      customer_id:
        "It is separate from business meaning, stable and unique, making it suitable as a persistent record identifier.",
      email:
        "It is currently unique, but email is a business field. A customer's identity should not change when their email does.",
      phone:
        "A phone number may be changed, recycled or reassigned. It belongs in contact data, not as a stable identity.",
    },
    simulate: "Simulate business-field change",
    changed: "Business fields have changed",
    reset: "Reset",
  },
  foreignKey: {
    kicker: "Interactive diagram · Referential integrity",
    title: "Can an order point to a customer that does not exist?",
    intro:
      "Customer IDs come from the shared SQL dataset. Change the order's customer_id, then switch between a database foreign-key constraint and a logical-only reference to compare invalid references.",
    controlsLabel: "Choose a reference-checking mode",
    constraintMode: "Database FOREIGN KEY",
    logicalMode: "Logical reference only",
    relationLabel: "Current reference rule",
    parentTable: "Parent table · customers",
    childTable: "Child table · candidate order",
    choiceLabel: "Choose order customer_id",
    missing: "does not exist",
    valid: "Valid reference",
    invalid: "Invalid reference",
    validReading:
      "customer_id = {value} has a matching record in customers.customer_id.",
    invalidReading:
      "customer_id = {value} does not exist in customers.customer_id, creating an orphan reference.",
  },
  cardinality: {
    kicker: "Interactive diagram · Relationship Cardinality",
    title:
      "Why do table structure and JOIN row counts differ even when both cases are ‘related’?",
    intro:
      "Switch among one-to-many, many-to-many and one-to-one. Every ID comes from the shared SQL dataset, and the diagram shows both relationship structure and the natural grain after joining.",
    controlsLabel: "Choose a relationship type",
    modes: {
      oneToMany: "One-to-many 1:N",
      manyToMany: "Many-to-many N:M",
      oneToOne: "One-to-one 1:1",
    },
    oneMetric: "Joining only this customer",
    oneReading:
      "A customer can own many orders, while each order references one customer. The foreign key sits on the ‘many’ side: orders.customer_id. Customer {customer} has exactly {count} orders in this dataset; no nonexistent example ID is used.",
    productLines: "product lines",
    crossCheck: "Cross-check product {product}",
    manyReading:
      "An order can contain many products, and a product can appear in many orders. A bridge table splits N:M into two 1:N relationships and gives each row the stable meaning ‘one product's occurrence in one order’.",
    profileMetric: "Current profile match",
    oneToOneReading:
      "Each customer has at most one extended profile. Here customer_profiles.customer_id is both the primary key and the foreign key, so the same customer ID cannot repeat in the profile table.",
  },
  where: {
    kicker: "Interactive diagram · Predicate Logic",
    title: "When the condition changes, which records remain in the same table?",
    intro:
      "This is not a simulated database result: every row in the canonical dataset is marked keep or remove under the current condition. Run the same SQL in the SQLite lab to verify the row count and records.",
    controlsLabel: "Choose a WHERE condition",
    buttons: { gte: "Amount ≥ 500", grouped: "Parentheses precedence" },
    inputRows: "Input rows",
    kept: "Kept",
    removed: "Removed",
    desktopLabel: "Desktop WHERE row-by-row evaluation",
    mobileLabel: "Mobile WHERE row-by-row evaluation",
    readings: {
      gte: "50003 and 50004 remain; the grain is still one row per order, while the row count falls from 4 to 2.",
      and: "AND requires both conditions to be true, so 50001 and 50004 remain.",
      or: "OR accepts either side, so 50001, 50002 and 50003 enter the result.",
      grouped:
        "Parentheses create the candidate set first; applying customer_id = 1003 then leaves only 50004.",
      between:
        "BETWEEN includes both endpoints; the current data keeps the orders worth 420 and 510.",
      in: "IN matches one field against several discrete candidates; North Retail and Alpine Labs remain.",
      like: "The percent sign represents zero or more characters, so only Coast Foods matches this prefix.",
      null: "The canonical customers contain no missing phone values, so 0 rows is a correct and valid result.",
    },
  },
  projection: {
    kicker: "Interactive diagram · Result Shape",
    title: "How does the SELECT list change result shape for the same records?",
    intro:
      "Every mode reads the SQL series' canonical dataset. Switch modes to compare row count, column count, output names and column order. Projection changes only the current result, not the source schema.",
    controlsLabel: "Choose a Projection example",
    buttons: {
      columns: "Choose three columns",
      reorder: "Reorder",
      alias: "Column aliases",
    },
    initialReading:
      "All 3 customer records remain while the result narrows from 5 source columns to 3.",
    readings: {
      all: "SELECT * keeps all 3 customer records and returns all 5 columns.",
      reorder:
        "The record count is unchanged; the SELECT list completely determines output column order.",
      alias:
        "AS renames fields only in the current result; the source schema and field names do not change.",
      where:
        "WHERE reduces 4 rows to 2 first; Projection then shapes 4 source columns into 3 output columns.",
      columns:
        "All 3 customer records remain while the result narrows from 5 source columns to 3.",
    },
  },
  order: {
    kicker: "Interactive diagram · Ordering Contract",
    title: "How do sort keys change the row order of the same orders?",
    intro:
      "Every mode reads the SQL series' canonical orders. The upper section explains the sorted rows; the lower section runs the same kind of ORDER BY query in browser-based SQLite.",
    controlsLabel: "Choose an ORDER BY example",
    buttons: {
      observed: "No declared order",
      asc: "Amount ASC",
      desc: "Amount DESC",
      multi: "Multiple sort keys",
      stable: "Stable tie-breaker",
    },
    initialReading:
      "Current amounts happen to be distinct, so this dataset has a unique order; the query still provides no tie-breaker for possible future ties.",
    runnerKicker: "Browser lab · SQLite",
    runnerTitle: "Execute ORDER BY instead of only observing a front-end reorder",
    presetLabel: "Current sorting lab",
    presetLabels: {
      desc: "Amount DESC",
      asc: "Amount ASC",
      multi: "Customer ASC + date DESC",
      stable: "Add a unique tie-breaker",
      alias: "Sort by expression alias",
    },
    run: "Run SQL",
    loading: "Runtime not loaded.",
    notRun: "No query run yet.",
    outputHint: "SQLite results will appear here after the query runs.",
    rules: {
      observed:
        "This shows only the current seed order. Without ORDER BY, this sequence cannot be a query contract.",
      asc: "Amounts run from low to high. They are currently distinct; if equal amounts appear later, one sort key does not declare their internal order.",
      desc: "Amounts run from high to low. They are currently distinct, so this dataset has a unique order; the query still provides no tie-breaker for possible future ties.",
      multi:
        "Sort customer_id ascending first; customer 1001 ties, so order_date descending puts 50002 before 50001.",
      stable:
        "A unique order_id is added last. Even when the first two keys tie, the final order remains explicitly derivable.",
      where:
        "WHERE first keeps the three orders worth at least 400, then sorts amount descending with order_id as the final tie-breaker.",
    },
    noResults: "SQL completed successfully without returning a result set.",
    running: "Running SQLite…",
    success: "SQL completed.",
    failure: "SQL failed. See the error below.",
  },
  pagination: {
    kicker: "Interactive lab · Page Window Contract",
    title:
      "When the page number changes, how do LIMIT, OFFSET and the result window move together?",
    intro:
      "The shared orders first receive a stable order by order_value DESC, order_id ASC. pageSize and pageIndex then determine the window, and the generated query can run directly in browser-based SQLite.",
    previous: "Previous page",
    next: "Next page",
    windowTitle: "Complete sorted result and current window",
    initialReading:
      "Page 1 uses OFFSET 0 and returns up to 2 rows from the start of the stable order.",
    runnerKicker: "Browser lab · SQLite",
    runnerTitle:
      "Execute the current page query to verify the window calculation against the database",
    run: "Run current SQL",
    beyond: "View an out-of-range page",
    loading: "Runtime not loaded.",
    notRun: "No query run yet.",
    outputHint: "SQLite results will appear here after the query runs.",
    emptyReading:
      "Page {page} has OFFSET {offset}, beyond the current {total} records. SQL returns an empty result instead of inventing missing rows.",
    pageReading:
      "Page {page} uses OFFSET {offset}, starts at position {start} in the stable order and returns at most {size} rows.",
    noResults: "SQL completed successfully without returning a result set.",
    running: "Loading and running SQLite…",
    success:
      "SQLite completed; the result window matches the current pagination parameters.",
    failure: "SQLite execution failed.",
  },
  playground: {
    kicker: "Browser lab · SQLite",
    title: "Edit SQL directly and run it against the same business data",
    intro:
      "Customers, orders, products, order items and customer profiles all come from the SQL series' shared source. The database exists only in browser memory, and reset restores the same initial data. The preset list includes only topics relevant to the current note.",
    presetLabel: "Current topic example",
    run: "Run SQL",
    reset: "Reset database",
    loading: "Runtime not loaded.",
    notRun: "No query run yet.",
    outputHint: "The result table will appear here after a query runs.",
    options: {
      customers: "View customers",
      orders: "View orders",
      products: "View products",
      "order-items": "View order items",
      expression: "Check SELECT 1",
      duplicate: "Test duplicate primary key",
      "foreign-key": "Test invalid foreign key",
      "where-gte": "Amount >= 500",
      "where-and": "AND: both conditions",
      "where-or": "OR: either condition",
      "where-grouped": "Parentheses change precedence",
      "where-between": "BETWEEN closed interval",
      "where-in": "IN discrete values",
      "where-like": "LIKE text pattern",
      "where-null": "IS NULL check",
      "projection-columns": "Choose three columns",
      "projection-reorder": "Reorder columns",
      "projection-alias": "AS column aliases",
      "projection-where": "Projection + WHERE",
      "projection-expression": "Derived expression column",
      join: "Join customers and orders",
      aggregate: "Aggregate orders by customer",
    },
    noResults: "SQL completed successfully without returning a result set.",
    loadingSqlite: "Loading SQLite…",
    ready: "SQLite is ready and the shared example database has been reset.",
    running: "Running SQL…",
    success: "SQL completed.",
    failure: "SQL failed. See the error below.",
    resetMessage: "The database has been restored to the shared initial business data.",
  },
} as const;

type SqlUi = StringShape<typeof en>;

const zh = {
  dataset: {
    kicker: "互动数据集 · Single Source of Truth",
    title: "整个 SQL 系列都沿用这一组业务数据",
    intro:
      "后续主键、外键、关系、查询与连接示例都以这组记录为准。切换表可以同时检查记录粒度、主外键字段和当前样例数量。金额字段只作为演示数值，不额外假设货币单位。",
    summaryLabel: "数据集摘要",
    controlsLabel: "选择数据表",
    grainLabel: "粒度：",
    grains: {
      customers: "One row = one customer · customer_id 是主键",
      orders: "One row = one order · customer_id 引用 customers",
      products: "One row = one product · product_id 是主键",
      orderItems:
        "One row = one product line within one order · 联合主键 (order_id, product_id)",
      profiles: "One row = one optional customer profile · customer_id 同时是 PK 与 FK",
    },
    relationLabel: "关系摘要",
  },
  relational: {
    kicker: "互动图解 · 数据模型",
    title: "同一批业务信息，可以怎样组织？",
    intro:
      "三种视图始终使用同一组 customers、orders、products、order_items 与 customer_profiles。切换模型，观察同一批实体的关系在不同结构中怎样被表达。",
    controlsLabel: "选择数据模型",
    modes: { hierarchical: "层次模型", network: "网状模型", relational: "关系模型" },
    diagramLabels: {
      hierarchical: "层次模型树状示意",
      network: "网状模型多连接示意",
      relational: "关系模型多表示意",
    },
    hierarchicalReading:
      "树形层级很容易表达 Customers → Orders，但 order_items 同时还需要关联 Products。严格树结构难以自然表达“一个节点同时连接另一条分支”，这正是层次模型面对多重关系时的限制。",
    networkReading:
      "网状模型允许节点沿多条路径连接，因此能更直接表达 Orders、Products 与 Order Items 的交叉关系；代价是应用需要理解并沿具体连接结构访问数据。",
    relationOne: "关系 1 · 客户拥有订单",
    relationTwo: "关系 2 · 订单通过明细连接产品",
    relationThree: "关系 3 · 客户拥有一条扩展资料",
    relationalReading:
      "关系模型把同一批实体拆成结构一致的二维表，再通过 PK、FK、联合主键与唯一性规则表达连接。这里分成三段关系视图，是为了让同一个表在不同关联中的角色都清楚可见；它们仍属于同一套 schema。",
  },
  primaryKey: {
    kicker: "互动图表 · 主键设计",
    title: "如果客户换了邮箱，哪一个字段还能稳定代表同一条记录？",
    intro:
      "候选字段和初始记录直接来自 SQL 系列统一数据集。切换候选主键，再模拟 Coast Foods 的业务联系方式变化，观察“当前唯一”和“长期稳定”为什么不是同一件事。",
    controlsLabel: "选择候选主键",
    desktopLabel: "桌面客户记录表",
    mobileLabel: "移动端客户记录",
    currentCandidate: "当前候选",
    messages: {
      customer_id: "与业务含义分离，值稳定且唯一，适合作为记录的持久标识。",
      email:
        "当前可以唯一，但邮箱属于业务字段。客户更换邮箱时，记录身份不应该跟着改变。",
      phone:
        "手机号可能被更换、回收或重新分配。它适合保存业务联系信息，不适合作为稳定身份。",
    },
    simulate: "模拟业务字段变化",
    changed: "业务字段已经变化",
    reset: "重置",
  },
  foreignKey: {
    kicker: "互动图表 · 引用完整性",
    title: "一个订单能否指向不存在的客户？",
    intro:
      "客户 ID 来自统一 SQL 数据集。切换订单中的 customer_id，再切换“数据库外键约束”与“只有逻辑引用”，观察无效引用在两个设计中的差别。",
    controlsLabel: "选择引用检查模式",
    constraintMode: "数据库 FOREIGN KEY",
    logicalMode: "仅逻辑外键",
    relationLabel: "当前引用规则",
    parentTable: "父表 · customers",
    childTable: "子表 · 候选新订单",
    choiceLabel: "选择订单 customer_id",
    missing: "不存在",
    valid: "引用有效",
    invalid: "引用无效",
    validReading: "customer_id = {value} 能在 customers.customer_id 中找到对应记录。",
    invalidReading:
      "customer_id = {value} 在 customers.customer_id 中不存在，因此形成孤立引用。",
  },
  cardinality: {
    kicker: "互动图表 · Relationship Cardinality",
    title: "同样是“有关联”，为什么表结构和 JOIN 行数会不同？",
    intro:
      "在一对多、多对多和一对一之间切换。所有 ID 都来自统一 SQL 数据集，并同时显示关系结构与连接后的自然粒度。",
    controlsLabel: "选择关系类型",
    modes: {
      oneToMany: "一对多 1:N",
      manyToMany: "多对多 N:M",
      oneToOne: "一对一 1:1",
    },
    oneMetric: "如果只连接这个客户",
    oneReading:
      "一个客户可以拥有多张订单，而每张订单只引用一个客户。外键放在“多”的一方：orders.customer_id。客户 {customer} 在当前数据集中确实只有 {count} 张订单，不再使用不存在的示例 ID。",
    productLines: "条产品明细",
    crossCheck: "交叉检查 product {product}",
    manyReading:
      "一张订单可以包含多个产品，一个产品也可以出现在多张订单中。中间表把 N:M 拆成两个 1:N，并让一行稳定表示“某产品在某订单中的一次关系”。",
    profileMetric: "当前 profile 匹配",
    oneToOneReading:
      "每个客户最多对应一条扩展资料。这里直接让 customer_profiles.customer_id 同时承担主键和外键，因此同一客户 ID 在 profile 表中不能重复。",
  },
  where: {
    kicker: "互动图表 · Predicate Logic",
    title: "同一张表，条件一变，哪些记录会留下？",
    intro:
      "下面不是模拟数据库结果，而是把 canonical dataset 的每一行按当前条件标记为 keep / remove。随后可在 SQLite 实验中运行同一条 SQL，核对行数与具体记录。",
    controlsLabel: "选择 WHERE 条件",
    buttons: { gte: "金额 ≥ 500", grouped: "括号优先级" },
    inputRows: "输入行",
    kept: "保留",
    removed: "移除",
    desktopLabel: "桌面 WHERE 逐行判断表",
    mobileLabel: "移动端 WHERE 逐行判断",
    readings: {
      gte: "50003 与 50004 被保留；结果仍是一行一张订单，只是行数从 4 缩小到 2。",
      and: "AND 要求两个条件同时为真，因此保留 50001 与 50004。",
      or: "OR 允许任意一侧成立，因此 50001、50002 与 50003 都进入结果集。",
      grouped: "括号先形成候选集合，再应用 customer_id = 1003，最终只保留 50004。",
      between: "BETWEEN 包含上下边界；当前数据保留 420 与 510 两张订单。",
      in: "IN 用一个字段匹配多个离散候选值，当前保留 North Retail 与 Alpine Labs。",
      like: "百分号表示零个或多个字符，因此当前只有 Coast Foods 符合此前缀模式。",
      null: "当前 canonical customers 没有缺失 phone，因此 0 rows 是正确而有效的结果。",
    },
  },
  projection: {
    kicker: "互动图表 · Result Shape",
    title: "同一批记录，SELECT 列表怎样改变结果结构？",
    intro:
      "所有模式都读取 SQL 系列的 canonical dataset。切换后同时观察行数、列数、输出字段名与列顺序；Projection 只改变当前结果集，不修改原表 schema。",
    controlsLabel: "选择 Projection 示例",
    buttons: { columns: "选择三列", reorder: "重排列", alias: "列别名" },
    initialReading: "3 条 customer 记录全部保留，结果从原表 5 列缩小为 3 列。",
    readings: {
      all: "SELECT * 保留 3 条 customer 记录并返回全部 5 列。",
      reorder: "记录数不变，结果列顺序完全由 SELECT 列表决定。",
      alias: "AS 只重命名当前结果集字段；原表 schema 与字段名没有改变。",
      where: "WHERE 先把 4 行缩小为 2 行，Projection 再把 4 列塑造成 3 列。",
      columns: "3 条 customer 记录全部保留，结果从原表 5 列缩小为 3 列。",
    },
  },
  order: {
    kicker: "互动图表 · Ordering Contract",
    title: "同一批订单，排序键怎样改变结果行顺序？",
    intro:
      "所有模式都读取 SQL 系列的 canonical orders。上半部分逐行解释排序结果；下半部分由浏览器内 SQLite 实际执行同一类 ORDER BY 查询。",
    controlsLabel: "选择 ORDER BY 示例",
    buttons: {
      observed: "未声明顺序",
      asc: "金额 ASC",
      desc: "金额 DESC",
      multi: "多列排序",
      stable: "稳定 tie-breaker",
    },
    initialReading:
      "当前金额值恰好都不同，因此本批数据可以得到唯一顺序；查询本身仍没有为未来可能出现的金额并列值提供 tie-breaker。",
    runnerKicker: "浏览器实验 · SQLite",
    runnerTitle: "实际执行 ORDER BY，而不是只观察前端重排",
    presetLabel: "当前排序实验",
    presetLabels: {
      desc: "金额 DESC",
      asc: "金额 ASC",
      multi: "客户 ASC + 日期 DESC",
      stable: "加入唯一 tie-breaker",
      alias: "按表达式别名排序",
    },
    run: "运行 SQL",
    loading: "运行环境尚未加载。",
    notRun: "尚未运行查询。",
    outputHint: "运行查询后，SQLite 结果会显示在这里。",
    rules: {
      observed:
        "这里仅展示当前 seed 的观察顺序。没有 ORDER BY 时，这个排列不能成为查询契约。",
      asc: "金额从小到大。当前金额恰好都不同；如果未来出现相同金额，单一排序键没有声明并列记录内部顺序。",
      desc: "金额从大到小。当前金额值恰好都不同，因此本批数据可以得到唯一顺序；查询本身仍没有为未来可能出现的金额并列值提供 tie-breaker。",
      multi:
        "先按 customer_id 升序；客户 1001 出现并列后，再按 order_date 降序，因此 50002 排在 50001 前。",
      stable:
        "最后加入唯一 order_id。即使前两个排序键都相同，查询仍然具备可以明确推导的最终顺序。",
      where:
        "WHERE 先保留金额至少 400 的三张订单，再按金额降序；order_id 作为最终 tie-breaker。",
    },
    noResults: "SQL 执行成功，没有返回结果集。",
    running: "正在执行 SQLite…",
    success: "SQL 执行完成。",
    failure: "SQL 执行失败。查看下方错误信息。",
  },
  pagination: {
    kicker: "互动实验 · Page Window Contract",
    title: "页码改变时，LIMIT、OFFSET 与结果窗口怎样一起变化？",
    intro:
      "统一 orders 先按 order_value DESC, order_id ASC 建立稳定顺序，再由 pageSize 与 pageIndex 计算窗口。下半部分可直接在浏览器 SQLite 中执行生成的查询。",
    previous: "上一页",
    next: "下一页",
    windowTitle: "完整排序结果与当前窗口",
    initialReading: "Page 1 使用 OFFSET 0，从稳定排序结果开头最多返回 2 行。",
    runnerKicker: "浏览器实验 · SQLite",
    runnerTitle: "执行当前页面查询，核对窗口计算与数据库结果",
    run: "运行当前 SQL",
    beyond: "查看越界页",
    loading: "运行环境尚未加载。",
    notRun: "尚未运行查询。",
    outputHint: "运行后，SQLite 返回结果会显示在这里。",
    emptyReading:
      "Page {page} 的 OFFSET {offset} 已越过当前 {total} 条记录，SQL 会返回空结果集，而不是补齐不存在的记录。",
    pageReading:
      "Page {page} 使用 OFFSET {offset}，从稳定排序结果的 position {start} 开始，最多返回 {size} 行。",
    noResults: "SQL 执行成功，但没有返回结果集。",
    running: "正在加载并执行 SQLite…",
    success: "SQLite 执行完成，结果窗口与当前分页参数一致。",
    failure: "SQLite 执行失败。",
  },
  playground: {
    kicker: "浏览器实验 · SQLite",
    title: "直接修改 SQL，再运行同一组业务数据",
    intro:
      "客户、订单、产品、订单明细和客户扩展资料都来自 SQL 系列的统一数据源。数据库只存在于当前浏览器内存中，重置后会恢复为同一份初始数据。下拉示例只保留当前笔记真正需要的主题。",
    presetLabel: "当前主题示例",
    run: "运行 SQL",
    reset: "重置数据库",
    loading: "运行环境尚未加载。",
    notRun: "尚未运行查询。",
    outputHint: "运行查询后，结果表会显示在这里。",
    options: {
      customers: "查看客户表",
      orders: "查看订单表",
      products: "查看产品表",
      "order-items": "查看订单明细",
      expression: "SELECT 1 执行检查",
      duplicate: "测试重复主键",
      "foreign-key": "测试无效外键",
      "where-gte": "金额 >= 500",
      "where-and": "AND：同时满足",
      "where-or": "OR：任意满足",
      "where-grouped": "括号改变优先级",
      "where-between": "BETWEEN 闭区间",
      "where-in": "IN 多个离散值",
      "where-like": "LIKE 文本模式",
      "where-null": "IS NULL 缺失检查",
      "projection-columns": "选择三列",
      "projection-reorder": "重排列顺序",
      "projection-alias": "AS 列别名",
      "projection-where": "Projection + WHERE",
      "projection-expression": "表达式派生列",
      join: "连接客户与订单",
      aggregate: "按客户汇总订单",
    },
    noResults: "SQL 执行成功，没有返回结果集。",
    loadingSqlite: "正在加载 SQLite…",
    ready: "SQLite 已就绪，统一示例数据库已重置。",
    running: "正在执行 SQL…",
    success: "SQL 执行完成。",
    failure: "SQL 执行失败。查看下方错误信息。",
    resetMessage: "数据库已恢复到统一的初始业务数据。",
  },
} satisfies SqlUi;

export const sqlUi = { en, zh } satisfies Record<Locale, SqlUi>;
