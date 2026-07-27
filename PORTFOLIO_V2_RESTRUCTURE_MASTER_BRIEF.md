# Xintao Liu Portfolio V2 — 整站重构执行说明

> 项目：Xintao Liu Portfolio  
> 本地目录：`D:\Github\ACIDCH.github.io`  
> 远程仓库：`ACIDCH/ACIDCH.github.io`  
> 当前状态：V1 已上线，现进行 V2 信息架构、移动端、视觉和内容系统重构  
> 公开名称：`Xintao Liu`  
> 技术账号：`ACIDCH`（仅用于 GitHub 和仓库技术配置）

---

## 1. 本轮目标

本轮不是推翻现有 Astro 网站，而是在保留当前可用功能的基础上完成以下升级：

1. 修复手机端菜单无响应、页面卡死和滚动锁异常。
2. 将主导航精简为四个入口。
3. 为项目和学习笔记详情页加入明确的返回入口。
4. 重构 Home，使其使用全屏风景背景和滚动进入内容的视觉体验。
5. 重构 About Me，使其采用“大背景 + 圆形头像 + 个人资料卡”的结构。
6. 将 Skills、Resume、Contact、Education、Experience 统一归入 About Me。
7. 扩展 Learning Notes 的标签、主题、工具、系列和关联内容系统。
8. 预留云笔记入口，但本轮不连接私人云盘账号。
9. 增加统一的社交与联系方式图标系统。
10. 将现有高饱和 Data Aurora 风格调整为更素雅、适合新西兰南岛风景照的视觉体系。
11. 保持双语、主题、项目筛选、供应链网络、SEO 和 GitHub Pages 部署功能正常。

---

## 2. 新的信息架构

### 顶部主导航

只保留：

```text
Home
Projects
Learning Notes
About Me
```

右侧全局工具：

```text
English / 中文
Light / Dark / System
```

搜索可在 Learning Notes 中先实现，不必作为全站导航按钮。

### 旧路由兼容

原有页面不要直接变成失效链接，应重定向或跳转到 About Me 对应锚点：

```text
/skills/   → /about/#skills
/resume/   → /about/#resume
/contact/  → /about/#contact

/zh/skills/   → /zh/about/#skills
/zh/resume/   → /zh/about/#resume
/zh/contact/  → /zh/about/#contact
```

---

## 3. 第一优先级：手机端 Bug 修复

目前真实问题包括：

- 点击 Menu 无反应；
- 菜单打开后页面可能卡死；
- 页面无法继续滚动；
- Astro 客户端切换页面后菜单状态失效；
- 背景滚动锁可能残留。

必须修复：

1. 点击 Menu 稳定打开和关闭。
2. 打开菜单时锁定背景滚动。
3. 关闭菜单时恢复原滚动位置。
4. 点击导航后自动关闭。
5. 点击遮罩后关闭。
6. 按 Escape 后关闭。
7. 关闭后焦点返回 Menu 按钮。
8. Astro 客户端页面切换后重新初始化。
9. 不重复绑定事件。
10. 页面离开或组件销毁时清理滚动锁和监听器。
11. 不得残留 `overflow: hidden` 导致页面永久卡住。
12. iPhone Safari、Android Chrome 和 375–390px 视口均应正常。

移动菜单打开时：

- 背景不可点击；
- 背景不能滚动；
- 遮罩覆盖完整视口；
- 菜单自身内容过长时允许内部滚动。

---

## 4. 返回导航

不能只依赖浏览器原生返回键。

增加统一的上下文返回组件：

```text
项目详情页       → Back to Projects / 返回项目列表
学习笔记详情页   → Back to Learning Notes / 返回学习笔记
标签结果页       → Back to All Notes / 返回全部笔记
About 深层锚点   → Back to About / 返回关于我
```

实现原则：

1. 浏览历史有效时可以优先返回上一页。
2. 用户从外部链接直接进入时，使用固定父级路由作为 fallback。
3. 手机端正文顶部必须清晰可见。
4. 使用统一 Back 图标和中英文标签。
5. 不使用无意义的 `href="#"`。

---

## 5. Home 重构

### 5.1 全屏 Hero

首屏高度约为：

```text
100svh
```

使用可替换的南岛风景背景图，例如：

- Aoraki / Mount Cook
- Lake Wānaka
- Queenstown
- South Island mountain and lake landscapes

建议结构：

