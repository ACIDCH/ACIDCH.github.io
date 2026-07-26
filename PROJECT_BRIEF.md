# 双语交互式个人作品集网站：项目任务书
# Bilingual Interactive Personal Portfolio Website — Project Brief

> **执行对象 / Intended executor:** OpenAI Codex（本地 VS Code / Terminal 环境）  
> **项目所有者 / Project owner:** Xintao Liu / 刘鑫  
> **文档用途 / Purpose:** 作为本项目唯一主任务书（Single Source of Truth），指导网站的设计、开发、测试、部署与后续扩展。  
> **状态 / Status:** V1.1 — 可执行首版  
> **更新原则 / Update policy:** 后续新增需求应继续合并到本文件，不要另起互相冲突的任务说明。

---

## 0. Codex 执行总指令

你是本项目的主要代码执行代理。请在本地环境中完成一个可直接部署到 GitHub Pages 的双语个人作品集网站。

执行时遵循以下原则：

1. **先检查环境，再开始开发。**
2. **在需求不影响核心实现时，不要反复向用户提问。**
3. 对尚未提供的个人资料、头像、GitHub 用户名、LinkedIn、简历文件、项目真实结果等，使用清晰的占位配置，不要虚构。
4. 所有个人信息必须集中配置，避免散落在多个页面。
5. 所有视觉效果必须可配置、可关闭、可替换。
6. 网站必须在 GitHub Free 条件下长期免费运行，不依赖 GitHub Pro、Copilot、Codespaces、付费服务器、付费主题或学生权益。
7. GitHub 学生权益只能作为开发辅助，不能成为网站运行依赖。
8. 网站源码默认设计为可公开仓库；不得写入密钥、密码、私人电话、家庭住址、References 联系方式或课程原始作业答案。
9. 项目开发阶段必须频繁运行构建、类型检查和基本测试。
10. 完成后输出清晰的本地运行、修改、构建和部署说明。
11. 公开品牌始终使用 `Xintao Liu`；`ACIDCH` 只作为 GitHub 技术账号。
12. 内部链接和静态资源优先使用相对路径或集中 URL 配置，禁止在多个文件中硬编码账号 URL。
13. 架构必须支持未来更换 GitHub username 和绑定独立域名。

---

# 1. 项目目标

创建一个：

- 支持英文和简体中文切换；
- 面向新西兰本地招聘者与中文招聘者；
- 以 Business Analytics、Supply Chain Analytics 和 Data-Driven Decision Making 为核心定位；
- 具有个人品牌、动态背景、页面动画、交互式项目展示；
- 可以持续添加数据分析、供应链、SQL、Power BI、R、Python 和优化项目；
- 可以长期免费托管在 GitHub Pages；
- 可迁移至 Cloudflare Pages 等其他静态托管平台；
- 在电脑、平板和手机上均正常使用；
- 兼顾视觉表现、专业度、性能、可访问性和可维护性；

的现代双语个人作品集网站。

---

# 2. 职业定位

## 2.1 默认英文定位

**Business Analytics & Supply Chain Analytics**

Suggested subtitle:

> Transforming data into practical and measurable business decisions.

## 2.2 中文定位

**商业分析与供应链分析**

Suggested subtitle:

> 利用数据支持可落地、可衡量的商业决策。

## 2.3 当前背景信息

网站内容应围绕以下真实背景组织：

- University of Auckland
- Master of Business Analytics
- Supply Chain specialisation
- Economics undergraduate background
- Finance / securities-related internship experience
- Current and prior learning areas:
  - Python
  - R
  - SQL
  - Azure SQL
  - Power BI
  - DAX
  - Excel
  - Excel Solver
  - SPSS
  - Monte Carlo simulation
  - Web scraping
  - Database design
  - Data analysis
  - Statistical modelling
  - Inventory analytics
  - Transportation optimisation
  - Facility location
  - Supply chain modelling

不得虚构具体成绩、雇主成果、项目节省金额或项目完成状态。

---

# 3. 技术方案

## 3.1 核心技术栈

