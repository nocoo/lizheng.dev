# 07 — System0 槽位、Husky 与测试驱动开发

状态：设计已批准，门禁已按 System0 槽位落地。v3.0.0 按用户授权先发布；门禁及后续质量证据见 11。旧 builder 不再属于覆盖率统计口径。

## 来源与命名

本项目最早按 nmem 记忆《开发流程：6维质量体系》（af0daa0f-0a10-4b0b-b328-f2dc32137bdc，2026-03-21）与 2026-04 补充记忆建立门禁，当时叫 6DQ。2026-11 起统一改称 **System0**：槽位定义、约束与阶段目标以 workflow 仓 `agents/skills/system0-quality`（v1.3.0）为准，base-ci 只是实现。旧文档（01、08、09、11 的历史段落）保留当时的 6DQ 用词，不追改历史记录。

槽位编号在 System0 中改过一次含义，读旧文档时注意：旧 L1.5（Worker 运行时）现在是 L2 Runtime；旧 L2（API E2E）现在是 L3 Integration；旧 L3（浏览器）现在是 L4 E2E。

## 本项目选定的槽位

| 槽位 | 在 lizheng.dev 的证据 | 时机 |
| --- | --- | --- |
| S1 Types | `typecheck`（TS7 strict、noUncheckedIndexedAccess）与 `types:check`（生成的 Wrangler 类型） | pre-commit、CI |
| S2 Lint | Biome `--error-on-warnings`，0 error 0 warning；文档与依赖一致性检查 `check:docs`、`check:deps` 同组运行 | pre-commit、CI |
| S3 Workflow | `check:workflows`：actionlint 加 base-ci 引用必须钉到 40 位 SHA；CI 追加 yamllint 1.38.0 | pre-commit、CI |
| G1 Secrets | 提交阶段 `gitleaks protect --staged`；推送阶段逐个推送 ref 扫 `oid --not --remotes`；CI 扫检出内容 | commit、push、CI |
| G2 Dependencies | `osv-scanner` 扫 `bun.lock`，配置见 `osv-scanner.toml`；缺工具即失败 | push、CI |
| B1 Build | `bun run build`；提交阶段在 index 快照内构建，推送阶段由预算门禁再次构建 | pre-commit、push、CI |
| L1 Unit | `test:coverage`；内容加载与校验、路由、locale/theme、掌机 ViewModel、元信息、发布模型；四项 ≥95% | pre-commit、CI |
| L2 Runtime | 不适用：没有 workerd / vitest-pool-workers 专属套件，Worker 的 Web API 行为由 L1 单测与 L3 真实 wrangler 产物覆盖 | — |
| L3 Integration | `test:http`：真实 wrangler 产物跑在 Miniflare 上，固定 17046，覆盖全部公开路由类别与两个访问域名族，逐项核对状态/内容/头/链接 | push、CI |
| L4 E2E | Playwright：Chromium 旅程与 `test:development` 在槽位作业内；Firefox 两片与 WebKit 四片是槽位外作业，由 Z1 聚合；三引擎全覆盖，含视觉与 axe | CI |
| P1 Package | 不适用：`package.json` 是 private，不发布 npm 包 | — |
| Z1 Gate | `scripts/slot-gate.ts`：校验声明与实跑一致、各槽位 tested-sha 一致，并要求槽位外阻塞作业全部成功 | CI |

声明文件是 `.github/slot-status.json`，`impl` / `na` / `todo` 与理由都写在那里；`tests/unit/quality-contract.test.ts` 断言声明与 `quality-slots.yml` 一致，任何一边单独改动都会让 L1 失败。

槽位外的阻塞作业只允许不带槽位编号的显示名，并必须进入 Z1 的 `needs`：`Browser E2E (<engine>)` 与 `Release package verify`（`check:hooks`、`check:budgets`、wrangler dry run、生产同款归档解包校验）。性能实验室与发布部署不在 CI 门禁内。

## 测试先行顺序

每个应用行为按 Red → Green → Refactor：

1. 用文档验收编号写测试输入与期望，禁止先复制旧实现。
2. 运行目标测试，观察因目标行为缺失而失败；框架安装失败、导入错误或无测试不是有效 Red。
3. 写最小实现使测试通过，再调整结构和设计。
4. 运行本层测试、相关回归与静态槽位；记录 Red 断言、Green 命令/结果。
5. 以绿色原子提交把测试和对应实现一起提交 main。测试先写发生在工作区，不把失败提交留在 main。

文档阶段先写下面的行为清单，做内容完整性/链接/归档检查；不为纯文案机械增加单元测试。

## L1 预先定义的测试

