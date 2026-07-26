# Xintao Liu 作品集

[English](README.md) | [中文](README.zh-CN.md)

本仓库包含 Xintao Liu 的中英双语商业分析与供应链分析静态作品集。英文是默认语言，简体中文页面位于 `/zh/`。

本地实现已包括 Light/Dark/System 主题、可配置 Hero 背景、双语 Content Collections、可分享的项目筛选、使用合成数据的供应链网络演示、reduced-motion、SEO 元数据和 GitHub Pages 部署准备文件。

## 环境要求

- Node.js 22.12.0 或更高版本；当前项目基线为 Node.js 24
- npm 9.6.5 或更高版本
- Git

## 本地开发

```powershell
npm ci
npm run dev
```

## 验证

```powershell
npm run format:check
npm run check
npm run lint
npm run test
npm run build
```

`npm run build` 还会检查构建产物中的内部链接、核心文档语义与静态资源。生产构建结果生成在 `dist/`。

## 内容管理

项目位于 `src/content/projects/`，学习笔记位于 `src/content/notes/`。每组翻译使用相同的 `translationKey`，并分别建立英文和中文条目：

```yaml
translationKey: example-project
locale: en
slug: example-project
```

```yaml
translationKey: example-project
locale: zh
slug: example-project
```

标记为 `isPlaceholder: true` 或 `isDemo: true` 的内容不得作为已经完成或已经核实的真实成果展示。

## 集中配置

- 站点、语言、技术账号和仓库 owner：`src/config/site.ts`
- 公开个人资料占位：`src/config/profile.ts`
- 导航：`src/config/navigation.ts`
- 路径和 URL helper：`src/utils/paths.ts` 与 `src/utils/urls.ts`

不要在组件和内容文件中重复写入技术账号或完整技术 URL。

## 背景素材

Hero 默认使用 CSS Aurora 模式。Image、Video、Aurora 与 Network 模式在 `src/config/site.ts` 中集中选择。当前图片与视频 poster 是可替换的自制占位素材，仓库未加入未经确认的个人视觉素材。

## 隐私

本仓库按未来公开仓库设计。加入个人、雇主、学校或项目资料前，请先阅读 `SECURITY.md`。不得提交私人联系方式、密钥、受限制课程内容或未经确认的项目结果。

## 部署准备

GitHub Pages 工作流已准备在 `.github/workflows/deploy.yml`。启用与迁移说明见
[`docs/deployment/GITHUB_PAGES.md`](docs/deployment/GITHUB_PAGES.md) 和
[`docs/deployment/STATIC_HOST_MIGRATION.md`](docs/deployment/STATIC_HOST_MIGRATION.md)。

当前没有配置 Git remote，也没有执行 push、部署、域名绑定或付费服务操作。