优先采用当前稳定、维护良好、适合静态内容网站的版本：

- Astro
- TypeScript
- Markdown / MDX
- Astro Content Collections
- Astro i18n routing
- CSS 或 Tailwind CSS（如使用 Tailwind，应保持简洁）
- SVG
- Lightweight JavaScript / TypeScript interaction
- Git
- GitHub Actions
- GitHub Pages

## 3.2 开发环境要求

开始前检查：

```powershell
git --version
node --version
npm --version
gh --version
```

要求：

- Git 可用
- Node.js 满足当前 Astro 官方要求
- npm 可用
- GitHub CLI 可选，不作为必要依赖
- Python 环境保留，但不是网站构建必要条件

若 `gh` 不存在，不得因此中止开发；可以使用 GitHub 网页界面完成仓库创建与 Pages 设置。

## 3.3 不采用

第一版不得依赖：

- React 全站 SPA
- Vue 全站 SPA
- 服务端数据库
- 用户登录
- 付费 CMS
- 付费主题
- 付费字体
- 付费图标库
- 付费视频 CDN
- 后端服务器
- 必须订阅才能运行的 API
- 私有仓库 GitHub Pages 权益
- GitHub Pro 独占功能

---

# 4. 长期免费运行原则

## 4.1 GitHub 仓库

网站仓库建议命名为：

```text
<github-username>.github.io
```

仓库必须能够设置为 **Public**，以确保 GitHub Pro 或学生权益于 2028 年到期后，网站仍可继续免费使用 GitHub Pages。

## 4.2 基础网址

长期基础地址：

```text
https://<github-username>.github.io/
```

自定义域名仅作为可选入口，不能成为唯一入口。

## 4.3 学生权益使用原则

允许使用：

- GitHub Pro：开发阶段便利
- GitHub Copilot Student：代码补全
- Codespaces：备用开发环境
- 学生域名优惠：可选
- Azure 学生额度：未来项目可选

但网站不得依赖以上权益运行。

## 4.4 备用部署兼容

项目必须保持标准 Astro 静态构建结构，确保未来可迁移至：

- Cloudflare Pages
- Netlify
- Vercel static hosting
- 其他静态托管平台


## 4.5 身份、路径与未来改名原则

### 公开名称

网站页面、SEO、项目封面、简历入口和对外展示统一使用：

```text
Xintao Liu
```

中文名称继续由个人配置提供。不得把 GitHub 用户名当作公开姓名。

### GitHub 技术账号

当前 GitHub 技术账号可使用：

```text
ACIDCH
```

`ACIDCH` 仅用于：

- GitHub username（当前技术账号：ACIDCH，需最终确认）
- Repository owner
- Git remote
- GitHub Actions
- GitHub Pages technical address
- 开发配置

不得在页面主标题、About 主名称或个人品牌 Logo 中把 `ACIDCH` 当作个人姓名。

### 路径与 URL

网站内部链接、图片、视频、图标、项目跳转和静态资源尽量使用：

- Astro route helpers
- 相对路径
- 基于 `site` / `base` 的集中配置
- 集中式 URL builder
- Content Collections slug

避免在组件、Markdown 或样式文件中到处写死：

```text
github.com/ACIDCH/...
https://ACIDCH.github.io/...
```

允许在唯一配置文件或环境配置中定义：

```ts
githubUsername: "ACIDCH"
githubProfileUrl: "https://github.com/ACIDCH"
siteUrl: "https://ACIDCH.github.io"
```

组件应从配置读取，不得重复硬编码。

### 仓库链接

项目仓库 URL 应由统一函数生成，例如：

```ts
getGitHubRepoUrl("inventory-optimisation-analysis")
```

而不是在每个项目页面手写完整 GitHub URL。

### 独立域名

第一版先使用 GitHub Pages 技术地址，不急于购买或绑定独立域名。

待网站满足以下条件后再评估域名：

- 页面结构稳定
- 中英文内容成熟
- 至少一个真实项目完成
- 公开名称最终确认
- 网站已用于简历或 LinkedIn
- 已确认续费价格可长期接受

