import type { Locale } from "../config/site";

export const learningShellUi = {
  en: { toc: { ariaLabel: "On this page", summary: "On this page" } },
  zh: { toc: { ariaLabel: "本页目录", summary: "本页内容" } },
} as const satisfies Record<Locale, { toc: { ariaLabel: string; summary: string } }>;

export const learningHeadingIdOverrides: Record<string, string> = {
  自增整数最容易理解的主键方案: "自增整数常见但不是唯一方案",
  uuid当记录需要在不同系统中独立生成: "uuid适合分布式生成但不是一种单一算法",
  联合主键一条记录也可以由多个字段共同确定: "联合主键多个字段也可以共同确定身份",
  逻辑外键与数据库外键约束不是同一件事: "逻辑外键与数据库约束不是同一件事",
  多对多订单和产品为什么不能只加一个外键: "多对多订单与产品为什么不能只加一个外键",
};
