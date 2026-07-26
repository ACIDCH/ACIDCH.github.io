import { siteConfig, type Locale } from "../config/site";

function normalisePath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? "/";
  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;
  const finalSegment = withLeadingSlash.split("/").filter(Boolean).at(-1) ?? "";
  const isFilePath = /\.[a-z0-9]+$/i.test(finalSegment);

  if (withLeadingSlash === "/") {
    return "/";
  }

  if (isFilePath) {
    return withLeadingSlash.replace(/\/+$/, "");
  }

  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export function withBase(path: string, basePath: string = siteConfig.basePath): string {
  const normalisedPath = normalisePath(path);
  const normalisedBase =
    basePath === "/" ? "/" : `/${basePath.replace(/^\/|\/$/g, "")}/`;

  if (normalisedBase === "/") {
    return normalisedPath;
  }

  if (normalisedPath === normalisedBase || normalisedPath.startsWith(normalisedBase)) {
    return normalisedPath;
  }

  return `${normalisedBase.replace(/\/$/, "")}${normalisedPath}`;
}

export function getLocalizedPath(path: string, locale: Locale): string {
  const normalisedPath = normalisePath(path);
  const pathWithoutLocale = normalisedPath.replace(/^\/zh(?=\/)/, "") || "/";

  if (locale === siteConfig.language.default) {
    return withBase(pathWithoutLocale);
  }

  return withBase(pathWithoutLocale === "/" ? "/zh/" : `/zh${pathWithoutLocale}`);
}
