# Codex 精简自动执行策略

# Lightweight Autonomous Execution Policy

## 1. 目标

在保证质量的前提下，减少重复说明、阶段汇报、无关检查和 Codex Token 消耗。

执行依据：

1. `PROJECT_BRIEF.md`
2. `PROJECT_PLAN.md`
3. 本文件

除非出现真正阻塞，否则从 Phase 3 连续执行到 Phase 8 的本地准备完成，不逐阶段等待用户确认。

## 2. 每阶段最小流程

每个阶段只做以下事情：

1. 只读取 `PROJECT_PLAN.md` 中当前阶段相关部分，不重复通读或复述全部任务书。
2. 实施当前阶段。
3. 运行：
   - `npm run check`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
4. 若失败，自主修复并重试，最多两轮。
5. 全部通过后创建一个本地 Git commit，然后直接进入下一阶段。

`npm run format:check` 仅在格式化配置已存在时运行。

`npm audit` 和 `npm ci` 只在 Phase 8 最终验收时运行一次，不必每阶段重复。

## 3. 减少 Token 的规则

- 不在聊天中复述 `PROJECT_BRIEF.md` 或 `PROJECT_PLAN.md`。
- 不粘贴成功命令的完整日志。
- 成功时只记录 `PASS`。
- 失败时只读取和保留与错误有关的最后 40–80 行。
- 不逐文件解释代码。
- 不输出完整目录树。
- 不输出 `package-lock.json` 内容。
- 不为每个阶段生成长报告。
- 不生成非必要的状态文件、素材清单、许可证清单或截图。
- 只在最终阶段生成一份完整审核报告。

## 4. 允许自动处理

Codex 可以自行：

- 在现有 Astro 架构中实现计划要求；
- 使用轻量 CSS、SVG 和原生 JavaScript；
- 使用明确标记的占位内容或 demo 数据；
- 修复类型、格式、测试、构建和常见无障碍问题；
- 添加必要但不过量的测试；
- 创建每阶段本地提交。

不得虚构个人经历、联系方式、项目结果、中文姓名或真实商业数据。

## 5. 必须停止的情况

只有出现以下情况才停止并询问用户：

1. 需要创建或修改 Git remote。
2. 需要 `git push`、部署 GitHub Pages 或绑定域名。
3. 需要登录外部账号、付费或授予新权限。
4. 需要真实个人资料、简历、联系方式或正式项目结果，且无法用明确占位继续。
5. 需要删除大量文件、重写 Git 历史或执行不可逆操作。
6. 核心测试两轮修复后仍失败。
7. 需求与 `PROJECT_BRIEF.md` 或 `PROJECT_PLAN.md` 存在重大冲突。

阻塞时只生成：

```text
docs/reviews/BLOCKER_REPORT.md
```

报告只包含阻塞原因、已经尝试的修复和用户需要决定的问题。

## 6. 永久禁止的自动操作

没有用户明确授权时，禁止：

- 创建远程仓库；
- 添加或修改 remote；
- `git push`；
- 实际部署；
- 购买或绑定域名；
- 使用付费服务；
- 写入密钥或私人资料；
- 修改 `PROJECT_BRIEF.md`；
- 修改 `PROJECT_PLAN.md`；
- 使用 `git reset --hard`；
- 使用 `git clean -fdx`；
- 使用 `npm audit fix --force`。

## 7. 依赖与素材原则

- 优先使用已有依赖和原生实现。
- 只有确实必要时才新增依赖。
- 不主动升级框架或工具链主版本。
- 不使用 beta、RC 或 canary。
- 不引入远程 CDN、远程字体或付费素材。
- 不加入大型视频、图片或不明来源素材。
- 正式素材缺失时使用轻量、明确标记、可替换的占位内容。

无需为每个素材额外生成来源报告；只有实际引入外部素材时才记录来源。

## 8. 最终验收

完成 Phase 8 后停止，并运行一次最终检查：

```text
npm ci
npm run format:check
npm run check
npm run lint
npm run test
npm run build
npm audit
```

然后只生成：

```text
docs/reviews/FINAL_LOCAL_REVIEW.md
```

最终报告控制在约 2,500 中文字以内，包含：

- Phase 3–8 的完成状态和提交号；
- 最终测试结果；
- 已实现的主要功能和路由；
- 尚缺的真实资料或素材；
- 已知限制；
- Git 分支和工作区状态；
- 明确确认没有 remote、push、部署或域名操作。

视觉截图只在最终阶段提供 3–4 张关键页面，不逐阶段生成。

完成后在聊天中只回复：

1. `FINAL_LOCAL_REVIEW.md` 路径；
2. 最终测试 PASS/FAIL；
3. 是否存在阻塞问题。
