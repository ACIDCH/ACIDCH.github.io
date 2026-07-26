# 双语交互式个人作品集网站：实施规划与环境检查

> 项目所有者：Xintao Liu  
> 项目根目录：`D:\Github\ACIDCH.github.io`  
> 规划日期：2026-07-27  
> 规划依据：`PROJECT_BRIEF.md` V1.1  
> 当前阶段：项目规划与环境检查  
> 状态：等待用户确认后开始第一轮正式开发

---

## 1. 当前阶段执行范围

本轮只完成了只读环境检查、任务书审阅和实施规划。

本轮没有：

- 修改 `PROJECT_BRIEF.md`
- 创建网站代码
- 安装 npm 依赖
- 初始化本地 Git 仓库
- 创建远程 GitHub 仓库
- 配置 Git remote
- 执行 `git push`
- 部署 GitHub Pages

---

## 2. 环境检查结果

| 项目 | 检查结果 | 结论 |
| --- | --- | --- |
| 当前目录 | `D:\Github\ACIDCH.github.io` | 与指定项目根目录一致 |
| `PROJECT_BRIEF.md` | 存在，30,071 字节，UTF-8 无 BOM | 已完整读取，文件本身未损坏 |
| Git | `2.53.0.windows.3` | 可用 |
| Git 仓库 | 当前没有 `.git` | 该目录尚未初始化为本地仓库 |
| Node.js | `v24.18.0` | 已安装 |
| npm | `11.16.0` | 已安装 |
| Node/npm PATH | 当前终端无法直接识别 `node`、`npm` | `C:\Program Files\nodejs\` 未进入当前进程 PATH |
| GitHub CLI | 未找到 `gh` | 可选工具，不影响开发 |
| 当前目录内容 | 仅 `PROJECT_BRIEF.md` | 尚无网站代码或配置 |

Git 全局身份已配置为：

```text
Xintao Liu
212994513+ACIDCH@users.noreply.github.com
```

Node.js 和 npm 实际安装位置：

```text
C:\Program Files\nodejs\node.exe
C:\Program Files\nodejs\npm.cmd
```

正式开发前需要修复 PATH，或在当前终端临时加入：

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
```

完成后重新验证：

```powershell
git --version
node --version
npm --version
gh --version
```

`gh` 不存在时不需要中止开发。

---

## 3. Astro、Node.js 24 与 npm 11 兼容性

建议第一轮采用当前稳定的 **Astro 7.1.x**，并由 `package-lock.json` 固定实际安装的补丁版本。

截至规划日期：

- 当前 Astro npm 稳定版本为 `7.1.3`
- Astro 当前要求 Node.js `22.12.0` 或更高的受支持偶数版本
- 本机 Node.js 为 `24.18.0`
- 本机 npm 为 `11.16.0`
- npm 11.16.0 自身声明支持 `^20.17.0 || >=22.9.0`

结论：

- Node.js 24.18.0 适合 Astro 7
- npm 11.16.0 适合 Node.js 24 和 Astro 7
- 当前真正的环境阻塞项是 PATH，而不是版本兼容性

计划在 `package.json` 中加入：

```json
{
  "engines": {
    "node": ">=22.12.0"
  }
}
```

GitHub Actions 第一版明确使用 Node.js 24。Node.js 24 到达生命周期末期之前，应升级到届时仍受支持的新 LTS 版本。静态网站已发布的文件不会因本地 Node.js 版本到期而停止访问，但后续重新构建必须使用受支持的运行时。

参考资料：

