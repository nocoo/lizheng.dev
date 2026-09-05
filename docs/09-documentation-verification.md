# 09 — 文档阶段核验

日期：2026-09-05。阶段：M0 已完成。基线源码：bf23331。本文件仅保留内容抽取/归档审计事实，不作为当前工程状态；最新结果见 11。

## 已完成的研究与设计

- 读取四个线上语言页面的 HTML，与当前数据、模板、脚本逐项核对；全部可见数据字段和 description 一致，记录抓取哈希。
- 提取两份完整简历和两份入口内容，包括 frontmatter；另外保存控件、元信息、图片、链接和运行时文案差异。
- 原有 docs/design 的 8 个文件整体移动到 archive，原始内容不变；当前 CLAUDE.md 明确禁止主动读取/检索过期资料。
- 完整记录 12 类旧博客 301 规则、域名边界、查询参数、处理顺序、真实 HTTP 回归和 sitemap 冲突。
- 分别设计正式简历与实体掌机落地页：内容组织、字体、材质、主题、响应式、交互、动画、渐进增强与验收。
- 查询 nmem 的 6DQ 原规范，记录来源 ID，形成 Husky、TDD、隔离、静态/安全/性能与浏览器测试计划。
- 查询最新依赖及 peer 范围；发现 Astro checker 对 TS7 的声明缺口，选择 React/Vite/TS7 静态预渲染架构。
- 明确后续原子提交顺序、已有 CI 自动部署的影响、切换与回滚要求。

## 本阶段检查

| 检查 | 本次结果 |
| --- | --- |
| Markdown 格式 | markdownlint-cli2 0.23.2：18 份活跃 Markdown，0 issues |
| Markdown 链接与文件结束换行 | 18 份活跃文档全部通过 |
| 内容完整性 | 四份原始数据中的全部公开字段均有对应内容；每份简历 6 章节、13 条经历、4 社交链接；每份入口 4 链接 |
| 归档完整性 | 8 个原文件移动前后 SHA-256 全部相同 |
| Biome | bun run lint：17 个受检文件，0 error / warning |
| TypeScript | bun run typecheck：通过现有项目检查 |
| L1 与现有覆盖率门禁 | bun run test:coverage：2 个文件、53 个测试全部通过；覆盖率口径仍只包含旧 build.js |
| Git whitespace | git diff --check 通过 |
| Husky 安装 | bun run prepare 完成；core.hooksPath 为 .husky/_ |

Markdown 检查配置保存在根目录 .markdownlint-cli2.jsonc，显式排除 archive。MD013 不限制原文长段落行长，MD024 允许原文两条同济教育记录使用相同标题；其余默认规则执行。它们是文档格式约定，不改变代码 G1 的零 error / warning 要求。

本阶段只修改文档、项目指导文件与 Markdown 检查配置；没有改写生产 UI、依赖版本、301 代码或测试实现。Husky 使用现有 pre-commit 检查本次提交，完整新 6DQ 门禁将在 M1 实现。

## 当前状态

M0 的后续实现、跨浏览器测试和生产切换已经展开并完成首版发布。原阶段的 53 个测试与旧 builder 覆盖率仅为历史审计记录，不代表现行覆盖率；新逻辑、真实 HTTP、浏览器与部署证据见 11。
