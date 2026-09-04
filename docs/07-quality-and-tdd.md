# 07 — 6DQ、Husky 与测试驱动开发

状态：以下为设计定稿后的完整质量目标。用户已调整为先迭代设计，再收紧 6DQ，当前执行范围见 10。基本 lint、TS7、旧回归及手动浏览器 smoke 已运行；不能把现有 53 个测试通过称作新项目已达到 6DQ。

## nmem 来源

2026-09-05 使用 nmem memories search 6DQ，并读取以下原始记忆：

- af0daa0f-0a10-4b0b-b328-f2dc32137bdc：《开发流程：6维质量体系》，2026-03-21，规范主来源。
- crystal_0c9c31f7de97：《开发流程：个人项目完整开发流程体系（2026-04 更新）》，补充独立 ViewModel、编号文档与原子提交流程。
- 400e2be9-d4a2-4dae-83bb-01ce038567be：《开发流程：编号文档》，采用编号、README 索引、具体文件路径、原子提交与质量计划；其中旧“四层测试”由更新的 6DQ 覆盖。

规范由三层测试 L1/L2/L3、两道门控 G1/G2、一道隔离 D1 组成。D1 是隔离维度的名字，不能误读成强制使用 Cloudflare D1 数据库。

## 六维在本项目的定义

| 维度 | 范围与通过条件 | 时机 |
| --- | --- | --- |
| L1 Unit/Component | 内容加载/校验、路由、locale/theme、掌机 ViewModel、元信息和发布模型；逻辑覆盖率各指标 ≥90%，301 分支 100% | pre-commit，目标 <30s |
| L2 Integration/HTTP | 完整构建 + 真实 Worker + 真实资产；全部公开路由类别和两个访问域名族，逐项核对状态/内容/头/链接 | pre-push，目标 <3min |
| L3 System/E2E | 浏览器真实阅读、主题语言切换、键盘/触控掌机、外链、打印、无 JS、慢网与视觉/A11y | CI 与阶段评审 |
| G1 Static Analysis | TS7 strict + noUncheckedIndexedAccess；TS/TSX/CSS/脚本/文档静态检查 0 error、0 warning | pre-commit，与 L1 并行 |
| G2 Security/Perf | OSV 依赖扫描、Gitleaks secrets 扫描必选；本项目额外强制资源体积与性能预算 | pre-push，与 L2 并行；CI 重跑 |
| D1 Test Isolation | 无外部存储，存储实例隔离 N/A；仍强制独立测试 Worker/config/资产/端口，禁止测试请求生产 | L2/L3 之前 |

UI 薄壳组件可不追求行覆盖率；其中出现条件、转换、事件或状态逻辑时必须抽出到受覆盖模块。不能把内容与路由逻辑移出统计来提高覆盖率。L3 和视觉评审负责实际 UI 行为与效果。

6DQ 原始规范把性能基线列为可选；本项目因用户明确要求性能，将体积与核心交互性能设为强制项。这是项目补充，不冒充 nmem 原文。

## 测试先行顺序

每个应用行为按 Red → Green → Refactor：

1. 用文档验收编号写测试输入与期望，禁止先复制旧实现。
2. 运行目标测试，观察因目标行为缺失而失败；框架安装失败、导入错误或无测试不是有效 Red。
3. 写最小实现使测试通过，再调整结构和设计。
4. 运行本层测试、相关回归与 G1；记录 Red 断言、Green 命令/结果。
5. 以绿色原子提交把测试和对应实现一起提交 main。测试先写发生在工作区，不把失败提交留在 main。

文档阶段先写下面的行为清单，做内容完整性/链接/归档检查；不为纯文案机械增加单元测试。第一批可执行测试在 M1/M2 中先于新生产代码落地。

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

## L2 真实 HTTP 矩阵

runner 启动独立测试服务器，固定连接 127.0.0.1:17046；通过测试 Host 映射区分 resume.lizheng-test.localhost 与 landing.lizheng-test.localhost，不请求真实生产域名。使用生产同一代码和实际构建产物，测试配置仅替换主机表与隔离资源。

覆盖：两个根、四语言页面、www 映射、无斜杠页面、12 类 301、所有 metadata 端点、正文 Markdown、图片/字体/CSS/JS、内部前缀、真 404 和未知路径回落。GET/HEAD 保持合理一致。

对 redirect 使用 manual 模式，验证 Location 后停止，不跟随到博客。将“没有业务 API”记录为 API 子项 N/A，但不能省略页面与边缘 HTTP 集成测试。