| ID | 先写的输入/情景 | 应断言的结果 |
| --- | --- | --- |
| C01 | 四份 allowlist Markdown | 2 个访问面 × 2 语言，必需 metadata 和正文齐全 |
| C02 | 删除一段经历、专利 URL 或一个语言文件 | 内容完整性校验失败，报告文件与字段 |
| C03 | 传入 archive、README 或任意路径 | 不得成为公开内容 |
| C04 | 恶意原始 HTML、script、javascript: URL | 拒绝或安全处理，不能进入生成页面 |
| R01 | 12 类 legacy path × .me/www.me | 301 与完整 Location；对 .dev 不生效 |
| R02 | 查询参数、编码、边界、尾斜杠、大小写 | 只命中 03 中的精确模式 |
| R03 | sitemap、Markdown、内部路径、未知请求 | 正确优先级，不吞新端点、不泄漏内部资产 |
| T01 | storage 拒绝、空/坏值、system light/dark | 安全默认、显式选择优先、无异常 |
| T02 | 用户切换、系统变化、语言导航 | 状态/标签同步，显式偏好不被覆盖 |
| H01 | 方向、A/B、SELECT/START、边界选择 | 确定的下一状态与导航意图，不依赖 DOM |
| H02 | 启动中输入、减少运动、离开视口 | 导航不阻塞，动画可停止、无悬挂计时器 |
| P01 | 两域名四页面发布模型 | canonical/hreflang/JSON-LD 正确，不串域 |
| P02 | Markdown / llms / sitemap 输出 | 与公开内容同源；排除所有内部工程信息 |
| Q01 | 槽位声明与实跑不符、na 槽位却运行、槽位外阻塞作业失败 | Z1 拒绝，并说明是哪一条不一致 |
| Q02 | 推送非 HEAD 的 ref、已删除 ref、仓库里不存在的 OID | 前两者与非 HEAD 情形阻断，删除跳过源码检查 |
| Q03 | `node_modules` 与 `bun.lock` / `package.json` / engines 不一致 | index 快照复用依赖前失败，并给出差异 |

## L3 真实 HTTP 矩阵

runner 启动独立测试服务器，固定连接 127.0.0.1:17046；通过测试 Host 映射区分 resume.lizheng-test.localhost 与 landing.lizheng-test.localhost，不请求真实生产域名。使用生产同一代码和实际构建产物，测试配置仅替换主机表与隔离资源。

覆盖：两个根、四语言页面、www 映射、无斜杠页面、12 类 301、所有 metadata 端点、正文 Markdown、图片/字体/CSS/JS、内部前缀、真 404 和未知路径回落。GET/HEAD 保持合理一致。

对 redirect 使用 manual 模式，验证 Location 后停止，不跟随到博客。将“没有业务 API”记录为 API 子项 N/A，但不能省略页面与边缘 HTTP 集成测试。

## L4 浏览器与人工矩阵

基础矩阵：两个站 × en/zh × light/dark × 桌面 1440×900 / 手机 390×844。另测 320×568、768×1024、手机横屏 844×390、200% 缩放。

浏览器：Chromium、WebKit、Firefox 均执行完整矩阵，并模拟触控。真实 iOS Safari / Android Chrome 的实机抽查属于后续人工验收，不将模拟器结果冒充实机证据。

| 场景 | 通过标准 |
| --- | --- |
| 简历 | 全文可读，目录正确，语言与主题持久化，打印保留身份与全部经历 |
| 掌机 | 鼠标、触摸、Tab/方向键/A/B/SELECT/START 行为一致，链接无需等待 hydration |
| 加载 | 无白闪、无假进度、无永久 loading；字体/图片失败仍有稳定内容 |
| 无 JS | 两站内容和标准外链仍可用，语言 URL 可访问 |
| A11y | axe 无 critical/serious；所有实际文本/控件对比达标，键盘无陷阱，可见焦点与合理阅读顺序 |
| Motion | 普通模式有完整编排；reduced-motion 保留设计、停止空间运动 |
| SEO/agent | HTML 与 Markdown 信息对应；无脚本抓取仍获取全文，不暴露内部文档 |
| 外链 | 验证 href/新窗口意图并拦截外网请求，不对 LinkedIn/GitHub/博客做业务操作 |
| 视觉 | 字体、光影、机壳比例、像素头像、中文断行、主题材质人工签查 |

自动视觉快照固定浏览器、字体、主题与视口，按平台保存基线，遮罩页脚动态版本号；稳定画面快照可冻结装饰动画，但必须另有正常动画的行为检查和录屏。不能只测 reduced-motion 后宣布真实动画通过。WebKit 分四片、单片一个 worker；Chromium 与 Firefox 各一片。

## 静态检查与工作流检查

实现命令：typecheck（TS7）、types:check（生成的类型必须与代码一致）、lint（Biome error-on-warnings）、check:docs（Markdown 格式/内部链接/公开 allowlist）、check:deps（knip，未使用依赖/导出即失败）、check:workflows（actionlint 加 base-ci 引用 SHA 校验）。CI 的 S3 作业另外跑 yamllint。

不使用 @ts-ignore、关闭 strict、隐藏 warning、扩大 ignore 或修改阈值来换取绿色。例外需有具体原因和追踪，不允许整树豁免。

## 依赖、安全与性能

