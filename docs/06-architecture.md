# 06 — 技术架构与版本决策

状态：实现方案，当前 package.json 和生产构建尚未切换。版本在 2026-09-05 查询 npm registry 的 latest 与 peerDependencies，不使用猜测版本。

## 技术选择

采用 React 19 + Vite 8 + TypeScript 7 的静态预渲染架构。两个访问面独立布局、独立客户端入口，共享内容模型和少量新写的语言/主题/SEO 基础逻辑。一个 Cloudflare Worker 负责域名与路径路由，Static Assets 提供已经生成的完整 HTML。

这四个内容页面没有请求时动态数据需求。预渲染可让所有正文与外链在初始 HTTP 中出现，减少运行时复杂度，同时保留掌机的 React 交互。

| 依赖 | 本次核实版本 | 用途 |
| --- | --- | --- |
| typescript | 7.0.2 | 原生 TypeScript 编译器、严格类型检查 |
| react / react-dom | 19.2.8 | 两站新组件；构建时渲染，掌机端渐进增强 |
| vite | 8.2.2 | 客户端/构建端模块处理、CSS 与资产清单 |
| @vitejs/plugin-react | 6.1.1 | React 编译集成；声明支持 Vite ^8.0.0 |
| vitest | 5.0.0 | L1 和真实 HTTP L2 的断言运行器 |
| @playwright/test | 1.62.1 | L3、视觉和浏览器行为 |
| @axe-core/playwright | 4.13.0 | A11y 自动检查 |
| @biomejs/biome | 2.5.12 | 格式、JS/TS/TSX/CSS 静态检查 |
| husky | 9.1.7 | Git 门禁 |
| wrangler | 4.129.0 | Cloudflare 开发、绑定类型与部署 |
| @cloudflare/workers-types | 5.20260904.1 | 参考最新平台类型；应用 Env 由 Wrangler 生成 |

另已查询 @types/react 19.2.18、@types/react-dom 19.2.7、gray-matter 4.0.3、remark 15.0.1、remark-gfm 4.0.1。M1 检查 React 插件的可选 peer 依赖及 Markdown 安全解析配置后精确锁定。版本快照不等于兼容性测试已经通过；M1 必须实际安装、类型检查、构建与运行。开始实施时重新核对安全补丁，直接依赖用精确版本，提交 bun.lock，CI frozen install。

包管理与脚本入口使用 Bun 1.4.0（本机版本）。框架构建/测试使用受支持的 Node 24 LTS 或兼容更新版本，避免把 Bun 管理依赖误解为强迫所有第三方工具运行在 Bun 内。生产执行环境是 Cloudflare workerd。

## 已评估的方案

Astro 7.3.1 和 @astrojs/cloudflare 14.3.0 均已查询。后者 peer 要求 Astro ^7.2.0、Wrangler ^4.125.0；但最新 @astrojs/check 0.9.10 声明 TypeScript ^5.0.0 || ^6.0.0，尚不声明支持 7。

为满足 TypeScript 7 严格检查，并避免双编译器或忽略 peer 冲突，本轮不选 Astro。Vite + React 的全部业务及视图源文件使用 TS/TSX，可由同一 TypeScript 7 门禁覆盖。新的预渲染编排是小型 TypeScript 构建模块，不继承旧 build.js 模板引擎。

## 目标代码结构

以下路径为计划创建，不表示目前存在：

    apps/
      resume/
        src/ResumePage.tsx
        src/components/
        src/styles/
        src/client.ts
      landing/
        src/LandingPage.tsx
        src/components/Handheld.tsx
        src/components/Screen.tsx
        src/styles/
        src/client.tsx
    packages/
      content/src/             Markdown allowlist、schema、typed model
      experience/src/          locale/theme、掌机状态转换、navigation model
      publishing/src/          HTML metadata、JSON-LD、Markdown、sitemap
    worker/
      index.ts                 新边缘入口
      legacy-redirects.ts      精确保留的旧 301 兼容规则
    scripts/
      build.ts                 新预渲染和资源打包流程
      verify-test-bindings.ts
      run-integration.ts
      gate-security.ts
      check-budgets.ts
    tests/
      unit/
      integration/
      e2e/
    docs/content/              四份公开 Markdown 内容源
    dist/                      最终唯一部署目录，Git 忽略

两套 UI 不共享旧组件或旧 CSS。共享模块只容纳新写的语义、数据和行为；避免为了统一视觉而将掌机风格带入正式简历。

## 构建与数据流

1. 显式加载四个 Markdown 文件；校验 frontmatter、正文段落、语言、URL 和来源 allowlist。
2. 标准 Markdown AST 转换为 Content Model；拒绝任意脚本、未知 frontmatter 和未经允许的原始 HTML。使用成熟解析库，不重新发明字符串替换模板。正文中重复的学校名是合法信息，渲染后的 heading id 使用稳定且唯一的记录标识。
3. Vite 分别构建静态渲染入口与两个客户端入口，生成带内容 hash 的资源 manifest。
4. 构建端使用 react-dom/server 渲染四份完整页面，注入 canonical、hreflang、JSON-LD、manifest 资源与安全的序列化初始数据。
5. 输出对应的 Markdown、robots、llms、sitemap 与新 OG 图像；所有产物只来自 allowlist。
6. 打包两个访问面至 dist/_sites/resume 与 dist/_sites/landing；静态资源在独立命名空间下，防止文件名冲突。
7. Worker 按域名重写至内部资产；直接请求 /_sites/ 返回 404。不把内部 URL 泄漏到 Location、canonical 或资源引用。

