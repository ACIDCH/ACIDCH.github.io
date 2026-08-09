import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "dist");
const localOrigin = "https://local.invalid";
const failures = [];
const forbiddenPublicName = ["Xintao", "Liu"].join(" ");
const forbiddenPublicTerms = [
  /(?<![A-Za-z])AI(?![A-Za-z])/,
  /Artificial Intelligence/i,
  /Generative AI/i,
  /ChatGPT/i,
  /OpenAI/i,
  /(?<![A-Za-z])LLMs?(?![A-Za-z])/,
  /人工智能/,
  /生成式人工智能/,
  /大语言模型|大模型/,
  /机器生成/,
  /AI[\s-]*(?:生成|辅助|assisted)/i,
  /machine-generated/i,
];
const forbiddenFirstPersonTerms = [
  /\b(?:I|Me|me|My|my|Mine|mine|We|we|Our|our|Ours|ours)\b/,
  /我|我们|本人|作者|笔者/,
];
const publicTextExtensions = new Set([
  ".html",
  ".json",
  ".js",
  ".svg",
  ".txt",
  ".xml",
  ".webmanifest",
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(target) : [target];
    }),
  );
  return files.flat();
}

function routeForFile(file) {
  const relative = path.relative(outputRoot, file).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return `/${relative.slice(0, -"index.html".length)}`;
  }
  return `/${relative}`;
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function resolvesToBuildFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, "");
  const direct = path.join(outputRoot, relative);
  const candidates = decoded.endsWith("/")
    ? [path.join(direct, "index.html")]
    : path.extname(decoded)
      ? [direct]
      : [direct, path.join(direct, "index.html")];

  return (await Promise.all(candidates.map(exists))).some(Boolean);
}

