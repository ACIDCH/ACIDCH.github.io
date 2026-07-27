import { siteConfig, type Locale } from "../config/site";

function normalisePath(path: string): string {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
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

function splitPath(path: string): { pathname: string; suffix: string } {
  const suffixIndex = path.search(/[?#]/);
  return suffixIndex === -1
    ? { pathname: path, suffix: "" }
    : { pathname: path.slice(0, suffixIndex), suffix: path.slice(suffixIndex) };
}

export function withBase(path: string, basePath: string = siteConfig.basePath): string {
  const { pathname, suffix } = splitPath(path);
  const normalisedPath = normalisePath(pathname || "/");
  const normalisedBase =
    basePath === "/" ? "/" : `/${basePath.replace(/^\/|\/$/g, "")}/`;

  if (normalisedBase === "/") {
    return `${normalisedPath}${suffix}`;
  }

  if (normalisedPath === normalisedBase || normalisedPath.startsWith(normalisedBase)) {
    return `${normalisedPath}${suffix}`;
  }

  return `${normalisedBase.replace(/\/$/, "")}${normalisedPath}${suffix}`;
}

export function getLocalizedPath(path: string, locale: Locale): string {
  const { pathname, suffix } = splitPath(path);
  const normalisedPath = normalisePath(pathname || "/");
  const pathWithoutLocale = normalisedPath.replace(/^\/zh(?=\/)/, "") || "/";

  if (locale === siteConfig.language.default) {
    return withBase(`${pathWithoutLocale}${suffix}`);
  }

  const localizedPath = pathWithoutLocale === "/" ? "/zh/" : `/zh${pathWithoutLocale}`;
  return withBase(`${localizedPath}${suffix}`);
}
