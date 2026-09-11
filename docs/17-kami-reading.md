# 17 — Kami 阅读排印与原版文案保留

日期：2026-09-11。状态：布局已获用户确认；本页记录已完成的排印与原文回退验证。后续文案已按用户新要求重写，见 [18](18-engineering-and-ai-profile.md)。布局与最终文案纳入 v3.2.0，发布记录见 [11](11-release-implementation.md)。

用户使用 [tw93/Kami](https://github.com/tw93/Kami) 改善中英文阅读体验后，确认当前布局，当时要求“文字内容改回去，仅添加Microsoft Teams的信息”。本页记录保留的排印设计与该阶段的文案边界，下面的截图、PDF 和测试结果对应原文回退版本。最新文字以 [18](18-engineering-and-ai-profile.md) 为准。[16](16-resume-refresh.md) 保留前期研究和已撤回的改写记录。

## 内容边界

两份简历从 `a680c0f` 恢复，保留原有 metadata、tagline、概述、第三人称语气、工作经历、领导力和工作之外正文。此次只在微软任职日期下分别新增：

- 英文：`Currently working in Microsoft Teams.`
- 中文：`目前在 Microsoft Teams 团队工作。`

去掉这一个新增句子后，每份文件均与 Git 原版逐字相同。2012 年仍表示微软入职年份，不推断 Teams 转组日期。六个章节、三段任职、13 条工作描述、两条学历、专利和四个社交链接完整；最后一节恢复为 Beyond Work / 工作之外，并同步恢复内容模型中的标题契约。

此前新增的日常职责、Firefly / Pew 项目与博客成长概述已撤回。没有再次读取私有研发会话或扩大内部资料范围。CSS、页面组件、头像和六个装饰文件的 SHA-256 在本次文字回退前后完全一致，保留用户确认的布局及标签对齐。

六个章节、锚点和四文件发布 allowlist 保持不变。公开 HTML、Markdown 与 llms.txt 继续来自同一份内容模型。

## Kami 的使用方式

参考版本为 `4dab24cc4c527dbb35aa8fae09e02822992dfbe2`，读取其 [SKILL.md](https://github.com/tw93/Kami/blob/4dab24cc4c527dbb35aa8fae09e02822992dfbe2/skills/kami/SKILL.md)、Cheatsheet、中英文简历模板、简历写作规范，以及相关排印、来源、响应式和印刷检查说明。

以现有 `ResumePage` 为实现模板，采用 Kami 的衬线正文、字体层级、邻近分组、自然断行和打印思路。用户要求的原有设计优先：继续保留暖纸色与深绿主题、橙色四方标、Space Grotesk 字标、章节编号、分隔线、地点签名、自然色头像及六套装饰。

没有将 Kami 的整套静态模板、墨蓝色、商业楷体、指标卡片和项目卡片搬入页面。正文继续使用项目已有的 Newsreader 与系统宋体，界面控件保留无衬线字体。没有新增项目运行时依赖、远程字体请求或客户端脚本。

## 阅读规格

| 项目 | 当前设计 |
| --- | --- |
| 外层框架 | 保留 1500px 上限及两站统一的页眉、页脚 |
| 英文阅读列 | 64ch，Newsreader 18px 时约 653px；标题、照片与正文同宽对齐 |
| 中文阅读列 | 36em，18px 时为 648px；宋体回退链包含 Noto Serif CJK SC、Source Han Serif SC、SimSun |
| 桌面目录 | 1200px 起使用 192px 目录栏，48px 栏间距；阅读列保持居中 |
| 小屏目录 | 1200px 以下使用原生 details/summary，默认收起；键盘和禁用 JavaScript 时仍可跳转 |
| 正文 | 中英文均为 18px；英文行高 1.75，中文 1.85，中文使用严格标点禁则 |
| 章节与条目 | 章节 28px、条目 24px；手机为 24px、20px；以 400/500 字重区分正文和标题 |
| 断行 | 正文使用 text-wrap: pretty，标题和两行简介使用 balance；长单词允许断行 |
| 操作 | 目录、社交链接和桌面打印按钮至少 44px 高；移动目录有明确焦点样式 |
| 照片 | 保留前一轮的手机 108px 相框与 96×114px 照片，保留 SVG 清晰度修复 |

正文不再单独设一条比页面窄的 max-width。整个阅读列决定行长，解决原版照片靠远端、横线很长而正文只占左半列的问题。品牌页眉和页脚的宽度独立于正文，不影响 lizheng.me。

## 打印

沿用白纸打印变体，使用静态系统字体，避免可变字体在 PDF 文本提取时拆字。英文正文为 Georgia 10pt、行高 1.45；中文正文为宋体 11pt、行高 1.55。A4 页边距采用 Kami 的上下 11mm、左右 13mm；收紧页眉、目录隐藏、自然色照片保留，装饰性图注与小标签不打印。学历使用原生 CSS 分栏，阅读顺序仍为硕士后学士。

只将较短的早期经历列表、学历和专利保持完整，长经历可以自然分页。标题与紧接的正文避免拆页。完整原文同时进入网页和 PDF，沿用用户确认的字号和页边距。两份 PDF 均为两页 A4，末页随原文长度保留自然留白。

## 验证与产物

中英文原生移动目录保留键盘和无 JavaScript 检查。原有内容缺失测试按结构删除工作经历下的首条列表项，持续验证 13 条经历描述的完整性。

| 检查 | 本地结果 |
| --- | --- |
| `bun run check:static` | lint、TypeScript、生成类型、依赖和文档检查全部通过 |
| `bun run test:coverage` | 283 项通过；语句、函数、行覆盖率 100%，分支覆盖率 99.46% |
| `bun run test:http` | 5 项通过 |
| `bun run test:browser --grep 'resume\|portrait keepsake' --update-snapshots=all` | 恢复原文后 Chromium、Firefox、WebKit 共 60 项通过；包括中英文、主题、响应式、可访问性、目录、打印与装饰 |
| Chromium 的 darwin-ci 简历截图 | 本机 CI 模式下 8 项检查通过，八张参考图已刷新；远端 GitHub Actions 未运行 |
| `bun run check:budgets` | 四页构建与体积预算通过；英文简历 174124 bytes，中文 174677 bytes，均低于 300KB；没有新增字体、图片和运行时依赖 |
| `git diff --check` | 通过 |

恢复原文后重新捕获中英文、浅色和深色的 375px/1280px 截图。另检查 320、375、390、640、768、820、1024、1199、1200、1280、1440、1920、2560px 的两种语言，全部没有横向溢出。WebKit 的 375px、3 倍像素比深色截图也已刷新。

行尾检查采用 DOM Range 测量。英文在所查宽度下均无短于最长行 13% 的尾行；中文原文在 375px 下有一处两字尾行、390px 下有三处、648px 阅读列下有两处四字尾行。保留用户确认的原文和宽度，采用自然断行；这些短尾不造成裁切或溢出。

两份 PDF 均为 **两页 A4**。Kami 的 `build.py --check-visual` 通过并导出四张页面图，已逐页查看：没有缺字、遮挡或单独留在页底的标题。字体检查确认中文正文使用 `STSongti-SC-Regular`；其提示为可接受的衬线回退，而非 Kami 商业楷体的参考渲染，符合本站保留字体的决定。

PDF 文本提取逐项核对每种语言的 32 个源 Markdown 内容块；去除排版空白与标点后全部匹配。两份 PDF 的 5 个不同链接目标也与公开源全部一致。原文比扩充稿短，旧扩充稿的分页填充率结果不再适用；当前按用户确认的版式自然分页。

独立只读审阅者已按最终的“原文 + Teams 信息、保留布局”契约完成复核，未发现 P0/P1 问题：逐字差异符合边界，九个布局与素材文件哈希不变，中英文深浅主题截图与四页 PDF 未见显著视觉回归。

对比图、截图、PDF 及检查脚本保存在 Git 忽略的 `.design-review/kami-reading/`，均不进入发布目录：

- 对比：`comparison-zh-desktop.png`、`comparison-en-desktop.png`、`comparison-mobile.png`。
- PDF：`resume-zh.pdf`、`resume-en.pdf`；逐页预览位于对应的 `resume-*-visual/`。
- 证据：`before-checks.json`、`after-checks.json`、`reading-audit.json`、`content-coverage.json`，以及各语言、主题、宽度的完整页面截图。

本次文字恢复的逐字差异与九个布局、图片文件的哈希校验记录，另存于 `.design-review/content-restore/verification.json`。

本地预览为 `https://lizheng-dev.dev.hexly.ai/zh/` 与 `https://lizheng-dev.dev.hexly.ai/en/`。本轮没有提交、推送或部署。

同日标签对齐跟进：用户要求左侧 `CURRICULUM VITAE` 与右侧 `ENGINEERING · LEADERSHIP · AI` 同行对齐。移除侧栏 4px 顶部留白，将左标签设为块级元素，并与右标签统一为 10px 等宽字、1.75 行高，消除父级行框带来的垂直偏差。Chromium、Firefox、WebKit 在两种语言、两种主题及 1200/1280/1440/1920px 下共 48 次测量，文字顶部差值均为 0px；12 项桌面布局、内容与可访问性检查通过。证据保存在 `label-alignment.json`，375px/1280px 截图及对比图已刷新。

## 两端对齐跟进 — v3.2.1

同日用户要求中英文简历两端对齐，桌面限制行长、手机填满可用宽度，并按 Z+1 上线。段落和列表采用原生 `text-align: justify`，末行保留 `start` 对齐；浏览器根据文档语言自动断词，英文断词保留至少三个前后字符，减少窄屏中不均匀的词距。标题继续采用原有自然断行。

沿用现有阅读列：英文 64ch、中文 36em，1280px 桌面实测为 652.59px 和 648px；375px 手机均为 331px，填满两侧 22px 页面留白之间的空间。完整文案、字号、行高和设计元素保持原样。

中英文、明暗主题、375px/1280px 共八种截图检查通过，无横向溢出，全部正文段落和列表均保持两端对齐。已查看四组前后正文对比图。三个浏览器的 42 项简历回归通过，无跳过、失败或不稳定用例。两组简历性能检查均通过，每组三次冷启动采样；390px/1440px 的 LCP 中位数分别为 484ms/476ms，CLS 为 0.0068/0.0410，交互为 48ms/40ms。两份打印稿仍为两页 A4，Microsoft Teams 和专利号可搜索；Kami 视觉检查完成，四页均已打开审阅，英文 Georgia 与中文宋体沿用原有打印字体。检查产物保存在 `.design-review/release-3.2.1/`；最终 CI、部署和延迟复查记录见 [v3.2.1 Release](https://github.com/nocoo/lizheng.dev/releases/tag/v3.2.1)。