绑定独立域名后，应把它设为主要公开地址。这样未来即使 GitHub username 从 `ACIDCH` 改名，简历、LinkedIn 和公开网站地址仍可保持稳定。

### 改名兼容

代码架构必须支持未来通过修改少量集中配置完成：

- GitHub username（当前技术账号：ACIDCH，需最终确认） 变更
- Repository owner 变更
- Pages URL 变更
- Custom domain 变更
- Public display name 变更

不得要求全局搜索替换大量硬编码 URL。

---

# 5. 网站信息架构

## 5.1 英文默认路由

```text
/
├── /
├── /projects/
├── /projects/[slug]/
├── /notes/
├── /notes/[slug]/
├── /about/
├── /skills/
├── /resume/
├── /contact/
├── /design-lab/
└── /404/
```

## 5.2 中文路由

```text
/zh/
├── /zh/
├── /zh/projects/
├── /zh/projects/[slug]/
├── /zh/notes/
├── /zh/notes/[slug]/
├── /zh/about/
├── /zh/skills/
├── /zh/resume/
├── /zh/contact/
├── /zh/design-lab/
└── /zh/404/
```

## 5.3 主导航

英文：

- Home
- Projects
- Learning Notes
- About
- Skills
- Resume
- Contact
- EN / 中文
- Theme switch

中文：

- 首页
- 项目
- 学习笔记
- 关于我
- 技能
- 简历
- 联系方式
- EN / 中文
- 主题切换

## 5.4 语言切换规则

语言切换必须：

- 保持用户当前页面语义；
- 从英文项目页进入对应中文项目页；
- 从中文 About 进入英文 About；
- 当前语言页面不存在时，回退到对应语言首页；
- 不只替换界面文字，而是使用独立 URL；
- 英文作为默认语言；
- 允许保存用户语言偏好；
- URL 可直接分享。

---

# 6. 首页结构

## 6.1 第一屏：Hero

必须包含：

- 动态背景系统
- 个人 Logo
- Xin Liu / 刘鑫
- 职业定位
- 简短副标题
- CTA 按钮
- 语言切换
- 主题切换
- 背景视频暂停 / 播放控制
- 向下滚动提示

按钮：

- View Projects / 查看项目
- Download Resume / 下载简历
- About Me / 关于我

## 6.2 第二屏：Professional Summary

简洁说明：

- University of Auckland
- Master of Business Analytics
- Supply Chain specialisation
- Economics background
- Finance-related experience
- Data, optimisation and decision support focus

## 6.3 第三屏：Core Capabilities

至少包括：

- Data Analytics
- Database & SQL
- Visualisation
- Optimisation
- Supply Chain
- Business Decision Support

每个能力组：

- 自定义图标
- 简要说明
- 对应工具
- 轻量悬停效果

## 6.4 第四屏：Featured Projects

第一版展示三张项目卡：

1. Inventory Optimisation and Sensitivity Analysis  
   库存优化与敏感性分析

2. Supply Chain Transportation Network Optimisation  
   供应链运输网络优化

3. Sales and Inventory Analytics Dashboard  
   销售与库存分析仪表板

允许初始状态：

- In Development
- Planned
- Completed

不得把未完成项目标记为 Completed。

## 6.5 第五屏：Tools

展示：

- Python
- R
- SQL
- Azure SQL
- Power BI
- DAX
- Excel
- Excel Solver
- GitHub
- VS Code

使用统一风格图标，不得杂乱堆放品牌色。

## 6.6 第六屏：Education & Experience Timeline

使用动画时间线展示：

- 教育背景
- 相关课程方向
- 实习经历
- 当前学习阶段

所有日期和单位使用配置数据，未提供信息时显示占位，不得猜测。

## 6.7 第七屏：Latest Learning Notes

显示最近学习笔记，包括未来可能添加：

- EOQ sensitivity analysis
- LS / LF and critical path
- Transportation models
- Power BI DAX
- SQL database design
- R loops and functions
- Python data analysis

## 6.8 第八屏：Contact