```text
Xintao Liu

Business Analytics · Supply Chain

Data, models and decisions in context.

[Explore Projects] [View Learning Notes] [About Me]
```

要求：

- 背景图片全屏铺满；
- 文字必须保持高对比度；
- 使用轻度遮罩，不把照片强行染成蓝青色；
- 背景路径、遮罩强度和 `object-position` 集中配置；
- 桌面和手机支持不同裁切；
- 向下滚动时可以轻微缩放、位移或淡出；
- `prefers-reduced-motion` 下保持静态；
- 手机端不强制加载大型视频。

### 5.2 Home 下方仅保留

1. Featured Projects
2. Latest Learning Notes
3. Core Themes / Capability Keywords
4. Final CTA

从主页移除：

```text
Education & Experience
Skills
Resume
Contact
```

所有个人信息移入 About Me。

---

## 6. About Me 重构

参考结构：

```text
大幅风景背景
→ 圆形职业头像悬浮在背景和内容卡之间
→ 大型个人资料卡
→ About / Education / Experience / Skills / Resume / Contact
```

不复制参考博客的橙色配色和内容，只借鉴结构。

### 6.1 About Hero

- 半屏或接近半屏的风景背景；
- 标题：`About Me`；
- 一句简短职业表达；
- 使用与 Home 相协调但不同的风景照片；
- 遮罩适度，不破坏自然色彩。

### 6.2 圆形职业头像

- 居中；
- 跨越背景与资料卡的边界；
- 圆形裁切；
- 细边框或轻微阴影；
- 适配浅色和深色主题；
- 后续只替换图片文件即可；
- 没有正式头像时使用 XL 占位，不生成虚构人物照片。

建议路径：

```text
public/profile/portrait.webp
```

### 6.3 资料卡顶部

显示：

```text
Xintao Liu
Business Analytics · Supply Chain · Decision Support
Auckland, New Zealand
Short professional introduction
```

未确认的个人信息不得虚构。

### 6.4 About 内部区块

按以下顺序：

1. About
2. Education
3. Experience
4. Skills & Tools
5. Resume
6. Contact

增加页面内导航：

```text
About | Education | Experience | Skills | Resume | Contact
```

缺失内容：

- Resume 不存在时显示 `Resume coming soon / 简历正在整理中`；
- 未提供邮箱、LinkedIn 等信息时隐藏对应入口；
- 不生成空按钮和假链接。

---

## 7. About 头像下方的社交与联系入口

建议顺序：

```text
GitHub | LinkedIn | Email | WeChat | Resume
```

### GitHub

- 当前可启用；
- 从集中配置读取；
- 点击新标签页打开 GitHub Profile。

### LinkedIn

- 先实现图标和配置字段；
- 没有真实链接时隐藏。

### Email

- 只在提供公开职业邮箱后启用；
- 不生成假邮箱；
- 使用 `mailto:`。

### WeChat

点击图标后打开二维码弹窗或浮层：

- 显示微信二维码；
- 可选显示微信号；
- 显示中英文提示；
- 支持关闭按钮；
- 支持 Escape 关闭；
- 关闭后焦点返回微信按钮；
- 手机端尺寸合适；
- 没有二维码时隐藏或显示 Coming soon。

建议路径：

```text
public/contact/wechat-qr.webp
```

### Resume

建议路径：

```text
public/resume/xintao-liu-resume-en.pdf
public/resume/xintao-liu-resume-zh.pdf
```

文件不存在时不产生失效下载链接。

### 集中配置

所有社交链接、启用状态、二维码路径和简历路径必须集中维护，例如：

```ts
export const contactLinks = {
  github: {
    enabled: true,
    url: "https://github.com/ACIDCH",
  },
  linkedin: {
    enabled: false,
    url: "",
  },
  email: {
    enabled: false,
    address: "",
  },
  wechat: {
    enabled: false,
    id: "",
    qrImage: "/contact/wechat-qr.webp",
  },
  resume: {
    enabled: false,
    en: "/resume/xintao-liu-resume-en.pdf",
    zh: "/resume/xintao-liu-resume-zh.pdf",
  },
};
```

建议组件：

```text
SocialLinks.astro
SocialIconButton.astro
WechatQrDialog.astro
```

---

## 8. 图标系统

用户暂时不需要自己制作图标。

使用统一、轻量的内联 SVG 线性图标：

