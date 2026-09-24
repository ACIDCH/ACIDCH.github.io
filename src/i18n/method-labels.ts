import type { Locale } from "../config/site";

// Display labels only. Keep content identifiers, search terms and filter values intact.
const chineseLabels: Readonly<Record<string, string>> = {
  "Machine Learning": "机器学习",
  "Supervised Learning": "监督学习",
  Classification: "分类模型",
  "Monte Carlo": "蒙特卡洛模拟",
};

export function localizeMethodLabel(value: string, locale: Locale): string {
  return locale === "zh" && Object.hasOwn(chineseLabels, value)
    ? chineseLabels[value]
    : value;
}