包括：

- GitHub
- LinkedIn
- Professional email
- English resume
- Chinese resume

未提供的链接使用不可点击占位或隐藏，不得填写虚构网址。

---

# 7. 视觉品牌系统

## 7.1 视觉方向

默认风格：

**Data Aurora / 数据极光**

关键词：

- Modern
- Analytical
- Supply-chain network
- New Zealand context
- Professional
- Dynamic
- Clean
- Bilingual

## 7.2 默认配色建议

可在配置中修改：

- Primary: cyan / sky blue
- Secondary: violet
- Accent: amber
- Dark background: deep navy
- Light background: off-white / soft grey
- Cards: subtle glass effect

禁止：

- 过度霓虹
- 高频闪烁
- 同屏过多强烈颜色
- 影响正文对比度的透明度

## 7.3 Logo

首版必须实现：

- `XL` 字母组合标志
- Xintao Liu 文字版本
- 刘鑫中文版本
- 图形版 Logo
- Favicon
- Monochrome version
- Dark background version
- Light background version

Logo 概念：

- X 与 L 结合
- 数据折线
- 供应链节点
- 路径连线
- 简约 SVG

Logo 必须为原创或自行生成，不得复制参考网站 Logo。

## 7.4 字体

要求：

- 使用免费、可合法托管或系统字体
- 英文字体与中文字体搭配协调
- 中文正文清晰
- 不上传受限制字体文件
- 提供合理 font fallback

---

# 8. 多背景系统

第一版必须实现以下背景模式：

## 8.1 Video

支持：

- WebM
- MP4 fallback
- autoplay
- muted
- loop
- playsinline
- poster image
- pause / play
- mobile fallback
- reduced-motion fallback

建议仅用于首页 Hero。

## 8.2 Image

支持可替换背景图片：

- Auckland skyline
- New Zealand landscape
- Abstract analytics
- Supply chain network
- Data grid

用户尚未提供正式素材时，使用合法、可替换的占位素材或抽象自制 SVG/CSS 背景。

## 8.3 Aurora Gradient

CSS 动态渐变：

- 低资源消耗
- 可作为视频加载前背景
- 深浅主题均有版本

## 8.4 Network / Particle

轻量数据网络：

- 节点
- 连线
- 缓慢移动
- 轻微鼠标响应
- 可关闭
- 低性能设备减少粒子数量
- 页面不可见时暂停

## 8.5 SVG Motion

用于：

- 数据折线
- 供应链路径
- 网格
- 流程箭头
- 页面装饰

## 8.6 配置切换

在统一配置中支持：

```ts
heroBackground: "video" | "image" | "aurora" | "network"
```

所有背景模式需保留，不必同时高强度运行。

---

# 9. 自定义图标、表情和角色

## 9.1 技术工具图标

可使用：

- 自制统一轮廓图标
- 合法开源图标库
- 官方品牌 SVG（遵守商标使用规范）

## 9.2 专业能力图标

制作统一视觉：

- Data analysis
- Database
- Inventory
- Transportation
- Facility location
- Simulation
- Dashboard
- Decision support

## 9.3 个人小角色 / 表情

第一版包含轻量角色系统，至少有：

- analysing data
- coding
- modelling
- project completed
- 404 / lost

应用位置：

- About 页面
- Empty state
- In development 项目
- 404
- Notes 页面细节

不得让角色影响求职网站专业度。

---

# 10. 动画与交互

## 10.1 页面过渡

包括：

- 页面淡入淡出
- 项目卡片至详情页视觉连续
- Logo 平滑过渡
- 中英文切换过渡
- 深浅模式过渡
- 背景渐变过渡
- 页面加载进度提示

## 10.2 滚动动画

包括：

- 内容进入视口时淡入
- 技能图标依次出现
- 时间线展开
- 数字递增
- 项目区块进入
- Hero 向下滚动提示

## 10.3 Hover

包括：

- 项目卡片抬升
- 轻微 3D tilt
- 按钮高亮
- 工具标签显示
- 图标反馈
- 项目封面轻微视差

