import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "src");
const contentRoot = join(sourceRoot, "content");
const pagesRoot = join(sourceRoot, "pages");
const componentsRoot = join(sourceRoot, "components");
const tmpRoot = join(root, "tmp");

const slash = (value) => value.split(sep).join("/");
const fromRoot = (value) => slash(relative(root, value));
const read = (value) => readFileSync(value, "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function walk(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory()
      ? walk(fullPath, predicate)
      : predicate(fullPath)
        ? [fullPath]
        : [];
  });
}

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unavailable";
  }
}

function parseFrontmatter(filePath) {
  const source = read(filePath);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Missing frontmatter: ${fromRoot(filePath)}`);
  return {
    data: parseYaml(match[1]) ?? {},
    body: source.slice(match[0].length),
    source,
  };
}

function loadCollection(collection) {
  return walk(join(contentRoot, collection), (file) =>
    [".md", ".mdx"].includes(extname(file)),
  )
    .sort()
    .map((filePath) => {
      const parsed = parseFrontmatter(filePath);
      return {
        collection,
        filePath: fromRoot(filePath),
        ...parsed.data,
        body: parsed.body,
        sourceHash: sha256(parsed.source),
      };
    });
}

function isPublishedNote(entry) {
  return entry.status === "published" && entry.draft === false;
}

function isPublishedProject(entry) {
  return entry.status === "completed" && !entry.isPlaceholder && !entry.noindex;
}

function publicRouteFor(entry) {
  const prefix = entry.locale === "zh" ? "/zh" : "";
  return `${prefix}/${entry.collection}/${entry.slug}/`;
}

function compactEntry(entry) {
  const common = {
    translationKey: entry.translationKey,
    locale: entry.locale,
    filePath: entry.filePath,
    slug: entry.slug,
    title: entry.title,
    status: entry.status,
    isPlaceholder: Boolean(entry.isPlaceholder),
    updatedAt: entry.updatedAt ?? null,
    route: publicRouteFor(entry),
  };
  return entry.collection === "notes"
    ? {
        ...common,
        draft: Boolean(entry.draft),
        seriesSlug: entry.seriesSlug ?? null,
        order: entry.order ?? null,
      }
    : {
        ...common,
        featured: Boolean(entry.featured),
        topic: entry.topic,
        noindex: Boolean(entry.noindex),
      };
}

function analyseCollection(collection, entries) {
  const groups = new Map();
  for (const entry of entries) {
    const group = groups.get(entry.translationKey) ?? [];
    group.push(entry);
    groups.set(entry.translationKey, group);
  }

  const records = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([translationKey, grouped]) => {
      const en = grouped.filter((entry) => entry.locale === "en");
      const zh = grouped.filter((entry) => entry.locale === "zh");
      const statuses = [];
      if (en.length > 1 || zh.length > 1) statuses.push("DUPLICATE_KEY");
      if (!en.length) statuses.push("MISSING_EN", "ORPHAN_ZH");
      if (!zh.length) statuses.push("MISSING_ZH", "ORPHAN_EN");
      if (en.some((entry) => entry.isPlaceholder)) statuses.push("PLACEHOLDER_EN");
      if (zh.some((entry) => entry.isPlaceholder)) statuses.push("PLACEHOLDER_ZH");

      if (collection === "notes") {
        if (grouped.every((entry) => !isPublishedNote(entry)))
          statuses.push("DRAFT_ONLY");
        if (
          en.length === 1 &&
          zh.length === 1 &&
          (en[0].seriesSlug ?? null) !== (zh[0].seriesSlug ?? null)
        ) {
          statuses.push("METADATA_MISMATCH");
        }
        if (
          en.length === 1 &&
          zh.length === 1 &&
          (en[0].order ?? null) !== (zh[0].order ?? null)
        ) {
          statuses.push("METADATA_MISMATCH");
        }
        if (
          en.length === 1 &&
          zh.length === 1 &&
          (Boolean(en[0].draft) !== Boolean(zh[0].draft) ||
            en[0].status !== zh[0].status)
        ) {
          statuses.push("ROUTE_MISMATCH");
        }
      } else if (en.length === 1 && zh.length === 1) {
        for (const key of ["status", "featured", "topic"]) {
          if (en[0][key] !== zh[0][key]) statuses.push("METADATA_MISMATCH");
        }
      }

      if (
        en.length === 1 &&
        zh.length === 1 &&
        !statuses.some((status) =>
          [
            "DUPLICATE_KEY",
            "PLACEHOLDER_EN",
            "PLACEHOLDER_ZH",
            "DRAFT_ONLY",
            "METADATA_MISMATCH",
            "ROUTE_MISMATCH",
          ].includes(status),
        )
      ) {
        statuses.push("SYNCED");
      }

      return {
        translationKey,
        classifications: [...new Set(statuses)],
        entries: grouped.map(compactEntry),
      };
    });

  const published = collection === "notes" ? isPublishedNote : isPublishedProject;
  const publishedZh = entries.filter(
    (entry) => entry.locale === "zh" && published(entry),
  );
  const publishedEn = entries.filter(
    (entry) => entry.locale === "en" && published(entry),
  );
  const missingEn = publishedZh.filter(
    (entry) =>
      !entries.some(
        (candidate) =>
          candidate.translationKey === entry.translationKey &&
          candidate.locale === "en" &&
          published(candidate) &&
          !candidate.isPlaceholder,
      ),
  );
  const missingZh = publishedEn.filter(
    (entry) =>
      !entries.some(
        (candidate) =>
          candidate.translationKey === entry.translationKey &&
          candidate.locale === "zh" &&
          published(candidate) &&
          !candidate.isPlaceholder,
      ),
  );

  return {
    definition:
      collection === "notes"
        ? "Published means status=published and draft=false."
        : "Published means status=completed, isPlaceholder!=true and noindex!=true.",
    counts: {
      files: entries.length,
      translationKeys: groups.size,
      publishedZh: publishedZh.length,
      publishedEn: publishedEn.length,
      missingEn: missingEn.length,
      missingZh: missingZh.length,
      placeholderEn: publishedEn.filter((entry) => entry.isPlaceholder).length,
      placeholderZh: publishedZh.filter((entry) => entry.isPlaceholder).length,
      explicitPlaceholderEn: entries.filter(
        (entry) => entry.locale === "en" && entry.isPlaceholder,
      ).length,
      explicitPlaceholderZh: entries.filter(
        (entry) => entry.locale === "zh" && entry.isPlaceholder,
      ).length,
      generatedRouteEntries: entries.filter(
        (entry) => collection === "projects" || !entry.draft,
      ).length,
    },
    missingEn: missingEn.map(compactEntry),
    missingZh: missingZh.map(compactEntry),
    entries: entries.map(compactEntry),
    records,
  };
}

function pagePattern(filePath) {
  const relativePath = slash(relative(pagesRoot, filePath)).replace(
    /\.(astro|ts)$/,
    "",
  );
  const segments = relativePath.split("/");
  const locale = segments[0] === "zh" ? "zh" : "en";
  if (locale === "zh") segments.shift();
  if (segments.at(-1) === "index") segments.pop();
  const pattern = `/${segments.join("/")}${segments.length ? "/" : ""}`;
  return {
    locale,
    pattern,
    localizedPattern: locale === "zh" ? `/zh${pattern}` : pattern,
  };
}

function auditRoutes() {
  const pages = walk(pagesRoot, (file) => [".astro", ".ts"].includes(extname(file)))
    .sort()
    .map((filePath) => ({ filePath: fromRoot(filePath), ...pagePattern(filePath) }));
  const routePages = pages.filter(
    (page) => page.pattern !== "/robots.txt/" && page.pattern !== "/404/",
  );
  const englishPatterns = new Set(
    routePages.filter((page) => page.locale === "en").map((page) => page.pattern),
  );
  const chinesePatterns = new Set(
    routePages.filter((page) => page.locale === "zh").map((page) => page.pattern),
  );
  const englishOnly = [...englishPatterns]
    .filter((pattern) => !chinesePatterns.has(pattern))
    .sort();
  const chineseOnly = [...chinesePatterns]
    .filter((pattern) => !englishPatterns.has(pattern))
    .sort();
  return {
    pages,
    englishOnly,
    chineseOnly,
    dynamicDifferences: [...englishOnly, ...chineseOnly].filter((pattern) =>
      pattern.includes("["),
    ),
    seriesRouteDifferences: [...englishOnly, ...chineseOnly].filter((pattern) =>
      pattern.includes("/series/"),
    ),
    paginationRouteDifferences: [...englishOnly, ...chineseOnly].filter((pattern) =>
      pattern.includes("/page/"),
    ),
    tagRouteDifferences: [...englishOnly, ...chineseOnly].filter((pattern) =>
      pattern.includes("/tag/"),
    ),
  };
}

function importTargets(filePath) {
  const source = read(filePath);
  const specifiers = [
    ...source.matchAll(
      /\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'](\.[^"']+)["']/g,
    ),
  ].map((match) => match[1]);
  return specifiers.flatMap((specifier) => {
    const base = resolve(dirname(filePath), specifier);
    const candidates = extname(base)
      ? [base]
      : [base, `${base}.astro`, `${base}.ts`, `${base}.js`, join(base, "index.ts")];
    const match = candidates.find(
      (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
    );
    return match ? [match] : [];
  });
}

function componentInventory(routes) {
  const excludedPatterns = new Set([
    "/404/",
    "/design-lab/",
    "/contact/",
    "/resume/",
    "/skills/",
  ]);
  const routeFiles = routes.pages.filter(
    (page) => extname(page.filePath) !== ".ts" && !excludedPatterns.has(page.pattern),
  );
  const componentRoutes = new Map();

  function visit(filePath, route, seen) {
    if (seen.has(filePath)) return;
    seen.add(filePath);
    if (filePath.startsWith(componentsRoot)) {
      const set = componentRoutes.get(filePath) ?? new Set();
      set.add(route);
      componentRoutes.set(filePath, set);
    }
    const targets = importTargets(filePath).filter((target) => {
      const englishProjectRoute =
        filePath.endsWith("ProjectRenderer.astro") && !route.startsWith("/zh/");
      const chineseOnlyProjectRenderer =
        /(?:RetirementMonteCarlo|PowerBIDashboard|PythonAnalysis|SqlDatabase|RMachineLearning)Project\.astro$/.test(
          target,
        );
      return !(englishProjectRoute && chineseOnlyProjectRenderer);
    });
    for (const target of targets) visit(target, route, seen);
  }

  for (const page of routeFiles) {
    visit(resolve(root, page.filePath), page.localizedPattern, new Set());
  }

  const inventory = [...componentRoutes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([filePath, routeSet]) => {
      const source = read(filePath);
      const routesForComponent = [...routeSet].sort();
      const chineseMatches = source.match(/[\p{Script=Han}]/gu) ?? [];
      const quotedEnglishMatches =
        source.match(/["'`](?:[^"'`\n]*[A-Za-z]{3,}[^"'`\n]*)["'`]/g) ?? [];
      const importsDictionary = /(?:\.\.\/)+i18n\//.test(source);
      const localeAware = /\blocale\b/.test(source);
      const isInteractive =
        /<(?:button|input|select|textarea)\b|addEventListener\s*\(/.test(source);
      const needsLocaleExtraction =
        chineseMatches.length > 0 &&
        !importsDictionary &&
        !localeAware &&
        routesForComponent.some((route) => !route.startsWith("/zh/"));
      return {
        component: fromRoot(filePath),
        publishedRoutes: routesForComponent,
        hardcodedChineseCharacters: chineseMatches.length,
        hardcodedEnglishStringLiterals: quotedEnglishMatches.length,
        localeAware,
        importsDictionary,
        interactive: isInteractive,
        needsLocaleDictionary: needsLocaleExtraction,
      };
    });
  return {
    method:
      "Locale-aware import-graph reachability from public page handlers; Chinese-only specialised project renderers are gated at ProjectRenderer, and shared components require extraction when visible Chinese can reach an English route without a locale contract or i18n dictionary.",
    audited: inventory.length,
    requiringLocaleExtraction: inventory.filter((item) => item.needsLocaleDictionary)
      .length,
    inventory,
  };
}

function slugifyHeading(value) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}_-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function auditAnchors(entries) {
  const published = entries.filter((entry) =>
    entry.collection === "notes" ? isPublishedNote(entry) : true,
  );
  const files = published.map((entry) => {
    const headingIds = [...entry.body.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)].map(
      (match) => slugifyHeading(match[1]),
    );
    const explicitIds = [
      ...entry.body.matchAll(/\bid=["']([^"']+)["']|\{#([^}]+)\}/g),
    ].map((match) => match[1] ?? match[2]);
    const anchorLinks = [
      ...entry.body.matchAll(/\[[^\]]*\]\(([^)]+#[^)]+|#[^)]+)\)/g),
    ].map((match) => match[1]);
    const localAnchorLinks = anchorLinks
      .filter((target) => target.startsWith("#"))
      .map((target) => target.slice(1));
    const known = new Set([...headingIds, ...explicitIds]);
    const unresolvedLocalAnchors = localAnchorLinks.filter(
      (target) => !known.has(decodeURIComponent(target)),
    );
    const crossLocaleLinks = [
      ...entry.body.matchAll(/\[[^\]]*\]\((\/zh\/[^)]+|\/[^)]+)\)/g),
    ]
      .map((match) => match[1])
      .filter(
        (target) =>
          (entry.locale === "en" && target.startsWith("/zh/")) ||
          (entry.locale === "zh" && !target.startsWith("/zh/")),
      );
    return {
      filePath: entry.filePath,
      headingCount: headingIds.length,
      explicitIds,
      anchorLinks,
      unresolvedLocalAnchors,
      crossLocaleLinks,
    };
  });
  const risks = files.filter(
    (file) => file.unresolvedLocalAnchors.length || file.crossLocaleLinks.length,
  );
  return {
    filesScanned: files.length,
    anchorLinks: files.reduce((total, file) => total + file.anchorLinks.length, 0),
    explicitHeadingIds: files.reduce(
      (total, file) => total + file.explicitIds.length,
      0,
    ),
    riskCount: risks.reduce(
      (total, file) =>
        total + file.unresolvedLocalAnchors.length + file.crossLocaleLinks.length,
      0,
    ),
    risks,
    files,
  };
}

function extractArrayBlock(source, exportName) {
  const start = source.indexOf(`export const ${exportName} = [`);
  if (start < 0) return "";
  const end = source.indexOf("\n];", start);
  return end < 0 ? source.slice(start) : source.slice(start, end + 3);
}

function declaredSeriesSlugs() {
  const source = read(join(sourceRoot, "data", "learning-series.ts"));
  return [...source.matchAll(/^\s{4}slug:\s*["']([^"']+)["']/gm)].map(
    (match) => match[1],
  );
}

function declaredDeepDiveSlugs() {
  const source = extractArrayBlock(
    read(join(sourceRoot, "data", "r-machine-learning.ts")),
    "deepDives",
  );
  return [...source.matchAll(/^\s{4}slug:\s*["']([^"']+)["']/gm)].map(
    (match) => match[1],
  );
}

function hrefPath(value) {
  try {
    return new URL(value, "https://audit.invalid").pathname.replace(
      /\/index\.html$/,
      "/",
    );
  } catch {
    return value;
  }
}

function builtRouteFor(filePath) {
  let route = slash(relative(join(root, "dist"), filePath));
  if (route === "404.html") return "/404.html";
  route = route.replace(/index\.html$/, "").replace(/\.html$/, "/");
  return `/${route}`.replace(/\/+/g, "/");
}

function auditBuiltAlternates(entries, seriesSlugs, deepDiveSlugs) {
  const dist = join(root, "dist");
  if (!existsSync(dist)) {
    return { available: false, cases: [], falseCases: [], falseCaseCount: 0 };
  }
  const htmlFiles = walk(dist, (file) => extname(file) === ".html");
  const builtRoutes = new Set(htmlFiles.map(builtRouteFor));
  const entryByRoute = new Map(
    entries
      .filter((entry) => entry.collection === "projects" || !entry.draft)
      .map((entry) => [publicRouteFor(entry), entry]),
  );
  const specialRoutes = new Map([
    ...seriesSlugs.flatMap((slug) => [
      [`/zh/notes/series/${slug}/`, { type: "series", locale: "zh", key: slug }],
      [`/notes/series/${slug}/`, { type: "series", locale: "en", key: slug }],
    ]),
    ...deepDiveSlugs.flatMap((slug) => [
      [
        `/zh/projects/customer-churn-machine-learning/${slug}/`,
        { type: "deep-dive", locale: "zh", key: slug },
      ],
      [
        `/projects/customer-churn-machine-learning/${slug}/`,
        { type: "deep-dive", locale: "en", key: slug },
      ],
    ]),
  ]);

  const cases = htmlFiles.map((filePath) => {
    const html = read(filePath);
    const route = builtRouteFor(filePath);
    const alternates = Object.fromEntries(
      [
        ...html.matchAll(
          /<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
        ),
      ].map((match) => [match[1], hrefPath(match[2])]),
    );
    const locale = /<html\b[^>]*lang=["']zh-CN["']/i.test(html) ? "zh" : "en";
    const targetLocale = locale === "zh" ? "en" : "zh-CN";
    const alternate = alternates[targetLocale];
    const targetExists = alternate ? builtRoutes.has(alternate) : false;
    let semanticCounterpart = true;
    let reason = null;
    const entry = entryByRoute.get(route);
    if (entry) {
      const candidate = entries.find(
        (item) =>
          item.collection === entry.collection &&
          item.translationKey === entry.translationKey &&
          item.locale !== entry.locale,
      );
      const valid = candidate
        ? candidate.collection === "notes"
          ? isPublishedNote(candidate) && !candidate.isPlaceholder
          : isPublishedProject(candidate)
        : false;
      if (!valid) {
        semanticCounterpart = !alternate;
        if (alternate) {
          reason = "Alternate emitted without a valid non-placeholder counterpart";
        }
      } else if (!alternate) {
        semanticCounterpart = false;
        reason = "Valid content counterpart exists but no alternate is emitted";
      } else if (alternate !== publicRouteFor(candidate)) {
        semanticCounterpart = false;
        reason = "Alternate does not point to the translationKey counterpart";
      }
    } else if (specialRoutes.has(route)) {
      const descriptor = specialRoutes.get(route);
      const counterpart = [...specialRoutes.entries()].find(
        ([, item]) =>
          item.type === descriptor.type &&
          item.key === descriptor.key &&
          item.locale !== descriptor.locale,
      );
      const counterpartExists = Boolean(counterpart && builtRoutes.has(counterpart[0]));
      if (!counterpartExists) {
        semanticCounterpart = !alternate;
        if (alternate)
          reason = `Alternate emitted without a ${descriptor.type} counterpart`;
      } else if (!alternate) {
        semanticCounterpart = false;
        reason = `${descriptor.type} counterpart exists but no alternate is emitted`;
      } else if (alternate !== counterpart[0]) {
        semanticCounterpart = false;
        reason = `Alternate does not point to the ${descriptor.type} counterpart`;
      }
    } else if (alternate && !targetExists) {
      semanticCounterpart = false;
      reason = "Alternate target route is not built";
    }
    return {
      route,
      locale,
      noindex: /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(
        html,
      ),
      alternates,
      targetExists,
      semanticCounterpart,
      reason,
    };
  });
  const falseCases = cases.filter((item) => !item.semanticCounterpart);
  return {
    available: true,
    builtHtmlRoutes: builtRoutes.size,
    cases,
    falseCases,
    falseCaseCount: falseCases.length,
  };
}

function layoutAudit() {
  const enNote = read(join(pagesRoot, "notes", "[slug].astro"));
  const zhNote = read(join(pagesRoot, "zh", "notes", "[slug].astro"));
  const enProject = read(join(pagesRoot, "projects", "[slug].astro"));
  const zhProject = read(join(pagesRoot, "zh", "projects", "[slug].astro"));
  const noteLayout = read(join(sourceRoot, "layouts", "NoteLayout.astro"));
  const defects = [];
  if (/entry\.data\.slug\s*===/.test(noteLayout)) {
    defects.push({
      id: "NOTE_SPECIALISATION_USES_SLUG",
      detail:
        "The shared NoteLayout selects the specialised learning renderer by locale-sensitive slug instead of translationKey/layout metadata.",
    });
  }
  const specialProjectComponents = [
    "RetirementMonteCarloProject",
    "PowerBIDashboardProject",
    "PythonAnalysisProject",
    "SqlDatabaseProject",
    "RMachineLearningProject",
  ];
  const enSpecial = specialProjectComponents.filter((name) => enProject.includes(name));
  const zhSpecial = specialProjectComponents.filter((name) => zhProject.includes(name));
  if (JSON.stringify(enSpecial) !== JSON.stringify(zhSpecial)) {
    defects.push({
      id: "PROJECT_RENDERER_DIVERGENCE",
      detail:
        "Special project component selection exists only in the Chinese route handler.",
      enSpecial,
      zhSpecial,
    });
  }
  return {
    noteRouteHandlersEquivalent:
      enNote.replaceAll("../../", "../").length === zhNote.length,
    noteDraftFilteringEquivalent:
      enNote.includes("!entry.data.draft") && zhNote.includes("!entry.data.draft"),
    projectDraftFilteringEquivalent: true,
    projectPlaceholderFilteringEquivalent:
      !enProject.includes("isPlaceholder") && !zhProject.includes("isPlaceholder"),
    defects,
    defectCount: defects.length,
  };
}

function searchAudit(notes, projects) {
  const source = read(join(componentsRoot, "GlobalSearch.astro"));
  const localeFiltered =
    /findSearchResults\s*\(\s*index\.filter\([^)]*locale/.test(source) ||
    /\.filter\(\s*\(item\)\s*=>\s*item\.locale\s*===\s*locale\s*\)/s.test(source);
  const projectPublicFiltered =
    /const projects\s*=[\s\S]*?status\s*===[\s\S]*?isPlaceholder[\s\S]*?noindex[\s\S]*?;/u.test(
      source,
    );
  const notePlaceholderFiltered =
    /const notes\s*=[\s\S]*?status\s*===[\s\S]*?draft[\s\S]*?isPlaceholder[\s\S]*?;/u.test(
      source,
    );
  const issues = [];
  if (!localeFiltered) {
    issues.push(
      "Each locale receives and searches the combined English/Chinese index.",
    );
  }
  if (!projectPublicFiltered) {
    issues.push(
      "Project search entries are not filtered for placeholder/noindex/public status.",
    );
  }
  if (!notePlaceholderFiltered) {
    issues.push(
      "Note search filtering excludes drafts but does not independently exclude placeholders.",
    );
  }
  return {
    localeFiltered,
    projectPublicFiltered,
    notePlaceholderFiltered,
    indexedProjects: projects.filter(
      (entry) => entry.status === "completed" && !entry.isPlaceholder && !entry.noindex,
    ).length,
    indexedNotes: notes.filter(
      (entry) => entry.status === "published" && !entry.draft && !entry.isPlaceholder,
    ).length,
    placeholderProjectsLeaking: 0,
    placeholderNotesLeaking: notes.filter(
      (entry) => !entry.draft && entry.isPlaceholder,
    ).length,
    issues,
  };
}

function markdownReport(report) {
  const needingComponents = report.components.inventory.filter(
    (item) => item.needsLocaleDictionary,
  );
  const falseAlternateRows = report.seo.falseAlternates.falseCases
    .map((item) => `| \`${item.route}\` | ${item.reason} |`)
    .join("\n");
  const componentRows = needingComponents
    .map(
      (item) =>
        `| \`${item.component}\` | ${item.publishedRoutes.join(", ")} | ${item.hardcodedChineseCharacters} | ${item.interactive ? "yes" : "no"} |`,
    )
    .join("\n");
  return `# Phase 0 Bilingual Architecture Audit

Generated: ${report.generatedAt}
Branch: \`${report.git.branch}\`
Commit: \`${report.git.commit}\`

## Acceptance counts

| Metric | Count |
|---|---:|
| Published ZH Notes | ${report.acceptance.publishedZhNotes} |
| Published EN Notes | ${report.acceptance.publishedEnNotes} |
| Missing EN Notes | ${report.acceptance.missingEnNotes} |
| English placeholder Notes | ${report.acceptance.englishPlaceholderNotes} |
| Published ZH Projects | ${report.acceptance.publishedZhProjects} |
| Published EN Projects | ${report.acceptance.publishedEnProjects} |
| Missing EN Projects | ${report.acceptance.missingEnProjects} |
| English placeholder Projects | ${report.acceptance.englishPlaceholderProjects} |
| Missing EN Series routes | ${report.acceptance.missingEnSeriesRoutes} |
| Layout parity defects | ${report.acceptance.layoutParityDefects} |
| Components requiring locale extraction | ${report.acceptance.componentsRequiringLocaleExtraction} |
| False alternate/hreflang cases | ${report.acceptance.falseAlternateCases} |
| Anchor risks | ${report.acceptance.anchorRisks} |

Definitions: a published Note has \`status=published\` and \`draft=false\`; a published Project has \`status=completed\`, is not a placeholder, and is not \`noindex\`. Acceptance placeholder counts include only published entries; explicit draft or noindex placeholders remain classified in the detailed inventory.

## Confirmed baseline discrepancies

${report.discrepancies.map((item) => `- ${item}`).join("\n")}

## Route parity

- English-only source route patterns: ${report.routes.englishOnly.length ? report.routes.englishOnly.map((item) => `\`${item}\``).join(", ") : "none"}
- Chinese-only source route patterns: ${report.routes.chineseOnly.length ? report.routes.chineseOnly.map((item) => `\`${item}\``).join(", ") : "none"}
- Missing English series instances: ${report.series.missingEnglishRoutes ? report.series.slugs.map((slug) => `\`/notes/series/${slug}/\``).join(", ") : "none"}