const outputFiles = await collectFiles(outputRoot);
const htmlFiles = outputFiles.filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const route = routeForFile(file);
  if (/\/page\/1\/$/.test(route)) {
    failures.push(`${route}: duplicate page-one pagination route`);
  }
  if (html.includes(forbiddenPublicName)) {
    failures.push(`${route}: contains a forbidden public identity`);
  }
  if (forbiddenPublicTerms.some((pattern) => pattern.test(html))) {
    failures.push(`${route}: contains restricted public terminology`);
  }
  const isStaticRedirect = /<meta\b[^>]*http-equiv=["']refresh["']/i.test(html);
  if (isStaticRedirect) continue;
  if (forbiddenFirstPersonTerms.some((pattern) => pattern.test(html))) {
    failures.push(`${route}: contains first-person public wording`);
  }
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) {
    failures.push(`${route}: missing document language`);
  }
  if (h1Count !== 1) {
    failures.push(`${route}: expected one h1, found ${h1Count}`);
  }
  if (!/<link\b[^>]*\brel=["']canonical["']/i.test(html)) {
    failures.push(`${route}: missing canonical link`);
  }
  for (const imageTag of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (!/\balt=["'][^"']*["']/i.test(imageTag)) {
      failures.push(`${route}: image missing alt attribute`);
    }
  }
  const references = [...html.matchAll(/\b(?:href|src)=["']([^"'<>]*)["']/gi)].map(
    (match) => match[1] ?? "",
  );

  for (const reference of references) {
    if (!reference) {
      failures.push(`${route}: empty href/src`);
      continue;
    }
    if (/^(?:data:|mailto:|tel:|javascript:|#)/i.test(reference)) continue;

    const resolved = new URL(reference, `${localOrigin}${route}`);
    if (resolved.origin !== localOrigin) continue;
    if (!(await resolvesToBuildFile(resolved.pathname))) {
      failures.push(`${route}: missing ${resolved.pathname}`);
    }
  }

  if (route === "/zh/projects/retirement-monte-carlo/") {
    const pageContent = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html;
    if (
      /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html)
    ) {
      failures.push(`${route}: production page must be indexable`);
    }
    if (!html.includes('href="/projects/"')) {
      failures.push(`${route}: missing English Projects fallback`);
    }
    if (/(?:[A-Z]:\\|Businfo\\|\.xlsx\b|\.docx\b|Daniel|Group 14)/i.test(html)) {
      failures.push(`${route}: contains a private source reference`);
    }
    if (
      /Task [1-4]|Client data|课程项目|课程报告|课程材料|30 秒速览|6\.1625%|10\.5%|局限与下一步|来源与口径|中文样板页|暂不索引|浏览器本地计算|不会上传课程数据/.test(
        pageContent,
      )
    ) {
      failures.push(`${route}: contains retired pilot or internal wording`);
    }
  }

  if (route === "/zh/projects/european-property-market-dashboard/") {
    const pageContent = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html;
    if (
      /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html)
    ) {
      failures.push(`${route}: production page must be indexable`);
    }
    if (!html.includes('href="/projects/"')) {
      failures.push(`${route}: missing English Projects fallback`);
    }
    if (
      !pageContent.includes("data-dashboard-gallery") ||
      !pageContent.includes("Dim_Country") ||
      !pageContent.includes("DAX")
    ) {
      failures.push(`${route}: missing dashboard, model, or DAX content`);
    }
    if (
      /BUSINFO703|703AA|Group23|Submission|Assignment|课程项目|小组项目|组员|Task|\.pbix\b|\.csv\b|\.pdf\b|[A-Z]:\\/i.test(
        pageContent,
      )
    ) {
      failures.push(`${route}: contains a private or internal source reference`);
    }
    if (/<iframe\b|app\.powerbi\.com|ctid=/i.test(pageContent)) {
      failures.push(`${route}: contains a non-public embed`);
    }
  }

  if (route === "/zh/projects/grammy-spotify-analysis/") {
    const pageContent = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html;
    if (
      /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html)
    ) {
      failures.push(`${route}: production page must be indexable`);
    }
    if (!html.includes('href="/projects/"')) {
      failures.push(`${route}: missing English Projects fallback`);
    }
    if (
      !pageContent.includes("data-threshold-lab") ||
      (pageContent.match(/<details\b[^>]*\bclass=["'][^"']*code-showcase/g) ?? [])
        .length < 6 ||
      (pageContent.match(/projects\/grammy-spotify\/[^"']+\.webp/g) ?? []).length < 5
    ) {
      failures.push(`${route}: missing code, chart, or threshold content`);
    }
    if (
      /BUSINFO701|701new|Assignment|Submission|Task|课程项目|作业|样板页|试点页|预览版|草稿|\.ipynb\b|\.pdf\b|\.csv\b|\.json\b|[A-Z]:\\/i.test(
        pageContent,
      )
    ) {
      failures.push(`${route}: contains a private or internal source reference`);
    }
  }

  if (route === "/zh/projects/sales-profitability-warehouse/") {
    const pageContent = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html;
    if (
      /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html)
    ) {
      failures.push(`${route}: production page must be indexable`);
    }
    if (!html.includes('href="/projects/"')) {
      failures.push(`${route}: missing English Projects fallback`);
    }
    if (
      !pageContent.includes("schema-diagram") ||
      (pageContent.match(/<details\b[^>]*\bclass=["'][^"']*sql-showcase/g) ?? [])
        .length < 4 ||
      (pageContent.match(/\brole=["']tab["']/g) ?? []).length < 4 ||
      (pageContent.match(/\brole=["']tabpanel["']/g) ?? []).length < 4
    ) {
      failures.push(`${route}: missing schema, SQL, or result viewer content`);
    }
    if (
      /BUSINFO702|\b(?:Assignment|Task|Submission|Lab|Solution)\b|课程项目|样板页|试点页|\.(?:sql|pdf)(?:["'<\s]|$)|[A-Z]:\\/i.test(
        pageContent,
      )
    ) {
      failures.push(`${route}: contains a private or internal source reference`);
    }
    if (
      /(?:Server|Data Source|User ID|Password|Pwd)\s*=|database\.windows\.net/i.test(
        pageContent,
      )
    ) {
      failures.push(`${route}: contains a database connection detail`);
    }
  }

  if (
    route === "/zh/projects/customer-churn-machine-learning/" ||
    route.startsWith("/zh/projects/customer-churn-machine-learning/")
  ) {
    const pageContent = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html;
    if (
      /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html)
    ) {
      failures.push(`${route}: R project page must be indexable`);
    }
    if (!html.includes('href="/projects/"')) {
      failures.push(`${route}: missing English Projects fallback`);
    }
    if (
      /BUSINFO704|\b(?:Assignment|Task|Submission)\b|课程项目|课程报告|源文件|留在本地|身份属性|暂不索引|样板页|试点页|稍后补充|功能开发中|固定结果|保存的固定结果|不会触发训练|浏览器本地计算|内部核实|匿名访问|课程文件|正式版 V3|[A-Z]:\\/i.test(
        pageContent,
      )
    ) {
      failures.push(`${route}: contains a private or internal source reference`);
    }
    if (/在线训练 R|实时机器学习|实时模型训练|浏览器运行 R/i.test(pageContent)) {
      failures.push(`${route}: contains a false runtime claim`);
    }

    if (route === "/zh/projects/customer-churn-machine-learning/") {
      if (
        !pageContent.includes("data-model-lab") ||
        !pageContent.includes("data-analysis-pipeline") ||
        !pageContent.includes("data-feature-selection-story") ||
        !pageContent.includes("data-matrix-cell") ||
        !pageContent.includes("roc-figure") ||
        !pageContent.includes("native-roc") ||
        !pageContent.includes("data-risk-explorer") ||
        !pageContent.includes("data-native-or") ||
        (pageContent.match(/class=["'][^"']*evidence-figure/g) ?? []).length < 4 ||
        (pageContent.match(/<details\b[^>]*\bclass=["'][^"']*r-code/g) ?? []).length <
          5 ||
        !pageContent.includes("0.9053") ||
        !pageContent.includes("39,200")
      ) {
        failures.push(`${route}: missing pipeline, R code, comparison, or results`);
      }
    }

    if (
      route === "/zh/projects/customer-churn-machine-learning/neural-network/" &&
      (!pageContent.includes("network-figure") ||
        !pageContent.includes("hidden_units = 2") ||
        !pageContent.includes("epochs = 1000"))
    ) {
      failures.push(`${route}: missing verified neural network structure`);
    }
  }
}

if (
  await exists(
    path.join(outputRoot, "projects", "retirement-monte-carlo", "index.html"),
  )
) {
  failures.push("/projects/retirement-monte-carlo/: unexpected English detail page");
}

if (
  await exists(
    path.join(
      outputRoot,
      "projects",
      "european-property-market-dashboard",
      "index.html",
    ),
  )
) {
  failures.push(
    "/projects/european-property-market-dashboard/: unexpected English detail page",
  );
}

if (
  await exists(
    path.join(outputRoot, "projects", "sales-profitability-warehouse", "index.html"),
  )
) {
  failures.push(
    "/projects/sales-profitability-warehouse/: unexpected English detail page",
  );
}

if (
  await exists(
    path.join(outputRoot, "projects", "grammy-spotify-analysis", "index.html"),
  )
) {
  failures.push("/projects/grammy-spotify-analysis/: unexpected English detail page");
}

if (
  await exists(
    path.join(outputRoot, "projects", "customer-churn-machine-learning", "index.html"),
  )
) {
  failures.push(
    "/projects/customer-churn-machine-learning/: unexpected English detail page",
  );
}

for (const deepDive of [
  "data-validation",
  "model-comparison",
  "model-selection-error-analysis",
  "logistic-interpretation",
  "neural-network",
]) {
  if (
    !(await exists(
      path.join(
        outputRoot,
        "zh",
        "projects",
        "customer-churn-machine-learning",
        deepDive,
        "index.html",
      ),
    ))
  ) {
    failures.push(`R project: missing ${deepDive} deep dive`);
  }
}

for (const file of outputFiles) {
  if (file.endsWith(".html") || !publicTextExtensions.has(path.extname(file))) continue;
  const content = await readFile(file, "utf8");
  const relative = path.relative(outputRoot, file).replaceAll(path.sep, "/");
  if (content.includes(forbiddenPublicName)) {
    failures.push(`${relative}: contains a forbidden public identity`);
  }
  if (forbiddenPublicTerms.some((pattern) => pattern.test(content))) {
    failures.push(`${relative}: contains restricted public terminology`);
  }
}

if (failures.length) {
  console.error(`Built-site validation failed (${failures.length} issue(s)).`);
  failures.slice(0, 20).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Built-site validation passed (${htmlFiles.length} HTML files checked).`);