## 10.4 可访问性

必须支持：

```css
@media (prefers-reduced-motion: reduce)
```

当用户启用减少动画：

- 停止背景视频自动播放
- 关闭粒子
- 关闭卡片 tilt
- 关闭数字动画
- 减少页面过渡
- 保留功能可用性

所有动画不得影响：

- 阅读
- 点击
- 键盘导航
- 屏幕阅读器
- 正文对比度

---

# 11. 交互式项目展示

## 11.1 项目卡片字段

每个项目至少包含：

- title
- titleZh
- slug
- summary
- summaryZh
- tools
- status
- featured
- cover image
- github URL
- report URL
- dashboard URL
- language
- last updated
- tags

## 11.2 卡片按钮

- View Case Study / 查看完整案例
- View Repository / 查看代码仓库
- View Report / 查看报告
- View Dashboard / 查看仪表板

没有对应资源时按钮隐藏或显示 Coming Soon，不得链接到空地址。

## 11.3 项目详情页

结构：

1. Project Overview / 项目概览
2. Business Problem / 业务问题
3. Data / 数据
4. Tools / 工具
5. Methodology / 方法
6. Key Findings / 主要发现
7. Business Recommendations / 商业建议
8. Limitations / 局限
9. Files and Links / 文件与链接
10. Related Notes / 相关学习笔记

## 11.4 筛选

首版包含：

- Tool filter
- Topic filter
- Status filter
- Clear filters

支持中英文标签显示。

---

# 12. 动态供应链网络组件

首版必须实现一个通用演示组件：

```text
Supplier
  ↓
Warehouse
  ↓
Distribution Centre
  ↓
Customer Market
```

功能：

- 节点逐步出现
- 路线绘制动画
- Hover 显示信息
- 最优路径高亮
- 受限路径区分
- 成本 / 容量 / 流量字段
- 优化前后切换
- 演示数据与真实数据接口分离

初期使用清晰标注的 demo data，不得把演示数据冒充真实项目结果。

优先使用：

- SVG
- Canvas（仅在确有必要时）
- 轻量 JavaScript

不引入大型图形框架，除非确实能显著降低维护成本。

---

# 13. 内容管理

## 13.1 Content Collections

至少建立：

- projects
- notes

可选：

- experience
- education

## 13.2 双语内容

每个项目和笔记使用清晰对应关系，例如：

```text
inventory-optimisation.en.md
inventory-optimisation.zh.md
```

或使用同一 content ID + locale 字段。

必须能从一种语言准确跳转到另一种语言。

## 13.3 README

项目仓库未来使用：

```text
README.md
README.zh-CN.md
```

顶部提供：

```markdown
[English](README.md) | [中文](README.zh-CN.md)
```

---

# 14. 页面清单

第一版必须完成：

- Home
- Projects
- Project Detail
- Learning Notes
- Note Detail
- About
- Skills
- Resume
- Contact
- 404
- Design Lab

上述页面均需英文与中文版本。

---

# 15. Design Lab

创建：

```text
/design-lab/
/zh/design-lab/
```

默认不放入公开主导航，可通过直接 URL 访问。

功能：

- Theme A: Data Aurora
- Theme B: Auckland Night
- Theme C: Clean Analytics
- Theme D: Supply Chain Network
- 配色预览
- 背景视频预览
- 静态背景预览
- Logo 预览
- 按钮预览
- 卡片预览
- 字体预览
- 图标预览
- 动画强度预览
- 英文 / 中文排版比较
- Light / Dark / System 比较

Design Lab 仅用于开发和视觉选择，不影响正式页面 SEO。

---

# 16. 主题与统一配置

建立集中配置，例如：

```ts
export const siteConfig = {
  brand: {
    name: "Xintao Liu",
    nameZh: "刘鑫",
    logoStyle: "network",
  },
  theme: {
    primary: "#38BDF8",
    secondary: "#8B5CF6",
    accent: "#F59E0B",
    cardStyle: "glass",
    radius: "20px",
  },
  hero: {
    background: "video",
    videoEnabled: true,
    particlesEnabled: true,
    networkEnabled: false,
  },
  motion: {
    pageTransitions: true,
    scrollReveal: true,
    cardTilt: true,
    animatedCounters: true,
    cursorEffect: false,
  },
  language: {
    default: "en",
    supported: ["en", "zh"],
  },
};
```