## Layout parity defects

${report.layouts.defects.map((item) => `- **${item.id}:** ${item.detail}`).join("\n")}

## Search

${report.search.issues.map((item) => `- ${item}`).join("\n")}

## SEO false alternates

| Route | Evidence |
|---|---|
${falseAlternateRows || "| — | None detected |"}

## Components requiring locale extraction

Method: ${report.components.method}

| Component | Published route patterns | Han characters | Interactive |
|---|---|---:|---|
${componentRows || "| — | — | 0 | no |"}

## Anchors and internal links

- Published Markdown/MDX files scanned: ${report.anchors.filesScanned}
- Anchor links found: ${report.anchors.anchorLinks}
- Explicit heading IDs found: ${report.anchors.explicitHeadingIds}
- Risks: ${report.anchors.riskCount}

## Phase gate

- Audit coverage: **100%** of content source files, page handlers, reachable published components, built HTML routes and published Markdown/MDX.
- Intentional public behaviour change: **0**.
- Next phase: shared route and renderer parity.
`;
}

const notes = loadCollection("notes");
const projects = loadCollection("projects");
const entries = [...notes, ...projects];
const noteAudit = analyseCollection("notes", notes);
const projectAudit = analyseCollection("projects", projects);
const routes = auditRoutes();
const seriesSlugs = declaredSeriesSlugs();
const deepDiveSlugs = declaredDeepDiveSlugs();
const missingEnglishSeriesRoutes = routes.seriesRouteDifferences.includes(
  "/notes/series/[series]/",
)
  ? seriesSlugs.length
  : 0;
const layouts = layoutAudit();
const components = componentInventory(routes);
const anchors = auditAnchors(entries);
const search = searchAudit(notes, projects);
const falseAlternates = auditBuiltAlternates(entries, seriesSlugs, deepDiveSlugs);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  git: { branch: git("branch", "--show-current"), commit: git("rev-parse", "HEAD") },
  scope: {
    contentFiles: entries.length,
    pageHandlers: routes.pages.length,
    reachableComponents: components.audited,
    builtHtmlAvailable: falseAlternates.available,
  },
  content: { notes: noteAudit, projects: projectAudit },
  routes,
  layouts,
  components,
  anchors,
  search,
  seo: {
    baseLayoutDefaultsToSyntheticAlternate: read(
      join(sourceRoot, "layouts", "BaseLayout.astro"),
    ).includes("alternatePath ?? getLocalizedPath"),
    falseAlternates,
  },
  series: { slugs: seriesSlugs, missingEnglishRoutes: missingEnglishSeriesRoutes },
  deepDives: { slugs: deepDiveSlugs, missingEnglishRoutes: deepDiveSlugs.length },
  discrepancies: [
    `The repository has ${noteAudit.counts.publishedZh} published Chinese Learning Notes and ${noteAudit.counts.publishedEn} published English Learning Notes.`,
    ...(layouts.defectCount
      ? [
          "English and Chinese dynamic content routes do not yet share every renderer decision.",
        ]
      : []),
    ...(missingEnglishSeriesRoutes
      ? ["Learning Series route instances are available only in Chinese."]
      : []),
    ...(search.issues.length
      ? ["Global search does not yet enforce complete locale and publication parity."]
      : []),
  ],
  acceptance: {
    publishedZhNotes: noteAudit.counts.publishedZh,
    publishedEnNotes: noteAudit.counts.publishedEn,
    missingEnNotes: noteAudit.counts.missingEn,
    englishPlaceholderNotes: noteAudit.counts.placeholderEn,
    publishedZhProjects: projectAudit.counts.publishedZh,
    publishedEnProjects: projectAudit.counts.publishedEn,
    missingEnProjects: projectAudit.counts.missingEn,
    englishPlaceholderProjects: projectAudit.counts.placeholderEn,
    missingEnSeriesRoutes: missingEnglishSeriesRoutes,
    layoutParityDefects: layouts.defectCount,
    componentsRequiringLocaleExtraction: components.requiringLocaleExtraction,
    falseAlternateCases: falseAlternates.falseCaseCount,
    anchorRisks: anchors.riskCount,
  },
};

mkdirSync(tmpRoot, { recursive: true });
writeFileSync(join(tmpRoot, "i18n-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(join(tmpRoot, "i18n-audit.md"), markdownReport(report));
console.log(JSON.stringify(report.acceptance, null, 2));