- G1：提交阶段扫 staged 变更；推送阶段读 Git 的 stdin ref，按 local OID 固定待验证版本（非 HEAD 或缺失对象直接阻断，删除 ref 跳过），用 `oid --not --remotes` 逐个扫；CI 独立扫检出内容。工具缺失、命令失败、结果无法解析都阻断。
- 依赖快照：复用 `node_modules` 之前核对四件事——`package.json` 与 `bun.lock` 的依赖及 override（保留 `parent>target` 作用域）完全一致；每个已安装包都锁定在同名同版本；每个直接依赖与 override 目标按锁定版本安装；每个已安装包的锁定 `dependencies` 全部在位。工具链核对 `engines`（严格解析单比较符范围，无法解析即失败）与 `packageManager`（必须同 major.minor 且不比 pin 老，CI 精确钉 1.4.0）以及真实 `node --version`。任何不一致或无法确认都失败，并提示 `bun install --frozen-lockfile`。
- G2：固定版本 OSV Scanner 扫 `bun.lock`；漏洞处理优先升级/移除，精确、说明理由且有失效时间的例外才可使用。
- 性能：对真实产物测 gzip 体积并执行 06 的预算；交互与加载预算在独立的 Performance lab 工作流运行，失败可见但不阻塞发布。

## 隔离设计（不是槽位）

隔离是所有测试层的前置约束，不是编号槽位。当前无数据库、KV、R2 或外部写入，存储隔离子项标记 N/A 并说明原因；不为了质量评分引入不需要的数据库。

仍须满足：

1. 独立 wrangler.test.jsonc，Worker 名 lizheng-dev-l2-test / lizheng-dev-l3-test；不含生产 routes/Custom Domains、账号凭据或生产资源 ID。这些 `l2` / `l3` 标识指保留端口层，与槽位编号无关。
2. 构建前解析测试配置与资产路径；测试资源名统一 `-test` 后缀。开发 7046、L3 用 17046、L4 用 27046，工作目录临时隔离。
3. 运行时验证本地/测试 origin 和实际配置；不能只设置 TEST=true 就放行。
4. HTTP/浏览器设置出网 allowlist；拦截真实外链导航，redirect 不自动跟随。
5. runner 正常/失败/中断均清理自己创建的进程与临时目录；不杀占用端口的其他进程。
6. 如果未来增加存储，必须独立 `-test` 资源实例、构建绑定校验、运行时检查与测试数据标记；生产存储内加 test 行不合格。

## Husky 与 CI 落地

| 入口 | 行为 |
| --- | --- |
| pre-commit | `scripts/pre-commit-l1.sh` 导出 Git index 快照：staged gitleaks → 依赖与工具链快照校验 → 静态槽位（S1/S2/S3 与文档、依赖） → L1 覆盖 → B1 构建；全部在快照内运行，未暂存的修复无法掩盖问题 |
| pre-push | `scripts/gates.ts pre-push` 读 stdin 的每个 ref 并固定待验证 OID：非 HEAD 或仓库中不存在的对象直接阻断，纯删除跳过全部源码检查；随后把该 OID 导出到临时快照（`git archive`），只有快照自身的锁文件校验通过才复用 `node_modules`，再在快照内并行跑逐 ref gitleaks、依赖快照、G2、L3 与预算（B1 重构建） |
| CI | `.github/workflows/quality-slots.yml`（`on: workflow_call`）承载 12 个槽位作业、槽位外阻塞作业与本地 Z1；`ci.yml` 只有一个 `quality` 调用作业 |

每个 hook 调用一个等待所有子任务的 gate runner，保留每项退出码，不使用后台命令后直接退出。两个 hook 都只读，不修改源码或暂存区。

新门禁需要故障注入验收：`scripts/verify-hooks.ts` 在隔离的临时 Git 仓库里通过替身子命令注入静态槽位、安全扫描器、L3、预算失败，并构造依赖漂移、工具链越界、被工作区掩盖的坏提交、非 HEAD ref、缺失对象等真实失败，逐一确认阻断；同时验证纯删除 ref 不触发源码检查、健康提交与推送可通过。`scripts/verify-l1-gate.ts` 另外验证「暂存了失败测试、工作区已修好」仍被拒绝。两者都在 CI 的 release package 作业运行，防止本地 hook 未安装产生绕过。

## 分支保护

`main` 上的 `main quality gate` ruleset（id 27029540）只要求 `quality / Z1: Gate`，并允许 admin 仓库角色 always 旁路。理由：本项目由单一维护者直接向 main 推送，若要求 PR 或禁止旁路，日常迭代会被自己的门禁卡死；而 Z1 已经聚合全部槽位与槽位外阻塞作业，其他路径（PR、机器提交）仍靠 hooks 与 CI 兜底。改名、改编号或调整旁路前，先跑一次真实 CI 读出实际检查名，不要凭猜测修改。

## 证据与评级

实测（bun 1.4.4、node 26.13.0、Apple silicon）：pre-commit 冷启动 4.7 秒、热启动 3.4 秒；pre-push 冷启动 4.1 秒、热启动 3.3 秒；`check:hooks` 约 51 秒、`check:l1-gate` 约 21 秒。CI 槽位部分约 30 秒，总时长瓶颈在 macOS 浏览器作业与 runner 排队，实测数字记在 19。没有存储的子项为 N/A，真实设备和真实用户 Web Vitals 不计为已验证。