- [Astro 安装与 Node.js 要求](https://docs.astro.build/en/install-and-setup/)
- [Astro 7 发布说明](https://astro.build/blog/astro-7/)
- [Astro npm 包](https://www.npmjs.com/package/astro)
- [Node.js 24 LTS](https://nodejs.org/en/blog/release/v24.11.0)

---

## 4. 需求冲突、技术风险和不合理依赖

### 4.1 公开名称冲突

任务书部分位置使用：

```text
Xin Liu / 刘鑫
xin-liu-resume-en.pdf
xin-liu-resume-zh.pdf
```

但任务书总原则和用户当前约束明确要求：

```text
公开展示名称必须使用 Xintao Liu
ACIDCH 只能作为 GitHub 技术账号
```

执行方案：

- 页面标题、Hero、Logo 文字版、SEO、结构化数据、项目封面统一使用 `Xintao Liu`
- `ACIDCH` 仅用于 GitHub username、仓库 owner、remote、Actions 和 Pages 技术地址
- 不在个人品牌 Logo、About 主标题或页面主标题中使用 `ACIDCH`
- 中文姓名版 Logo 暂缓，除非用户明确确认中文姓名可作为辅助名称公开展示
- 简历文件建议命名为：

```text
xintao-liu-resume-en.pdf
xintao-liu-resume-zh.pdf
```

### 4.2 项目 URL 字段与集中配置冲突

任务书要求项目具有 `github URL`，同时禁止在内容文件中分散硬编码 GitHub URL。

建议项目数据使用：

```ts
repoSlug?: string;
externalRepositoryUrl?: string;
```

普通 GitHub 项目通过统一方法生成：

```ts
getGitHubRepoUrl(repoSlug)
```

只有不属于当前 GitHub owner 的特殊仓库才允许使用完整外部 URL。

### 4.3 双语内容字段重复

任务书同时建议：

- `titleZh`
- `summaryZh`
- `language`
- 英文和中文使用独立 Markdown 文件

这会造成同一内容存在两套翻译来源。

建议每个内容条目只保存当前语言的数据：

```ts
translationKey: string;
locale: "en" | "zh";
title: string;
summary: string;
slug: string;
```

英文和中文条目通过相同 `translationKey` 配对。

### 4.4 404 路由与 GitHub Pages

GitHub Pages 的真正兜底文件应为站点根目录输出的：

```text
404.html
```

计划实现：

```text
src/pages/404.astro -> dist/404.html
```

`/zh/404/` 可以保留为中文显式页面，但不能代替根 `404.html`。

### 4.5 媒体体积风险

同时提交 WebM、MP4、poster、背景图片、项目截图和角色素材会快速增加仓库与发布站点体积。

控制措施：

- 背景视频保持短循环
- 限制分辨率、码率和文件大小
- WebM 优先，MP4 仅作兼容回退
- 不使用 Git LFS 托管 Pages 必需文件
- 设置单文件和总媒体预算
- 发布站点体积远低于 GitHub Pages 1 GB 限制
- 不依赖付费视频 CDN

### 4.6 Astro 图片处理风险

`public/` 中的图片会按原样复制，不经过 Astro 图片优化。

计划：

- 需要优化和生成响应式版本的图片放入 `src/assets/`
- 视频、PDF、`robots.txt` 和必须保持固定文件名的资源放入 `public/`
- Logo 可以保留为轻量 SVG

### 4.7 页面过渡生命周期风险

使用 Astro `ClientRouter` 后，客户端导航不会总是重新触发传统的 `DOMContentLoaded`。

所有交互组件需要：

- 支持首次加载
- 监听 `astro:page-load`
- 在换页前停止旧动画和监听器
- 避免重复绑定事件

### 4.8 多背景系统范围

Video、Image、Aurora 和 Network 都要求在 V1 中实现，但不应同时高负载运行。

计划由统一配置一次只启用一个主要背景：

```ts
heroBackground: "video" | "image" | "aurora" | "network"
```

Aurora 可作为其他模式加载前的低成本底层。

### 4.9 两种 Network 组件不能混用

- Hero Network：装饰性粒子或数据网络背景
- Supply Chain Network：具有业务字段和交互语义的供应链可视化

前者可使用轻量 Canvas；后者优先使用可访问、可标注的 SVG。

### 4.10 V1 范围风险

以下功能同时纳入 V1，工作量较大：

- 双语全部页面
- 四种背景
- 品牌和多版本 Logo
- 页面过渡
- 滚动动画
- 项目筛选
- 供应链网络
- Design Lab
- 五种角色状态
- SEO、性能和可访问性

应严格按阶段交付，每阶段通过构建与验收后再进入下一阶段。

---

## 5. 技术架构决策

### 5.1 总体架构

- Astro 静态站点输出
- TypeScript strict 模式
- Markdown 为主要内容格式
- 只在确有需要时启用 MDX
- Astro Content Collections 管理 projects 和 notes
- 原生 CSS 和 CSS custom properties
- Astro Islands/轻量原生脚本负责交互
- 不使用 React 或 Vue 全站 SPA
- 不使用后端数据库或登录系统
- GitHub Actions 构建静态产物
- GitHub Pages 托管

### 5.2 路径策略

统一配置：

```ts
siteUrl
basePath
githubUsername
githubProfileUrl
repositoryOwner
customDomain
```

统一 helper：

```ts
withBase(path)
getLocalizedPath(path, locale)
getGitHubRepoUrl(repoSlug)
getCanonicalUrl(path)
```

组件和内容文件不得重复硬编码：

```text
https://ACIDCH.github.io
https://github.com/ACIDCH
```

### 5.3 GitHub Pages 类型

如果最终仓库为：

```text
ACIDCH.github.io
```

则属于用户站点，计划配置：

```ts
site: "https://ACIDCH.github.io"
base: "/"
```

如果未来改为普通项目仓库，则只修改集中配置中的 `site` 和 `base`。

---

## 6. 分阶段实施计划

### Phase 0：环境修复与基线

任务：

1. 修复 Node/npm PATH
2. 重新验证 Git、Node、npm
3. 初始化本地 Git 仓库
4. 不创建远程仓库
5. 建立 `.gitignore`
6. 建立 Node 版本和安全基线
7. 保存首个本地基线提交

交付：

- 可正常使用 `node` 和 `npm`
- 本地 Git 仓库
- 无 remote
- `PROJECT_BRIEF.md` 保持原样

### Phase 1：Astro 基础架构

任务：

1. 创建 Astro 7 静态项目
2. 配置严格 TypeScript
3. 配置 `site`、`base` 和 URL helpers
4. 配置英文默认、中文 `/zh/`
5. 建立集中站点与个人资料配置
6. 建立 projects 和 notes Content Collections
7. 建立基础页面路由
8. 配置 build、check、lint、test

交付：

- Astro 可运行和构建
- 英文、中文基础路由可访问
- 内容 schema 可验证
- 缺失资料不会导致构建失败

### Phase 2：品牌、布局与主题

任务：

1. 创建原创 XL SVG Logo
2. 创建 favicon
3. 建立颜色、字体、间距和圆角 token
4. 实现 BaseLayout、Header、Footer
5. 实现 Light、Dark、System
6. 实现无闪烁主题初始化
7. 建立 Design Lab 基础预览

交付：

- 统一品牌基础
- 三态主题
- 中英文排版基线
- 可访问的主导航

### Phase 3：页面与双语内容框架

任务：

1. Home
2. Projects
3. Project Detail
4. Learning Notes
5. Note Detail
6. About
7. Skills
8. Resume
9. Contact
10. 404
11. Design Lab
12. 上述页面的中文版本
13. 语言对应路由
14. hreflang、canonical 和页面 metadata

交付：

- 所有规定路由存在
- 英文为默认语言
- 中文位于 `/zh/`
- 内容缺失时显示明确占位状态

### Phase 4：多背景 Hero

任务：

1. Aurora 背景
2. Image 背景
3. Video 背景
4. Network 背景
5. BackgroundController
6. 视频播放/暂停
7. poster 和加载 fallback
8. 移动端性能降级
9. 页面隐藏时暂停
10. reduced-motion 降级

交付：

- 四种模式均可通过配置选择
- 同一时间只运行一个主要背景
- 无正式素材时使用明确的自制或合法占位素材

### Phase 5：项目系统与供应链网络

任务：

1. ProjectCard
2. Tool、Topic、Status 筛选
3. URL 查询参数同步
4. 项目详情布局
5. 相关笔记
6. SupplyChainNetwork SVG
7. 优化前后切换
8. 最优路径和受限路径
9. 成本、容量、流量提示
10. demo 数据与真实数据适配器隔离

交付：

- 项目可以筛选和分享筛选 URL
- 空资源按钮不会产生空链接
- 供应链组件可使用键盘和屏幕阅读器理解
- demo 数据有明确标识

### Phase 6：动画与页面过渡

任务：

1. Astro ClientRouter
2. 页面淡入淡出
3. Logo 过渡
4. 项目封面共享元素过渡
5. Scroll reveal
6. Timeline 展开
7. Counter 动画
8. 轻量 card tilt
9. 主题和背景过渡
10. 页面加载进度提示
11. reduced-motion 全局控制

交付：

- 动画不会影响内容访问
- reduced-motion 下视频、粒子、tilt 和计数器停止
- 客户端换页后交互仍正常

### Phase 7：SEO、性能、可访问性与安全

任务：

1. Sitemap
2. robots.txt
3. Canonical
4. hreflang
5. Open Graph
6. Twitter/X metadata
7. Person、WebSite、CreativeWork 结构化数据
8. 图片和视频优化
9. 键盘、焦点和屏幕阅读器测试
10. 对比度检查
11. Lighthouse 检查
12. 内部链接检查
13. 私密数据和密钥检查

交付：

- 合理的 Lighthouse 结果
- 无明显无障碍阻塞
- 无密钥和私人数据
- 无失效内部链接

### Phase 8：部署准备

任务：

1. 编写 GitHub Pages Actions 工作流
2. 编写 `README.md`
3. 编写 `README.zh-CN.md`
4. 验证 `npm ci`
5. 验证 check、lint、test、build
6. 编写 Pages 设置说明
7. 编写迁移说明

当前约束下只准备文件，不执行：

- 远程仓库创建
- `git push`
- GitHub Pages 部署

---

## 7. 计划创建的目录与文件

```text
ACIDCH.github.io/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       └── deploy.yml
├── public/
│   ├── brand/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   ├── logo-light.svg
│   │   └── favicon.svg
│   ├── backgrounds/
│   │   ├── hero-video.webm
│   │   ├── hero-video.mp4
│   │   └── hero-poster.webp
│   ├── characters/
│   ├── resume/
│   │   ├── xintao-liu-resume-en.pdf
│   │   └── xintao-liu-resume-zh.pdf
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── backgrounds/
│   │   └── projects/
│   ├── components/
│   │   ├── background/
│   │   │   ├── BackgroundController.astro
│   │   │   ├── AuroraBackground.astro
│   │   │   ├── ImageBackground.astro
│   │   │   ├── NetworkBackground.astro
│   │   │   └── VideoBackground.astro
│   │   ├── brand/
│   │   │   └── Logo.astro
│   │   ├── content/
│   │   │   ├── ProjectCard.astro
│   │   │   ├── SkillGroup.astro
│   │   │   └── Timeline.astro
│   │   ├── interactive/
│   │   │   ├── ProjectFilters.astro
│   │   │   ├── SupplyChainNetwork.astro
│   │   │   └── MotionController.astro
│   │   ├── layout/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   ├── LanguageSwitch.astro
│   │   │   └── ThemeSwitch.astro
│   │   ├── seo/
│   │   │   └── SEOHead.astro
│   │   ├── CharacterState.astro
│   │   └── Hero.astro
│   ├── config/
│   │   ├── site.ts
│   │   ├── navigation.ts
│   │   ├── profile.ts
│   │   ├── skills.ts
│   │   └── experience.ts
│   ├── content/
│   │   ├── projects/
│   │   └── notes/
│   ├── data/
│   │   └── network/
│   │       └── demo.ts
│   ├── i18n/
│   │   ├── en.ts
│   │   ├── zh.ts
│   │   ├── routes.ts
│   │   └── utils.ts
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── ProjectLayout.astro
│   │   └── NoteLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── notes/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── about.astro
│   │   ├── skills.astro
│   │   ├── resume.astro
│   │   ├── contact.astro
│   │   ├── design-lab.astro
│   │   └── zh/
│   │       ├── index.astro
│   │       ├── projects/
│   │       │   ├── index.astro
│   │       │   └── [slug].astro
│   │       ├── notes/
│   │       │   ├── index.astro
│   │       │   └── [slug].astro
│   │       ├── about.astro
│   │       ├── skills.astro
│   │       ├── resume.astro
│   │       ├── contact.astro
│   │       └── design-lab.astro
│   ├── scripts/
│   │   ├── theme.ts
│   │   └── motion.ts
│   ├── styles/
│   │   ├── global.css
│   │   ├── themes.css
│   │   ├── motion.css
│   │   └── utilities.css
│   ├── utils/
│   │   ├── paths.ts
│   │   ├── urls.ts
│   │   └── seo.ts
│   └── content.config.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── .gitignore
├── astro.config.mjs
├── eslint.config.js
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
├── README.md
├── README.zh-CN.md
├── PROJECT_BRIEF.md
└── PROJECT_PLAN.md
```

---

## 8. 计划使用的 npm 依赖

### 8.1 必要生产依赖

```text
astro
@astrojs/sitemap
```

按需加入：

```text
@astrojs/mdx
```

只有在 Markdown 无法满足内容交互要求时才加入 MDX。

### 8.2 开发与验证依赖

```text
typescript
@astrojs/check
eslint
eslint-plugin-astro
typescript-eslint
prettier
prettier-plugin-astro
vitest
@playwright/test
```

### 8.3 明确不引入

- React/Vue 全站运行时
- Tailwind CSS，首版优先原生 CSS
- 大型粒子库
- 大型图形或流程图库
- 客户端主题框架
- 付费字体
- 付费主题
- 付费 CMS
- 必须订阅才能构建或运行的 API

---

## 9. 关键功能具体实现方案

### 9.1 英文默认、中文 `/zh/` 路由

Astro 配置：

```ts
i18n: {
  defaultLocale: "en",
  locales: ["en", "zh"],
  routing: {
    prefixDefaultLocale: false
  }
}
```

路由规则：

- 英文首页：`/`
- 英文内容：`/projects/`、`/notes/` 等
- 中文首页：`/zh/`
- 中文内容：`/zh/projects/`、`/zh/notes/` 等

内容配对：

```ts
translationKey: "inventory-optimisation";
locale: "en" | "zh";
```

语言切换流程：

1. 根据当前路由或内容条目获得 `translationKey`
2. 查找目标语言的对应条目
3. 存在则跳转到对应页面
4. 不存在则回退到目标语言首页
5. 显式切换后保存语言偏好

为了保持英文默认：

- 直接访问 `/` 始终显示英文
- 不根据浏览器语言静默重定向根路径
- 保存的语言偏好不破坏可分享的独立 URL

### 9.2 Light / Dark / System 主题

主题值：

```ts
type ThemePreference = "light" | "dark" | "system";
```

实现：

- 在 `<head>` 中使用极短内联脚本读取偏好
- 在首次绘制前设置 `data-theme`
- System 使用 `matchMedia("(prefers-color-scheme: dark)")`
- 监听系统主题变化
- 用户显式选择保存到 `localStorage`
- CSS custom properties 管理全部颜色

System 保存为 `system`，不保存成当时解析后的 `light` 或 `dark`。

### 9.3 Video、Image、Aurora 和 Network 多背景系统

统一配置：

```ts
hero: {
  background: "video" as "video" | "image" | "aurora" | "network",
  videoEnabled: true,
  networkEnabled: true
}
```

#### Video

- `<video muted loop playsinline>`
- WebM 优先
- MP4 fallback
- poster
- 显式播放/暂停按钮
- 页面隐藏时暂停
- 离开 Hero 视口时可暂停
- reduced-motion 时不自动播放
- 移动端按设备能力降级为 poster 或 Aurora

#### Image

- 正式图片优先放 `src/assets/`
- 使用 Astro 图片优化
- 响应式尺寸
- AVIF/WebP
- 主题遮罩保证文本对比度

#### Aurora

- 纯 CSS gradients
- 深色和浅色分别设置
- 低频率、低位移动
- 作为视频加载前和降级背景

#### Network

- 轻量 Canvas
- 根据视口与设备能力控制节点数
- 轻微鼠标响应
- 页面不可见时停止绘制
- reduced-motion 时完全关闭或显示静态 SVG

一次只激活一个主要模式，避免四种效果同时运行。

### 9.4 页面过渡与 reduced-motion

页面过渡使用 Astro `ClientRouter`：

- 页面淡入淡出
- Logo 共享元素
- 项目封面到详情页共享元素
- 浏览器不支持时安全回退

交互初始化：

```text
首次页面加载
astro:page-load
```

reduced-motion 同时通过 CSS 和 JavaScript 控制：

```css
@media (prefers-reduced-motion: reduce) {
  /* 关闭或缩短非必要动画 */
}
```

关闭：

- 视频 autoplay
- 粒子网络
- 卡片 tilt
- 数字递增
- 路线绘制动画
- 视差
- 长页面过渡

保留：

- 页面导航
- 内容阅读
- 筛选
- 主题和语言切换
- 键盘操作

参考：

- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)

### 9.5 Content Collections

使用 Astro 7 当前方式：

```text
src/content.config.ts
glob() loader
astro/zod schema
```

至少建立：

- `projects`
- `notes`

项目 schema 计划包含：

```ts
translationKey
locale
slug
title
summary
tools
status
featured
cover
repoSlug
reportUrl
dashboardUrl
updatedAt
tags
isDemo
```

构建时验证：

- locale 是否有效
- status 是否有效
- URL 是否为空或合法
- 日期是否有效
- 英文和中文是否存在重复 slug
- translationKey 是否能正确配对
- Planned 项目不能出现虚构结果字段

参考：

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)

### 9.6 交互式项目展示

项目正文保持静态 HTML。

客户端 JavaScript 只处理：

- Tool filter
- Topic filter
- Status filter
- Clear filters
- 结果数量
- URL 查询参数

筛选状态使用：

```text
?tool=python&topic=supply-chain&status=planned
```

这样可以：

- 分享筛选结果
- 使用浏览器返回
- 不依赖后端
- 不需要全站 hydration

没有资源时：

- 不生成空 `<a>`
- 可以隐藏按钮
- 或显示不可点击的 Coming Soon 状态

### 9.7 动态供应链网络组件

优先使用 SVG。

数据层：

```ts
type NetworkNode = {
  id: string;
  type: "supplier" | "warehouse" | "dc" | "market";
  label: string;
};

type NetworkEdge = {
  from: string;
  to: string;
  cost: number;
  capacity: number;
  flow: number;
  status: "optimal" | "restricted" | "normal";
};
```

功能：

- 节点逐步出现
- 路线 stroke 动画
- Hover/focus 显示信息
- 最优路径高亮
- 受限路径区分
- 成本、容量、流量
- 优化前后切换
- 图例
- 键盘可操作
- 屏幕阅读器使用同数据生成表格替代

数据隔离：

```text
src/data/network/demo.ts
未来真实项目数据 adapter
```

demo 数据必须包含：

```ts
isDemo: true
```

页面明确显示“Demonstration data / 演示数据”。

### 9.8 GitHub Pages 自动部署

计划工作流：

```text
checkout
  -> setup-node 24
  -> npm ci
  -> npm run check
  -> npm run lint
  -> npm run test
  -> npm run build
  -> upload-pages-artifact
  -> deploy-pages
```

工作流原则：

- 仅使用标准 GitHub-hosted runner
- 使用 GitHub 官方 Pages Actions
- 最小权限
- 不向 `master`/`main` 推送 `dist`
- 不依赖 `hexo deploy`
- 不保存长期部署密钥
- 使用 deployment concurrency 避免并行冲突

当前阶段只规划该文件，不部署。

---

## 10. GitHub Student 和 Pro 到期后的长期运行

基于当前 GitHub 政策：

- GitHub Free 支持公开仓库的 GitHub Pages
- 公开仓库使用标准 GitHub-hosted Actions 免费
- GitHub Pages 发布站点有 1 GB 大小限制
- GitHub Pages 有软带宽和构建频率限制

长期保障方案：

1. 网站仓库保持 Public
2. 使用 `ACIDCH.github.io` 用户站点形式
3. 不依赖私有仓库 Pages 权益
4. 不依赖 GitHub Pro
5. 不依赖 Student Developer Pack
6. 不依赖 Copilot
7. 不依赖 Codespaces
8. 不依赖 Azure 学生额度
9. 不依赖付费 API、CMS、字体或服务器
10. 网站输出为标准静态 HTML、CSS、JS
11. 构建不请求必须在线的第三方服务
12. 保持 Cloudflare Pages、Netlify 等静态平台迁移能力
13. 自定义域名不是网站唯一可访问入口
14. GitHub Pages 技术地址长期保留
15. 每年至少检查一次 GitHub 政策、Node LTS、Astro 和 Actions 版本

如果 2028 年 GitHub Student 和 GitHub Pro 到期：

- Public 仓库仍可使用 GitHub Free
- Pages 技术地址不依赖学生权益
- 公开仓库 Actions 不依赖 Pro 分钟
- 已发布静态文件不依赖 Node 常驻运行

无法保证第三方平台永不改变未来政策，因此代码必须保持可迁移。

参考：

- [GitHub Pages 限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub Actions 计费与使用](https://docs.github.com/en/actions/concepts/billing-and-usage)

---

## 11. 后续需要用户提供的资料

### 11.1 个人资料

- 是否允许公开显示中文姓名
- Professional email
- LinkedIn URL
- `ACIDCH` 是否为最终 GitHub username
- GitHub profile URL
- 可公开的英文个人简介
- 可公开的中文个人简介
- 准确教育日期
- 准确实习日期
- 可公开的雇主和岗位名称
- 经确认可公开的经历描述
- 技能是否需要显示熟练度及其依据

### 11.2 简历

- English resume PDF
- Chinese resume PDF
- 简历下载文件名偏好
- 哪些联系方式可公开

### 11.3 项目资料

- 三个项目的真实状态
- 项目仓库 URL 或 repo slug
- 项目截图
- 报告文件或公开链接
- Dashboard 链接
- 数据来源与使用许可
- 匿名化说明
- 真实方法
- 真实结果数字
- 真实限制与建议
- 可以公开的代码范围
- 哪些课程材料不得公开

### 11.4 视觉素材

- 正式头像
- 背景图片
- WebM/MP4 视频
- 或可用于制作视频的原始素材
- Logo 方向偏好
- 最终配色偏好
- 项目封面
- Open Graph 分享图偏好
- 是否保留个人小角色系统
- 角色风格偏好

### 11.5 后期决定

- 是否购买独立域名
- 域名预算和续费接受范围
- 是否把独立域名设为主要公开地址

---

## 12. 第一轮正式开发验收标准

第一轮只验收可持续开发基础，不要求完成完整 V1 视觉网站。

### 12.1 环境

- [ ] 普通新终端可以直接执行 `node --version`
- [ ] 普通新终端可以直接执行 `npm --version`
- [ ] Node.js 满足 Astro 要求
- [ ] npm 可正常安装锁定依赖
- [ ] Git 可用

### 12.2 Git

- [ ] 已初始化本地 Git 仓库
- [ ] 未创建远程 GitHub 仓库
- [ ] 未配置 remote
- [ ] 未执行 push
- [ ] `PROJECT_BRIEF.md` 未修改
- [ ] `.gitignore` 排除密钥、构建产物和本地缓存

### 12.3 Astro 基础

- [ ] Astro 7 项目创建完成
- [ ] `package-lock.json` 存在
- [ ] TypeScript strict 配置完成
- [ ] `npm run build` 通过
- [ ] `npm run check` 通过
- [ ] `npm run lint` 通过
- [ ] 基础测试通过

### 12.4 路由与双语

- [ ] 英文 `/` 可访问
- [ ] 中文 `/zh/` 可访问
- [ ] `/projects/` 可访问
- [ ] `/zh/projects/` 可访问
- [ ] 英文为默认语言
- [ ] 语言切换保持当前页面语义
- [ ] 缺少对应翻译时回退到目标语言首页
- [ ] 根 `404.html` 可以正确生成

### 12.5 内容

- [ ] projects Content Collection 可读取
- [ ] notes Content Collection 可读取
- [ ] schema 可以阻止无效内容
- [ ] 占位项目明确标记 Planned 或 In Development
- [ ] 不包含虚构项目结果
- [ ] 不公开课程原始答案

### 12.6 主题

- [ ] Light 可用
- [ ] Dark 可用
- [ ] System 可用
- [ ] 刷新后主题偏好保留
- [ ] 首次加载无明显主题闪烁

### 12.7 身份与路径

- [ ] `Xintao Liu` 是唯一公开英文展示名称
- [ ] `ACIDCH` 不出现在个人品牌标题或 Logo 中
- [ ] GitHub username 只在集中配置中出现
- [ ] 页面内部链接使用 helper 或相对路径
- [ ] 静态资源路径支持未来修改 `base`

### 12.8 隐私与缺失资料

- [ ] 无 API key
- [ ] 无密码
- [ ] 无私人地址和电话
- [ ] 无 References 联系方式
- [ ] 缺失简历不会产生 404 下载按钮
- [ ] 缺失邮箱、LinkedIn 不产生空链接
- [ ] Placeholder 有明确标识

### 12.9 文档

- [ ] README 说明本地运行
- [ ] README 说明构建
- [ ] README 说明添加英文和中文内容
- [ ] README 说明集中配置
- [ ] README 明确当前没有部署

---

## 13. 第一轮之后的完整 V1 验收方向

第一轮基础通过后，完整 V1 最终应满足：

- 英文和中文全部页面完整
- Light、Dark、System 完整
- Video、Image、Aurora、Network 四种背景可切换
- reduced-motion 正常
- 项目筛选与详情页正常
- Notes 列表与详情页正常
- 供应链网络组件正常
- Logo、favicon 和品牌系统完整
- Design Lab 可访问但不进入主导航
- SEO 和 hreflang 正确
- 手机端无横向滚动
- 键盘和屏幕阅读器可用
- 无虚构成果、密钥和私人数据
- GitHub Actions 配置有效
- 在用户明确授权后再完成远程创建、push 和部署

---

## 14. 当前结论

项目任务书整体可执行，推荐使用 Astro 7、TypeScript、Content Collections、原生 CSS、SVG 和轻量 JavaScript 实现。

开始正式开发前需要优先处理：

1. 修复 Node/npm PATH
2. 以 `Xintao Liu` 覆盖任务书中 `Xin Liu` 的公开展示冲突
3. 确定中文姓名是否允许作为辅助名称公开展示
4. 使用 `translationKey + locale` 统一双语内容模型
5. 使用集中 URL 配置和 `repoSlug`
6. 将根 `404.html` 作为 GitHub Pages 真正兜底
7. 严格控制视频和图片体积
8. 按阶段验收，避免 V1 范围失控

本规划确认后，第一轮正式开发从 **Phase 0：环境修复与基线** 和 **Phase 1：Astro 基础架构** 开始。