额外检查：HTML 不残留模板变量；资源实际存在；内部目录不会触发对外 Location；不同主机连续请求不会串缓存；错误或不完整构建失败退出。

## L3 浏览器与人工矩阵

基础矩阵：两个站 × en/zh × light/dark × 桌面 1440×900 / 手机 390×844。另测 320×568、768×1024、手机横屏 844×390、200% 缩放。

浏览器：Chromium 完整矩阵；WebKit 和 Firefox 跑核心流程及代表性小屏。补充真实 iOS Safari / Android Chrome 的手动交互抽查。

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

自动视觉快照使用固定字体、时钟、主题与视口；稳定画面快照可冻结装饰动画，但必须另有正常动画的行为检查和录屏。不能只测 reduced-motion 后宣布真实动画通过。

## G1 与文档检查

计划命令：check:types（TS7）、lint（Biome error-on-warnings）、check:docs（Markdown 格式/内部链接/公开 allowlist）。lint 覆盖新应用 TSX/CSS、Worker 和脚本，不沿用现有“HTML 全排除”作为新架构豁免。

不使用 @ts-ignore、关闭 strict、隐藏 warning、扩大 ignore 或修改阈值来换取绿色。例外需有具体原因和追踪，不允许整树豁免。

## G2 与性能证据

- 固定版本 OSV Scanner 扫描完整 bun.lock 与工作区依赖；检查其实际 CLI 版本再确定参数。
- Gitleaks 在提交时检查 staged secrets，在 pre-push/CI 检查将发布的差异或相应历史范围。
- 缺少扫描工具、扫描命令失败、结果无法解析均阻断；禁止“未安装所以跳过”。
- 漏洞处理优先升级/移除。精确、说明理由且有失效时间的已有例外才可使用；不添加全局忽略来掩盖风险。
- 对真实产物测 gzip 体积，执行 06 的预算；性能评审固定设备、网络与 CPU 模型，冷缓存至少 3 次取中位数并保留全部结果。
- 入场、按键、视差使用 Performance trace 检查长任务和渲染抖动；普通动画模式参加测试。

## D1 隔离设计

当前无数据库、KV、R2 或外部写入，存储隔离子项标记 N/A 并说明原因；不为了质量评分引入不需要的数据库。

仍须满足：

1. 独立 wrangler.test.jsonc，Worker 名 lizheng-dev-test；不含生产 routes/Custom Domains、账号凭据或生产资源 ID。
2. 构建前解析测试配置与资产路径；测试资源名统一 -test 后缀。开发 7046、L2 17046、L3 27046，工作目录临时隔离。
3. 运行时验证本地/测试 origin 和实际配置；不能只设置 TEST=true 就放行。
4. HTTP/浏览器设置出网 allowlist；拦截真实外链导航，redirect 不自动跟随。
5. runner 正常/失败/中断均清理自己创建的进程与临时目录；不杀占用端口的其他用户进程。
6. 如果未来增加存储，必须独立 -test 资源实例、构建绑定校验、运行时检查与测试数据标记；生产存储内加 test 行不合格。

## Husky 与 CI 落地

| 入口 | 顺序 |
| --- | --- |
| prepare | 安装 Husky；验证 core.hooksPath 指向 .husky/_ |
| pre-commit | staged secrets +（G1 并行 L1）；任何非零退出码阻断 |
| pre-push | D1 配置验证 →（真实 L2 并行 G2）；任何非零退出码阻断 |
| CI | 安装锁定依赖 → G1/L1 → D1 → L2/G2 → L3 → 产物验收 |

hook 调用一个等待所有子任务的 gate runner，保留每项退出码，不使用后台命令后直接退出。不能只检查最后一个命令而吞掉先前失败。

新门禁需要故障注入验收：临时制造一个 L1 失败、类型/ lint warning、隔离错误、扫描器缺失/失败、L2 失败，分别确认 Git 操作被阻断并在恢复后通过。采用隔离临时 Git fixture，不在 main 留下故意失败提交。

只维护 Husky 一套 hooks；旧 scripts/setup-hooks.sh 的 .git/hooks 软链机制在 M1 退役。CI 重跑门禁，防止本地 hook 未安装产生绕过。

## 当前差距与目标评级

目前已有 L1 模板/Worker 测试、Biome、类型检查和 Husky 文件；覆盖率仅统计 build.js，pre-push 仍重复 L1，缺少真实 HTTP L2、浏览器 L3、完整 G2 和隔离验证。

目标是六维全部有证据的 S；当前文档阶段不授予新系统评级。无存储的 N/A 必须有理由，不能把没有执行的 L2/L3 写成 N/A。
