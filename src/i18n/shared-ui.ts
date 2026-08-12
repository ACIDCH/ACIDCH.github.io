import type { Locale } from "../config/site";

interface SearchPageCopy {
  title: string;
  description: string;
  path: string;
  searchText: string;
}

export interface SharedUiCopy {
  backToTop: string;
  footer: {
    statement: string;
    navigation: string;
    copyright: string;
  };
  header: {
    portfolioHome: string;
    search: string;
    searchShortcut: string;
    menu: string;
    primaryNavigation: string;
    mobileNavigation: string;
    closeMenu: string;
    close: string;
  };
  hero: {
    scroll: string;
  };
  home: {
    discipline: string;
    title: string;
    projectsAction: string;
    notesAction: string;
    aboutAction: string;
    featured: string;
    notes: string;
    themes: string;
    cta: string;
  };
  noteList: {
    empty: string;
    draft: string;
    published: string;
    placeholder: string;
    handbookTitles: Record<string, string>;
    decisionSeries: string;
  };
  notesExplorer: {
    title: string;
    description: string;
    all: string;
    result: string;
    empty: string;
    latest: string;
    external: string;
    hover: string;
    pagePrefix: string;
    pageSeparator: string;
    pageSuffix: string;
    knowledgeMap: string;
  };
  pageIntro: {
    placeholder: string;
  };
  pagination: {
    label: string;
    previous: string;
    next: string;
    status: string;
  };
  projectCard: {
    statuses: Record<"planned" | "in-development" | "completed", string>;
    topics: Record<"inventory" | "transportation" | "analytics", string>;
    placeholder: string;
    tools: string;
    viewProject: string;
    viewCaseStudy: string;
  };
  projectList: {
    empty: string;
  };
  search: {
    eyebrow: string;
    title: string;
    placeholder: string;
    close: string;
    hint: string;
    empty: string;
    result: string;
    groups: Record<"page" | "project" | "note", string>;
    pages: SearchPageCopy[];
    deepDiveKeywords: string;
  };
  skillGrid: {
    relatedTools: string;
  };
  social: {
    contactLinks: string;
    email: string;
    resume: string;
  };
  theme: {
    toggle: string;
  };
  wechat: {
    open: string;
    close: string;
    title: string;
    imageAlt: string;
    scan: string;
  };
}