所有以下内容尽量配置化：

- 姓名
- 个人简介
- 社交链接
- 简历链接
- 颜色
- Logo
- Hero 背景
- 动画开关
- 项目
- 技能
- 教育
- 经历
- 联系方式

---

# 17. 推荐目录结构

```text
<github-username>.github.io/
│
├── public/
│   ├── brand/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   ├── logo-light.svg
│   │   └── favicon.svg
│   ├── backgrounds/
│   │   ├── hero-video.webm
│   │   ├── hero-video.mp4
│   │   ├── hero-poster.webp
│   │   └── hero-image.webp
│   ├── icons/
│   ├── avatars/
│   ├── characters/
│   ├── projects/
│   └── resume/
│       ├── xin-liu-resume-en.pdf
│       └── xin-liu-resume-zh.pdf
│
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── LanguageSwitch.astro
│   │   ├── ThemeSwitch.astro
│   │   ├── BackgroundController.astro
│   │   ├── ProjectCard.astro
│   │   ├── SkillGroup.astro
│   │   ├── Timeline.astro
│   │   ├── SupplyChainNetwork.astro
│   │   ├── MotionController.astro
│   │   └── CharacterState.astro
│   ├── content/
│   │   ├── projects/
│   │   └── notes/
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── ProjectLayout.astro
│   │   └── NoteLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── projects/
│   │   ├── notes/
│   │   ├── about.astro
│   │   ├── skills.astro
│   │   ├── resume.astro
│   │   ├── contact.astro
│   │   ├── design-lab.astro
│   │   └── zh/
│   │       ├── index.astro
│   │       ├── projects/
│   │       ├── notes/
│   │       ├── about.astro
│   │       ├── skills.astro
│   │       ├── resume.astro
│   │       ├── contact.astro
│   │       └── design-lab.astro
│   ├── i18n/
│   │   ├── en.ts
│   │   ├── zh.ts
│   │   └── utils.ts
│   ├── config/
│   │   ├── site.ts
│   │   ├── navigation.ts
│   │   ├── skills.ts
│   │   ├── experience.ts
│   │   └── projects.ts
│   ├── styles/
│   │   ├── global.css
│   │   ├── themes.css
│   │   ├── motion.css
│   │   └── utilities.css
│   └── utils/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── README.md
└── PROJECT_BRIEF.md
```

---

# 18. 性能要求

## 18.1 背景视频

- 短循环
- 合理分辨率
- WebM 优先
- MP4 fallback
- 静态 poster
- 移动端可禁用
- 页面隐藏时暂停
- 用户点击可暂停

## 18.2 图片

优先：

- AVIF
- WebP
- SVG

要求：

- 正确尺寸
- Responsive images
- Lazy loading
- Alt text
- 首屏素材适当预加载
- 非首屏素材延迟加载

## 18.3 JavaScript

- 只在需要交互的组件加载
- 避免整站 hydration
- 不引入过重依赖
- 粒子和 tilt 必须轻量
- 项目正文以静态 HTML 为主

## 18.4 构建目标

至少确保：

```powershell
npm run build
```

无错误。

如配置了：

```powershell
npm run check
npm run lint
npm run test
```

也必须通过。

---

# 19. SEO 与分享

第一版必须包含：

- 每页独立 title
- 每页 meta description
- Canonical URL
- Alternate language / hreflang
- Open Graph
- Twitter/X card metadata
- Sitemap
- robots.txt
- Favicon
- Structured data（Person / WebSite / CreativeWork，适度）
- 项目封面分享图
- 404 页面

中英文页面 SEO 文案独立，不得机械混用。

---

# 20. 可访问性

要求：

