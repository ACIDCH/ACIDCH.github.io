# 数据分析项目集

[English](README.md) | [中文](README.zh-CN.md)

本仓库用于维护基于 Astro 的中英双语数据分析项目集，并通过 GitHub Pages 发布。当前内容策略以中文为主版本：先完成中文页面、项目说明和 Learning Notes，再依据同一套内容模型维护对应英文版本。

站点已包含 Light/Dark/System 主题、双语 Content Collections、全局搜索、Projects 与 Learning Notes 路由、reduced-motion、SEO 元数据、隐私检查和 GitHub Pages 自动部署。

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
npm run audit:i18n-sync:strict
npm run build
npm run audit:i18n-final
```

CI 在部署前还会执行公开内容隐私与安全检查。生产构建结果生成在 `dist/`，并由 `.github/workflows/deploy.yml` 发布。

## 内容管理

项目位于 `src/content/projects/`，Learning Notes 位于 `src/content/notes/`。同一篇中文和英文内容使用相同的 `translationKey`：

```yaml
translationKey: example-project
locale: zh
slug: example-project
```

```yaml
translationKey: example-project
locale: en
slug: example-project
```

当前作品集只保留已经完成并能够核实的项目。后续会根据新的课程成果和实际完成的分析项目继续增加内容，不再长期保留“以后可能会做”的项目占位页。

## 双语工作流

现阶段中文作为主要编辑版本。已经公开的中英文内容会检查路由、搜索、sitemap、元数据、结构以及代码、公式、URL、数字等受保护内容的一致性。

`.github/workflows/i18n-translation.yml` 用于生成英文第一版翻译 Draft PR。代码、公式、URL、数字和结构标记在翻译过程中受到保护；自动生成的英文仍需进行语义和编辑审核后才能合并上线。

## 集中配置

- 站点、语言、技术账号和仓库设置：`src/config/site.ts`
- 公开个人资料配置：`src/config/profile.ts`
- 图片、社交、简历和外部笔记入口开关：`src/config/portfolio.ts`
- 导航：`src/config/navigation.ts`
- 路径和 URL helper：`src/utils/paths.ts` 与 `src/utils/urls.ts`

## 隐私

本仓库为公开仓库。加入个人、雇主、学校或项目资料前，请先阅读 `SECURITY.md`。不得提交私人联系方式、密钥、受限制课程材料或未经确认的项目结果。

## 部署

站点通过仓库现有 CI/CD 工作流发布至 GitHub Pages。流水线会在部署前验证当前 commit，并在部署后再次确认线上版本。当前未配置自定义域名或付费托管服务。