export const sharedUi = {
  en: {
    backToTop: "Back to top",
    footer: {
      statement: "Business analytics and supply chain analytics portfolio.",
      navigation: "Footer navigation",
      copyright: "Business Analytics Portfolio",
    },
    header: {
      portfolioHome: "Portfolio home",
      search: "Search",
      searchShortcut: "Search (Ctrl/Command + K)",
      menu: "Menu",
      primaryNavigation: "Primary navigation",
      mobileNavigation: "Mobile navigation",
      closeMenu: "Close menu",
      close: "Close",
    },
    hero: { scroll: "Scroll" },
    home: {
      discipline: "Business Analytics · Supply Chain",
      title: "Business Analytics Portfolio",
      projectsAction: "Explore Projects",
      notesAction: "View Learning Notes",
      aboutAction: "About",
      featured: "Featured Projects",
      notes: "Latest Learning Notes",
      themes: "Core Themes",
      cta: "Build decisions on clearer evidence.",
    },
    noteList: {
      empty: "No notes are available yet.",
      draft: "Draft",
      published: "Published",
      placeholder: "Placeholder",
      handbookTitles: {},
      decisionSeries: "Decision Models",
    },
    notesExplorer: {
      title: "Browse by tag",
      description:
        "A compact topic map groups overlapping article tags into a smaller set of reusable themes.",
      all: "All notes",
      result: "notes shown",
      empty: "No notes match this tag.",
      latest: "Learning Notes",
      external: "External Notebook / Cloud Notes",
      hover: "Hover or focus a tag for its scope; select it to filter the notes below.",
      pagePrefix: "Page ",
      pageSeparator: " of ",
      pageSuffix: "",
      knowledgeMap: "Knowledge map",
    },
    pageIntro: { placeholder: "Placeholder content" },
    pagination: {
      label: "Pagination",
      previous: "Previous",
      next: "Next",
      status: "Page {current} of {total}",
    },
    projectCard: {
      statuses: {
        planned: "Planned",
        "in-development": "In development",
        completed: "Completed",
      },
      topics: {
        inventory: "Inventory",
        transportation: "Transportation",
        analytics: "Analytics",
      },
      placeholder: "Demo / placeholder",
      tools: "Tools",
      viewProject: "View project",
      viewCaseStudy: "View case study",
    },
    projectList: { empty: "No projects are available yet." },
    search: {
      eyebrow: "Global search",
      title: "Search the portfolio",
      placeholder: "Search pages, projects and notes",
      close: "Close search",
      hint: "Type to search in English or Chinese.",
      empty: "No matching results.",
      result: "results",
      groups: { page: "Pages", project: "Projects", note: "Notes" },
      pages: [
        {
          title: "Home",
          description: "Business analytics, supply chain and decision support.",
          path: "/",
          searchText: "Home business analytics supply chain decision support portfolio",
        },
        {
          title: "Projects",
          description: "Analytical projects and clearly labelled demonstrations.",
          path: "/projects/",
          searchText: "Projects analytics demonstrations",
        },
        {
          title: "Learning Notes",
          description: "Bilingual notes on analytics, optimisation and tools.",
          path: "/notes/",
          searchText: "Learning Notes analytics optimisation tools",
        },
        {
          title: "About",
          description: "Profile, education, experience, skills and contact.",
          path: "/about/",
          searchText: "About profile education experience skills contact resume",
        },
      ],
      deepDiveKeywords:
        "R tidymodels classification supervised learning customer churn model comparison",
    },
    skillGrid: { relatedTools: "Related tools" },
    social: {
      contactLinks: "Contact links",
      email: "Email",
      resume: "Resume",
    },
    theme: { toggle: "Toggle light or dark theme" },
    wechat: {
      open: "Open WeChat QR code",
      close: "Close WeChat QR code",
      title: "Connect on WeChat",
      imageAlt: "Portfolio WeChat QR code",
      scan: "Scan the code with WeChat.",
    },
  },
  zh: {
    backToTop: "返回顶部",
    footer: {
      statement: "商业分析与供应链分析作品集。",
      navigation: "页脚导航",
      copyright: "商业分析作品集",
    },
    header: {
      portfolioHome: "作品集首页",
      search: "搜索",
      searchShortcut: "搜索（Ctrl/Command + K）",
      menu: "菜单",
      primaryNavigation: "主导航",
      mobileNavigation: "移动端导航",
      closeMenu: "关闭菜单",
      close: "关闭",
    },
    hero: { scroll: "向下浏览" },
    home: {
      discipline: "商业分析 · 供应链",
      title: "商业分析作品集",
      projectsAction: "浏览项目",
      notesAction: "查看学习笔记",
      aboutAction: "关于我",
      featured: "精选项目",
      notes: "最新学习笔记",
      themes: "核心方向",
      cta: "用更清晰的证据支持决策。",
    },
    noteList: {
      empty: "暂时没有可展示的笔记。",
      draft: "草稿",
      published: "已发布",
      placeholder: "占位内容",
      handbookTitles: {
        "descriptive-statistics": "统计学与 R",
        "sql-relational-data": "SQL 与关系数据",
      },
      decisionSeries: "供应链与优化",
    },
    notesExplorer: {
      title: "按标签浏览",
      description: "把文章里的细粒度标签归并为少量核心主题，减少重复和重合。",
      all: "全部笔记",
      result: "篇笔记",
      empty: "没有符合该标签的笔记。",
      latest: "全部笔记",
      external: "外部笔记本 / 云笔记",
      hover: "悬浮或聚焦标签可查看范围；点击后筛选下方笔记。",
      pagePrefix: "第 ",
      pageSeparator: " 页，共 ",
      pageSuffix: " 页",
      knowledgeMap: "知识地图",
    },
    pageIntro: { placeholder: "占位内容" },
    pagination: {
      label: "分页",
      previous: "上一页",
      next: "下一页",
      status: "第 {current} 页，共 {total} 页",
    },
    projectCard: {
      statuses: {
        planned: "计划中",
        "in-development": "开发中",
        completed: "已完成",
      },
      topics: {
        inventory: "库存",
        transportation: "运输",
        analytics: "分析",
      },
      placeholder: "演示 / 占位",
      tools: "工具",
      viewProject: "查看项目",
      viewCaseStudy: "查看案例",
    },
    projectList: { empty: "暂时没有可展示的项目。" },
    search: {
      eyebrow: "全局搜索",
      title: "搜索作品集",
      placeholder: "搜索页面、项目和笔记",
      close: "关闭搜索",
      hint: "输入英文或中文关键词。",
      empty: "没有匹配结果。",
      result: "项结果",
      groups: { page: "页面", project: "项目", note: "笔记" },
      pages: [
        {
          title: "首页",
          description: "商业分析、供应链与决策支持。",
          path: "/zh/",
          searchText: "首页 商业分析 供应链 决策支持 作品集",
        },
        {
          title: "项目",
          description: "分析项目与明确标识的演示内容。",
          path: "/zh/projects/",
          searchText: "项目 分析 演示",
        },
        {
          title: "学习笔记",
          description: "关于分析、优化与工具的双语笔记。",
          path: "/zh/notes/",
          searchText: "学习笔记 分析 优化 工具",
        },
        {
          title: "关于我",
          description: "个人概况、教育、经历、技能与联系信息。",
          path: "/zh/about/",
          searchText: "关于我 个人概况 教育 经历 技能 联系 简历",
        },
      ],
      deepDiveKeywords:
        "R tidymodels classification supervised learning customer churn 客户流失 模型比较",
    },
    skillGrid: { relatedTools: "相关工具" },
    social: {
      contactLinks: "联系入口",
      email: "Email",
      resume: "简历",
    },
    theme: { toggle: "切换浅色或深色主题" },
    wechat: {
      open: "打开微信二维码",
      close: "关闭微信二维码",
      title: "通过微信联系",
      imageAlt: "作品集微信二维码",
      scan: "请使用微信扫描二维码。",
    },
  },
} satisfies Record<Locale, SharedUiCopy>;

export function getSharedUi(locale: Locale): SharedUiCopy {
  return sharedUi[locale];
}

export function formatSharedUi(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
