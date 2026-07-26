# Xintao Liu 作品集

[English](README.md) | [中文](README.zh-CN.md)

本仓库包含 Xintao Liu 双语作品集的 Astro 静态基础框架。英文是默认语言，简体中文页面位于 `/zh/`。

第一阶段只提供简洁、可访问的占位页面。品牌视觉、主题切换、动态背景、动画和供应链可视化不属于本阶段。

## 环境要求

- Node.js 22.12.0 或更高版本；当前项目基线为 Node.js 24
- npm 9.6.5 或更高版本
- Git

## 本地开发

```powershell
npm install
npm run dev
```

## 验证

```powershell
npm run check
npm run lint
npm run test
npm run build
```

生产构建结果生成在 `dist/`。

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

标记为 `isPlaceholder: true` 的内容不得作为已经完成或已经核实的成果展示。

## 集中配置

- 站点、语言、技术账号和仓库 owner：`src/config/site.ts`
- 公开个人资料占位：`src/config/profile.ts`
- 导航：`src/config/navigation.ts`
- 路径和 URL helper：`src/utils/paths.ts` 与 `src/utils/urls.ts`

不要在组件和内容文件中重复写入技术账号或完整技术 URL。

## 隐私

本仓库按未来公开仓库设计。加入个人、雇主、学校或项目资料前，请先阅读 `SECURITY.md`。不得提交私人联系方式、密钥、受限制课程内容或未经确认的项目结果。

## 部署状态

第一阶段没有配置远程仓库，也没有进行部署。
