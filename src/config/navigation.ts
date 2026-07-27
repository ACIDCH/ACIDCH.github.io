import type { Locale } from "./site";

export type NavigationItem = {
  path: string;
  label: Record<Locale, string>;
};

export const navigationItems: NavigationItem[] = [
  { path: "/", label: { en: "Home", zh: "首页" } },
  { path: "/projects/", label: { en: "Projects", zh: "项目" } },
  { path: "/notes/", label: { en: "Learning Notes", zh: "学习笔记" } },
  { path: "/about/", label: { en: "About Me", zh: "关于我" } },
];