简历用 React 生成静态 HTML，只加载主题/轻量控件脚本，不为阅读全文加载 React runtime。落地页在初始完整 HTML 上加载交互；装饰外壳不必参与状态更新。链接在 hydration 前后均有效。

构建输出必须确定且干净：每次从新的输出目录生成，校验后替换 dist，避免旧文件残留。年份由显式构建时间生成，不触发客户端 hydration 文本不一致。

## 客户端边界

Model：已校验的公开内容与外链。

ViewModel：纯 TypeScript 状态转换；输入按钮/键盘意图，输出 screen panel、selected link、theme、motion 状态；不引用 DOM 或 React。

View：两个独立 React 视图及必要的 DOM 适配器。动画响应已经确定的状态，不决定内容是否存在。定时器、媒体监听器、指针订阅有明确清理逻辑。

主题初始化脚本很小，在绘制前执行，容忍存储被禁用。其余 JS 以 module 延后执行。两种语言使用独立 URL，不依赖整站客户端翻译请求。

## Cloudflare 与缓存

- 保留四个生产域名和 Worker lizheng-dev；测试 Worker 使用 lizheng-dev-test。
- 使用 Workers Static Assets；所有 HTML 必经域名选择与 301 判定，资产路由与 binding 由最新 schema 核对。
- 新配置设置实施当天 compatibility_date，启用必要 nodejs_compat；通过 Wrangler 生成 Env 类型，启用 observability。
- 带 hash 的资源长期 immutable 缓存；HTML、内容 Markdown 与语言重定向使用可更新的短缓存策略。不得给未改名的人像设一年 immutable 后原地替换。
- Worker 不向外部博客抓取内容，不添加数据库、KV、R2 或鉴权服务；跳转只是构造固定目标 Location。
- CSP 按最终字体、脚本、图片与样式实现配置。首帧主题脚本使用构建 hash 等明确授权，不为了省事放开任意脚本。
- 测试通过真实本地 Worker 读取构建资产，不能只 mock ASSETS 后宣布部署可用。

## SEO 与 agent 可读性

每页设置完整、同语言的 title/description、非 www canonical、双语言 alternate、x-default、Open Graph、Twitter card、lang 和合理 heading hierarchy。结构化数据使用 Person / ProfilePage；sameAs 只列真实外链，不虚构评分与作品。

四份 HTML 的内容由同一 Markdown 生成，JS 关闭时仍能阅读。每站发布自己的 robots、llms 与语言 Markdown 端点；.me 的新 sitemap 避开旧 /sitemap.xml。禁止把内部文档发布给 bot，禁止不同 User-Agent 得到不同履历。

## 性能设计预算

以下为初版验收目标，后续以实测记录；调预算必须解释原因，不通过删内容或关闭动画刷分。

| 项目 | 简历 | 掌机 |
| --- | --- | --- |
| 首次所需 JS，gzip | ≤8 KiB | ≤90 KiB（含 React） |
| 首次所需 CSS，gzip | ≤20 KiB | ≤35 KiB |
| 首屏总传输，压缩后 | ≤300 KiB | ≤450 KiB |
| 主视觉图片 | 新照片衍生 ≤80 KiB | 点阵头像/必要纹理合计 ≤100 KiB |
| CLS | ≤0.05 | ≤0.05 |
| 移动端 LCP 目标 | ≤2.5s | ≤2.5s |
| 用户交互 INP 目标 | ≤200ms | ≤200ms |

首屏总量包含实际使用的字体、图片、CSS、JS 与 HTML，不能只统计入口文件。自托管字体按语言与字形子集加载，预留图片尺寸，避免外部字体网络阻塞。测试时分别记录冷缓存和暖缓存。

LCP/INP 的长期目标应以真实用户数据验证。实施期用固定移动设备/网络/CPU条件的多次实验室运行、交互 trace 与长任务检查作为证据，不把单次 Lighthouse 分数称为真实用户 INP。

## 查询来源

- [TypeScript registry](https://registry.npmjs.org/typescript/latest) 与 [官方发布博客](https://devblogs.microsoft.com/typescript/)。
- [React registry](https://registry.npmjs.org/react/latest)、[Vite registry](https://registry.npmjs.org/vite/latest)。
- [Astro registry](https://registry.npmjs.org/astro/latest)、[Astro checker peers](https://registry.npmjs.org/@astrojs%2fcheck/latest)。
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)。
- [Astro Cloudflare deployment guide](https://docs.astro.build/en/guides/deploy/cloudflare/)：用于方案评估。
- 其余版本同样来自 npm registry 对应包的 /latest；本次只有查询，尚未升级项目依赖。