```text
Home
Projects
Learning Notes
About
Back
Tag
Topic
Tool
Calendar
Search
Menu
Close
GitHub
LinkedIn
Email
WeChat
Resume
Download
External link
Language
Theme
```

要求：

- 统一线宽；
- 圆角几何；
- 深浅主题适配；
- 不安装大型图标库；
- 图标按钮有 `aria-label`；
- 不以 Emoji 作为主要 UI 图标语言；
- 外部链接使用：

```html
target="_blank" rel="noopener noreferrer"
```

---

## 9. Learning Notes 重构

### 9.1 Learning Notes 首页

增加：

- Search
- Tags
- Topics
- Tools
- Series
- Latest Notes
- Related Projects
- External Notebook / Cloud Notes

示例标签：

```text
Supply Chain
Optimisation
Python
R
SQL
Excel
Power BI
Simulation
Database
Project Management
```

### 9.2 Note Metadata

每篇笔记支持：

```yaml
translationKey:
locale:
title:
summary:
tags:
topics:
tools:
series:
relatedProjects:
relatedNotes:
status:
updatedAt:
```

### 9.3 标签导航

采用一种一致方案，例如：

```text
/notes/?tag=optimisation
/zh/notes/?tag=optimisation
```

或独立标签路由，但中英文必须一致。

### 9.4 笔记详情页底部

显示：

```text
Related Notes
Related Projects
Back to Learning Notes
```

### 9.5 云笔记入口

本轮只预留一个可配置入口：

```text
External Notebook / Cloud Notes
```

要求：

- 没有公开链接时隐藏；
- 未来只选择一个来源：Google Drive、OneDrive 或 OneNote；
- 本轮不连接私人账号；
- 不在前端保存 OAuth、Token 或密钥；
- 不实时同步私人笔记。

未来可选工作流：

```text
云笔记
→ 本地同步脚本
→ Markdown
→ src/content/notes
→ 审核
→ commit / deploy
```

---

## 10. 双语策略

继续保留正式双语静态路由：

```text
English: /
中文: /zh/
```

不要使用浏览器 Google 翻译作为网站正式语言系统。

高效流程：

```text
先完成一种语言
→ AI 生成另一语言草稿
→ 使用术语表保持专业词汇
→ 人工检查重要页面
→ 发布为两个静态版本
```

维护术语表，例如：

```text
Business Analytics → 商业分析
Supply Chain Management → 供应链管理
Inventory Optimisation → 库存优化
Sensitivity Analysis → 敏感性分析
Decision Variable → 决策变量
Objective Function → 目标函数
```

关键页面必须人工确认；长篇笔记可以标记为机器辅助翻译待校对。

---

## 11. 新视觉方向：Southern Alpine Minimal

将现有高饱和 Data Aurora 调整为更素雅、适合南岛风景照片的：

```text
Southern Alpine Minimal
南岛高山极简风
```

核心特征：

- 安静；
- 留白；
- 自然；
- 专业；
- 编辑式；
- 让照片成为主角，UI 不抢画面。

### 11.1 浅色主题

建议：

```text
背景             暖米白
卡片             柔和纸白
主文字           深炭灰
次文字           灰石色
边框             暖灰
强调色           低饱和湖蓝
辅助色           苔绿
温暖辅助色       沙石棕
```

### 11.2 深色主题

建议：

```text
背景             深炭黑
卡片             深岩石灰
主文字           暖白
次文字           银灰
强调色           柔和湖蓝
辅助色           灰绿色
温暖辅助色       克制的岩石金
```

减少或移除：

- 亮青色霓虹；
- 大面积蓝紫渐变；
- 强发光；
- 过度玻璃拟态；
- 每个页面都像技术 Dashboard 的视觉。

### 11.3 图片处理

- 保留照片自然色彩；
- 只加轻度深色或暖色遮罩；
- 不强制染成蓝青色；
- 每张图片允许单独配置遮罩和 `object-position`；
- 动效仅使用轻微缩放、位移和淡入；
- reduced-motion 下关闭。

### 11.4 页面分工

```text
Home       → 代表性南岛风景全屏图
About Me   → 有个人情绪价值的旅行或风景图
Projects   → 项目封面、图表、Dashboard、模型图
Notes      → 干净的知识库和编辑式排版
```

不要把每个页面都做成旅行博客。

保留：

