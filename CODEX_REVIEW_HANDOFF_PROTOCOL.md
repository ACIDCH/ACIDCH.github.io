# Codex 阶段审核交接协议
# Codex Phase Review Handoff Protocol

> 用途：让 Codex 在每个开发阶段结束时生成一份简洁、可上传给 ChatGPT 审核的 Markdown 文件，减少复制长对话和无关日志。

## 1. 文件命名

每个阶段结束时，在项目中生成：

```text
docs/reviews/PHASE_XX_REVIEW.md
```

示例：

```text
docs/reviews/PHASE_01_REVIEW.md
docs/reviews/PHASE_02_REVIEW.md
```

仅当测试失败且简短摘要不足以诊断时，额外生成：

```text
docs/reviews/PHASE_XX_FAILURE_LOG.txt
```

不要默认保存完整安装日志、构建日志或全部终端输出。

## 2. 节省 Token 的规则

Codex 必须：

1. 不重复 PROJECT_BRIEF.md 或 PROJECT_PLAN.md 的原文。
2. 只报告本阶段实际执行的变化。
3. 不粘贴完整 `npm install`、`npm ci`、lint、test 或 build 日志。
4. 成功命令只写“命令 + 结果 + 耗时（如有）”。
5. 失败命令只保留错误核心和最后 40–80 行相关输出。
6. 不逐文件解释所有源码，只列出重要文件及用途。
7. 不输出 `package-lock.json` 内容。
8. 不输出完整目录树；仅列出新增或修改的重要目录。
9. 不重复解释已经确认的技术方案。
10. 报告以 1,500 中文字左右为目标；复杂阶段最多约 2,500 中文字。

## 3. 审核报告模板

```markdown
# Phase XX Review

## 1. Scope

- 执行的 Phase：
- 本轮未执行：
- 是否修改 PROJECT_BRIEF.md：No
- 是否修改 PROJECT_PLAN.md：No
- 是否创建 remote：No/Yes
- 是否 push：No/Yes
- 是否部署：No/Yes

## 2. Environment

| Tool | Version | Path/Status |
|---|---:|---|
| Git | | |
| Node.js | | |
| npm | | |
| Astro | | |

## 3. Changes

### Created

- `path/to/file` — 一句话用途

### Modified

- `path/to/file` — 一句话说明

### Deleted

- None

## 4. Architecture Decisions

只列出本阶段新做出的决定或对原计划的必要偏差：

- 
- 

## 5. Routes and Features Implemented

| Route / Feature | EN | ZH | Status |
|---|---|---|---|
| `/` | Yes | N/A | Pass |
| `/zh/` | N/A | Yes | Pass |

## 6. Validation Results

| Command | Result |
|---|---|
| `npm run check` | PASS / FAIL |
| `npm run lint` | PASS / FAIL |
| `npm run test` | PASS / FAIL |
| `npm run build` | PASS / FAIL |

失败时仅附核心错误摘要；完整日志另存为 failure log。

## 7. Git Summary

```text
git status --short:
...

latest commits:
...
```

列出：

- 当前分支
- 是否 clean
- 最近 1–3 个本地提交
- 是否存在 remote
- 是否执行 push

## 8. Acceptance Checklist

仅列出本阶段验收项：

- [x] 
- [ ] 

## 9. Deviations and Risks

- 与 PROJECT_PLAN.md 的偏差：
- 尚存风险：
- 需要用户决定的事项：

## 10. Files for Reviewer

审核者最需要查看的文件：

1. `...`
2. `...`
3. `...`

## 11. Next Recommended Phase

- 下一阶段：
- 开始前需要用户确认：
```

## 4. Codex 阶段结束指令

在每个阶段开发完成后，向 Codex 发送：

```text
本阶段开发完成后，请不要在聊天中粘贴冗长日志。

请按照项目中的审核交接协议生成：
docs/reviews/PHASE_XX_REVIEW.md

要求：

1. 不重复 PROJECT_BRIEF.md 和 PROJECT_PLAN.md。
2. 只总结本阶段实际变更、测试结果、Git 状态、偏差、风险和待确认事项。
3. 成功测试不要粘贴完整日志，只写 PASS 和必要版本信息。
4. 失败测试只在报告中保留核心错误摘要；确有需要时把相关日志最后 40–80 行写入：
   docs/reviews/PHASE_XX_FAILURE_LOG.txt
5. 列出新增和修改的重要文件，但不要输出完整源码或 package-lock.json。
6. 包含 `git status --short`、最近 1–3 个本地提交和 remote/push/deploy 状态。
7. 报告尽量控制在 1,500 中文字左右，复杂阶段最多约 2,500 中文字。
8. 报告生成后重新运行必要检查，确认报告文件没有破坏 build。
9. 不创建远程仓库、不 push、不部署，除非本轮已得到明确授权。
10. 在聊天中只回复：
   - 报告文件路径
   - 四项测试 PASS/FAIL
   - 是否有阻塞问题
```

将 `PHASE_XX` 替换为当前阶段，例如 `PHASE_01`。

## 5. 提交给 ChatGPT 的方式

优先方式：

- 直接上传 `PHASE_XX_REVIEW.md`
- 若存在失败，再同时上传 `PHASE_XX_FAILURE_LOG.txt`

不需要上传：

- `node_modules`
- `dist`
- `package-lock.json`
- 完整项目压缩包
- Codex 全部聊天记录
- 完整 npm 安装日志

若报告非常短，也可以直接复制报告全文到聊天中。

## 6. 视觉阶段的附加材料

Phase 2 及后续视觉开发阶段，除 Markdown 报告外，可附：

- 英文首页桌面截图
- 中文首页桌面截图
- 手机端截图
- Design Lab 截图

每轮最多提供 3–4 张关键截图，避免提交大量重复画面。
