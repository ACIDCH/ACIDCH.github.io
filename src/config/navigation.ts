import type { Locale } from "./site";

export type NavigationItem = {
  path: string;
  label: Record<Locale, string>;
};

export const navigationItems: NavigationItem[] = [
  { path: "/", label: { en: "Home", zh: "首页" } },
  { path: "/projects/", label: { en: "Projects", zh: "项目" } },
  { path: "/notes/", label: { en: "Notes", zh: "笔记" } },
  { path: "/productivity/", label: { en: "Productivity", zh: "生产力工具" } },
  { path: "/about/", label: { en: "About", zh: "关于我" } },
];