- Semantic HTML
- Keyboard navigation
- Visible focus state
- Skip to content
- Proper heading hierarchy
- Alt text
- Sufficient colour contrast
- Form labels
- Reduced motion
- Video pause control
- No autoplay audio
- Screen reader friendly language switch
- `lang="en"` 与 `lang="zh-CN"` 正确设置

---

# 21. 隐私与安全

禁止提交：

- `.env`
- API keys
- Passwords
- Personal home address
- Private phone numbers
- Reference contacts
- University restricted files
- Raw graded assignments
- Teacher-provided solution files
- Other students’ work
- Private emails
- Confidential employer data

建立 `.gitignore`。

所有演示数据必须：

- 公开许可；
- 自建；
- 模拟；
- 或已匿名化。

---

# 22. 当前项目占位内容

## 22.1 Project 1

**Inventory Optimisation and Sensitivity Analysis**  
**库存优化与敏感性分析**

Tools:

- R
- Excel
- EOQ
- Sensitivity Analysis
- Inventory Analytics

Status:

```text
In Development
```

## 22.2 Project 2

**Supply Chain Transportation Network Optimisation**  
**供应链运输网络优化**

Tools:

- Excel Solver
- Python
- PuLP
- Linear Programming
- Scenario Analysis

Status:

```text
Planned
```

## 22.3 Project 3

**Sales and Inventory Analytics Dashboard**  
**销售与库存分析仪表板**

Tools:

- Python
- SQL
- Azure SQL
- Power BI
- DAX

Status:

```text
Planned
```

项目真实完成前不得展示虚构结果数字。

---

# 23. GitHub Profile 规划

网站之外，后续应建立 GitHub Profile README。

建议置顶：

1. Portfolio Website
2. Inventory Optimisation
3. Supply Chain Network Optimisation
4. Sales and Inventory Dashboard

网站仓库、项目仓库与课程私人仓库必须分开。

---

# 24. GitHub Actions 与 GitHub Pages

创建官方、简洁的部署工作流。

目标：

```text
git push
  ↓
GitHub Actions
  ↓
Astro build
  ↓
GitHub Pages deploy
```

要求：

- 不依赖旧式 `hexo deploy`
- 不推送生成文件到 master 分支
- 使用 GitHub Pages 推荐的 Actions 流程
- 支持自定义域名但不依赖
- README 中写明 Pages 设置步骤

---

# 25. 第一版实施阶段

## Phase 1 — Environment and Scaffold

- 检查 Git、Node、npm
- 创建 Astro 项目
- 安装必要依赖
- 建立目录
- 配置 TypeScript
- 配置 Content Collections
- 配置 i18n
- 配置 GitHub Pages base / site

## Phase 2 — Brand and Design System

- Logo
- Favicon
- Colour system
- Typography
- Theme modes
- Global layout
- Header / Footer
- Design Lab

## Phase 3 — Dynamic Hero

- Video
- Poster
- Aurora
- Network
- Background controller
- Pause control
- Reduced-motion fallback
- Mobile fallback

## Phase 4 — Main Pages

- Home
- Projects
- Notes
- About
- Skills
- Resume
- Contact
- 404
- Chinese equivalents

## Phase 5 — Project System

- Project collection
- Project cards
- Filters
- Detail layout
- Demo project content
- Supply chain network component

## Phase 6 — Animation and Interaction

- Page transitions
- Scroll reveal
- Card tilt
- Counters
- Timeline
- Theme transition
- Language transition

## Phase 7 — Performance and Accessibility

- Image optimisation
- Video compression guidance
- Reduced motion
- Keyboard navigation
- Contrast
- Alt text
- Lighthouse review

## Phase 8 — Deployment

- GitHub Actions
- GitHub Pages
- Build validation
- README
- Deployment guide

---

# 26. 验收标准

## 26.1 功能

- [ ] 英文首页可访问
- [ ] 中文首页可访问
- [ ] 当前页面语言可准确切换
- [ ] Light / Dark / System 工作正常
- [ ] 背景视频可播放与暂停
- [ ] 移动端自动降级
- [ ] Reduced motion 正常
- [ ] Projects 页面可筛选
- [ ] 项目详情页可打开
- [ ] Notes 页面可打开
- [ ] 简历按钮处理缺失文件
- [ ] GitHub / LinkedIn 缺失链接不报错
- [ ] 404 正常
- [ ] Design Lab 正常

