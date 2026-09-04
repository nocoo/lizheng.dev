# 08 — 实施阶段与原子提交

M0 文档已完成，当前已进入两站设计预览。用户最新要求先完成视觉效果并快速迭代，定稿后再收紧质量；以 10 的实际状态与执行顺序为准。以下表格保留为完整重构的工作清单，不再要求先完成 M1b 才开发视觉。

## 提交原则

在 main 上按一个可解释行为/模块一次提交。设计预览阶段保留基本检查和旧回归，按需用浏览器验证设计与交互；定稿后的逻辑与门禁实施恢复 Red/Green/Refactor。不提交失败 main、不跳过 Husky、不用大规模“最终整理”替代持续零 lint。

不重用旧 UI 或代码。旧应用在新构建验收通过前继续作为生产版本；只有 301 行为/回归断言与公开事实、原始人像可继承。

## 阶段与原子提交边界

| 阶段 | 建议提交主题与文件 | 先写验证 | 完成条件 |
| --- | --- | --- | --- |
| M0 | docs: archive legacy designs and define rebuild baseline；CLAUDE.md、README.md、docs/ | 文档验收清单、内容/链接/归档核对 | 本阶段报告与绿色文档提交 |
| M1a | chore: establish TS7 React Vite toolchain；工作区、package.json、bun.lock、tsconfig、Vite | 最小 TS/TSX 构建和类型失败 fixture | 精确版本、peer 相容、无 warning，生产入口未切换 |
| M1b | chore: enforce 6dq gates with husky；.husky、scripts/gate-*、测试配置、CI | gate runner / 隔离 guard 故障注入 | L1/G1、L2/G2、L3 分层入口及失败阻断可验证 |
| M2a | feat: compile public markdown content；packages/content、tests/unit/content | C01–C04 | 完整四文档模型、强 schema、公开 allowlist |
| M2b | feat: preserve legacy redirects and host routing；worker、tests/unit/routing | R01–R03、真实 HTTP 案例 | 301 精确回归、sitemap 冲突和内部路径保护 |
| M3a | feat: render accessible résumé document；apps/resume、publishing | DEV-CONTENT、NOJS、PRINT | 新排版、所有正文、可打印身份与全文 |
| M3b | feat: add résumé themes and responsive reading；theme/locale、样式 | T01/T02、DEV-MODES/READ | 四模式、小屏、无白闪、截图评审 |
| M4a | feat: model handheld navigation；packages/experience | H01/H02 | 独立状态转换、键盘/触控意图、可取消启动 |
| M4b | feat: build handheld shell and lcd scene；apps/landing、全新图像字体 | 屏幕链接/无 JS/视口行为 | 精确几何、材质、屏幕、四语言主题组合 |
| M4c | feat: choreograph handheld motion；动画适配器、样式 | 正常/减少运动/加载失败/焦点测试 | 入场、按键与视差经录屏和性能审查 |
| M5 | feat: publish metadata and agent content；publishing、资产构建 | P01/P02、所有端点 L2 | HTML/Markdown/JSON-LD 同源、完整 SEO |
| M6a | test: verify cross-browser quality；tests/e2e、性能/视觉证据 | 07 完整矩阵 | 6DQ 逐维证据、视觉定稿、预算达标 |
| M6b | refactor: retire legacy implementation；删除旧 src、build.js、serve.js 等 | 新产物独立构建、旧 301 回归 | 新应用不引用任何旧 UI/脚本/引擎 |
| M7 | release: switch verified cloudflare build；CI/CD、wrangler、版本记录 | 隔离预览与部署产物核对 | 就绪版本切换，保留可执行回滚路径 |

M1b 可以先建立真实 L2/L3 runner 并覆盖现有可观察行为；后续阶段逐步添加新验收，不能用空测试或仅 mock 的测试冒充完整门禁。每个新功能的 L3 随功能落地，M6 是最终矩阵整合，不是最后才补 E2E。

表格给出提交边界；当一个阶段包含独立行为时继续拆分，但每个提交均保持可构建和相关门禁绿色。具体新路径按 06 执行，变更时同步文档。

## 视觉交付物

简历：四模式桌面/移动截图、两种纸张 PDF、中文断行与长条目样例。

落地页：壳体/屏幕/按键设计定稿、头像衍生与字体授权、四模式截图、普通动画与减少运动录屏、手机触控和低高度布局。

视觉结果按 04/05 的具体标准审查，保留画面证据；不靠自动打分决定设计是否完成。

## 生产切换与回滚

当前 Release 工作流会在 main CI 成功后部署。所以 main 本地原子提交与向 origin 推送/生产切换必须区分。

文档阶段只提交本地 main。后续开发在保持旧生产入口的前提下逐步建立新目录；若中途需要推送，应先将 Release 条件改为仅允许明确就绪的发布产物，防止半成品自动上线。

切换前：

- 构建产物只包含新两站和公开内容 allowlist，无 archive、内部设计说明或旧文件残留。
- 本地真实 Worker 与隔离预览都通过 301、四页面、资源、主题与 sitemap 验收。
- 记录当前生产部署标识、旧可重建 commit、构建环境/锁文件、回滚命令及必要权限。
- 两个 www 域名和两个根域名的行为均有验证；同一已验收产物部署，不现场重新改依赖。

切换后做小范围只读检查与错误监测。如回归，优先恢复上一完整 Worker 与资产部署，不只回滚 HTML 或代码的一半。不用强推 main 历史作为发布回滚方案。

## 文档维护

每个阶段完成后更新状态、实际路径、测试命令与证据。内容发生编辑时先更新 Markdown，再生成页面和 agent 输出。过期方案移入 archive 并从活跃索引移除；禁止在活跃文档中继续链接旧设计指导新实现。
