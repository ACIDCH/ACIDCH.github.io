import type { Locale } from "./site";

export type NavigationItem = {
  path: string;
  label: Record<Locale, string>;
};

export const navigationItems: NavigationItem[] = [
  { path: "/", label: { en: "Home", zh: "首页" } },
  { path: "/projects/", label: { en: "Projects", zh: "项目" } },
  { path: "/notes/", label: { en: "Learning Notes", zh: "学习笔记" } },
  { path: "/about/", label: { en: "About", zh: "关于" } },
  { path: "/skills/", label: { en: "Skills", zh: "技能" } },
  { path: "/resume/", label: { en: "Resume", zh: "简历" } },
  { path: "/contact/", label: { en: "Contact", zh: "联系" } },
];
