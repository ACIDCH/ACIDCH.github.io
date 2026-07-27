import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "dist");
const localOrigin = "https://local.invalid";
const failures = [];
const forbiddenPublicName = ["Xintao", "Liu"].join(" ");

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? collectHtml(target) : [target];
    }),
  );
  return files.flat().filter((file) => file.endsWith(".html"));
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

const htmlFiles = await collectHtml(outputRoot);
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const route = routeForFile(file);
  if (/\/page\/1\/$/.test(route)) {
    failures.push(`${route}: duplicate page-one pagination route`);
  }
  if (html.includes(forbiddenPublicName)) {
    failures.push(`${route}: contains a forbidden public identity`);
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
}

if (failures.length) {
  console.error(`Built-site validation failed (${failures.length} issue(s)).`);
  failures.slice(0, 20).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Built-site validation passed (${htmlFiles.length} HTML files checked).`);