- XL Logo；
- Astro 架构；
- 双语路由；
- 项目筛选；
- 供应链网络；
- Light / Dark / System；
- reduced-motion。

只进行视觉重构，不无意义地重建功能。

---

## 12. 素材路径与替换机制

### 职业头像

```text
public/profile/portrait.webp
```

建议原图：

- 正面或轻微侧面；
- 肩部可见；
- 背景简单；
- 至少 1200 × 1200；
- 不使用重度美颜。

### Home 背景

```text
public/backgrounds/home-hero-desktop.webp
public/backgrounds/home-hero-mobile.webp
```

建议尺寸：

```text
桌面：约 2400 × 1350
手机：约 1080 × 1600
```

### About 背景

```text
public/backgrounds/about-hero.webp
```

建议尺寸：

```text
约 2400 × 1000 或更高
```

### 微信二维码

```text
public/contact/wechat-qr.webp
```

### 项目封面（可选）

```text
public/projects/project-inventory.webp
public/projects/project-transportation.webp
public/projects/project-dashboard.webp
```

所有路径、遮罩强度、图片位置、启用状态必须集中配置。以后用户只需替换文件或配置值。

在正式素材未提供前：

- 使用轻量、合法、可替换占位；
- 不下载未知来源旅游图片；
- 不虚构人物照片；
- 不因缺素材阻塞结构开发。

---

## 13. 推荐执行顺序

### Stage 1 — Critical Mobile Fixes

- 修复菜单；
- 修复滚动锁；
- 修复 Astro 页面切换后的交互；
- 增加返回组件。

### Stage 2 — Information Architecture

- 导航精简为四项；
- Skills、Resume、Contact 合并入 About；
- 旧路由跳转；
- Home 移除 Education & Experience。

### Stage 3 — Visual Tokens

- 将 Data Aurora 调整为 Southern Alpine Minimal；
- 重设颜色、阴影、边框和按钮；
- 保留三态主题逻辑。

### Stage 4 — Home & About

- 全屏 Home Hero；
- 滚动过渡；
- About 背景；
- 圆形头像；
- 资料卡；
- 内部锚点导航；
- 社交和微信二维码弹窗。

### Stage 5 — Learning Notes

- Search；
- Tags；
- Topics；
- Tools；
- Series；
- 关联 Notes / Projects；
- Cloud Notes 配置入口。

### Stage 6 — Icons & Final Polish

- 内联 SVG 图标；
- 响应式检查；
- 主题检查；
- reduced-motion；
- 双语；
- 旧路由；
- 部署验证。

---

## 14. 测试与验收

必须运行：

```text
npm run format:check
npm run check
npm run lint
npm run test
npm run build
```

浏览器验证：

1. 手机菜单可靠打开和关闭。
2. 关闭后页面不会继续卡死。
3. 客户端切换页面后 Menu 仍工作。
4. 所有返回按钮有效。
5. Home 和 About 背景加载正常。
6. 手机端无横向滚动。
7. Light / Dark / System 正常。
8. 中英文路由正常。
9. 旧 Skills / Resume / Contact 路由不会 404。
10. 微信弹窗键盘操作正常。
11. 未配置链接不会产生空入口。
12. 控制台无应用错误。
13. reduced-motion 下内容仍可正常读取。
14. 构建和部署不破坏已有 Pages 地址。

---

## 15. 范围限制

不得：

- 虚构个人资料；
- 虚构联系方式；
- 虚构项目结果；
- 把 Demo 写成真实成果；
- 直接连接私人云盘；
- 写入 OAuth 或密钥；
- 添加付费服务；
- 安装大型图标库；
- 使用未经许可的旅游照片；
- 复制参考博客的具体内容、颜色或品牌；
- 删除有效旧路由而不做兼容；
- 为重构而重写整个 Astro 项目；
- 在手机 Bug 修复前只做表面视觉修改。

---

## 16. Git 与部署

本轮允许：

1. 修改当前本地仓库。
2. 完成全部测试。
3. 创建清晰的本地提交。
4. 推送 `main`。
5. 触发现有 GitHub Actions。
6. 验证网站更新。

禁止：

- 新建其他远程仓库；
- 改变 Pages Source；
- 绑定自定义域名；
- 使用付费服务；
- 修改 GitHub 账号其他设置；
- 重写 Git 历史。

如果正式素材尚未提供，使用占位完成结构并部署，之后可继续替换素材和内容。