## 26.2 视觉

- [ ] Logo 完整
- [ ] Favicon 完整
- [ ] 中英文排版协调
- [ ] 首页具有视觉冲击
- [ ] 项目正文清晰易读
- [ ] 动画不过度
- [ ] 手机端无横向滚动
- [ ] 卡片风格统一
- [ ] 图标风格统一

## 26.3 技术

- [ ] `npm run build` 成功
- [ ] 无明显 TypeScript 错误
- [ ] 无失效内部链接
- [ ] 无密钥
- [ ] 无私人数据
- [ ] GitHub Actions 成功
- [ ] GitHub Pages 可访问
- [ ] 静态站点可迁移

## 26.4 内容

- [ ] 不虚构项目结果
- [ ] 不公开课程原始答案
- [ ] 项目状态真实
- [ ] 英文默认
- [ ] 中文内容完整
- [ ] About 基于真实经历
- [ ] Placeholder 标记清楚

---

# 27. Codex 完成后应输出

1. 项目目录说明
2. 已完成内容清单
3. 未完成或等待用户素材内容
4. 本地运行命令
5. 构建命令
6. 部署步骤
7. 如何修改颜色
8. 如何替换背景视频
9. 如何替换 Logo
10. 如何更新个人资料
11. 如何添加新项目
12. 如何添加中英文项目
13. 如何添加学习笔记
14. 如何切换主背景模式
15. 如何关闭动画
16. 如何更新简历
17. 如何连接 GitHub Pages
18. 已知限制

---

# 28. 当前待用户补充的信息

以下内容不得阻止框架开发，先使用配置占位：

- GitHub username（当前技术账号：ACIDCH，需最终确认）
- Professional email
- LinkedIn URL
- GitHub profile URL
- English resume PDF
- Chinese resume PDF
- Formal profile photo
- Preferred background image/video
- Final Logo preference
- Final colour preference
- Exact education dates
- Exact internship dates
- Confirmed public experience descriptions
- Project screenshots
- Project result figures
- Custom domain decision（网站成熟后再决定）

---

# 29. 非目标

第一版不做：

- 用户账户
- 评论数据库
- 在线支付
- 后台管理系统
- 实时聊天
- 服务器端业务逻辑
- 复杂 CMS
- 实时多人编辑
- 付费 API 依赖
- 自动股票价格服务
- 大型 3D 场景
- 背景音乐自动播放

---

# 30. 最终定义

本项目第一版不是空白网站骨架，而是：

> 一个完整的、具有个人品牌、动态视觉、双语内容、交互式项目展示、博客能力、简历入口、长期免费部署能力和后续项目扩展能力的个人作品集网站。

项目内容可以逐步完善，但第一版必须完成：

- 品牌系统
- 双语系统
- 多背景系统
- 动画系统
- 交互系统
- 项目内容框架
- 学习笔记框架
- 简历框架
- GitHub Pages 自动部署
- 长期免费运行设计

---

## Change Log

### V1.1

- 新增身份、路径与未来改名原则
- 公开英文名称统一为 Xintao Liu
- ACIDCH 限定为后台账号和技术代号
- 内部 URL 改为相对路径或集中生成
- 独立域名延后至网站成熟阶段

### V1.0

- 确定 Astro 静态网站架构
- 确定英文默认、中文 `/zh/`
- 确定 Data Aurora 视觉方向
- 将背景视频、图片、动态渐变、粒子网络全部纳入 V1
- 将个人 Logo、图标、表情、角色纳入 V1
- 将页面过渡和项目交互纳入 V1
- 将动态供应链网络纳入 V1
- 将 Design Lab 纳入 V1
- 明确 GitHub Pro / 学生权益到期不影响网站
- 明确 GitHub Free + Public Pages 为长期运行基础
