# Apply guide — for coding agents

将 `docs/design/preview/` 中的静态 HTML 改造为带 Handlebars 占位符的模板，覆盖 `src/index.html`、`src/en/index.html`、`src/zh/index.html`。

> **核心约束：preview 是参考视觉。最终落地必须保留 `src/data/{en,zh}.js` 数据驱动模式与 `build.js` 的渲染管线，不许把文字硬编码进 `src/*.html`。**

## Pre-flight checks

1. 确认 `src/data/en.js` 和 `src/data/zh.js` 字段没变（设计稿没引入新字段）。
2. 确认 `public/images/profile.webp` 和 `profile-optimized.jpg` 存在（预览版用的就是这两个）。
3. 看一眼旧 `src/en/index.html` 模板里都用了哪些占位符：`{{title}}` `{{description}}` `{{name}}` `{{jobTitle}}` `{{{tagline}}}` `{{summaryTitle}}` `{{summarySubtitle}}` `{{#each summary}}` `{{experienceTitle}}` `{{#each jobs}}` `{{educationTitle}}` `{{#each education}}` `{{patentTitle}}` `{{patent.id|name|url}}` `{{leadershipTitle}}` `{{#each leadership}}` `{{beyondTitle}}` `{{#each beyond}}` `{{copyright}}`。落地版本必须把这些占位符全部接回来。

## Step 1 — 替换 `src/index.html`（首页语言入口）

来源：`docs/design/preview/index.html`

改动要点：
- 这是纯静态语言入口页，**不走数据模板**，直接覆盖即可。
- 检查：保留原文件里的 `<link rel="alternate" hreflang>` 和 `<link rel="canonical">`（preview 版已经包含，确认 URL 是 `https://lizheng.dev/...` 即可）。
- 预览版里的 `localStorage` 块只是个示意，按 preview 原样保留就好。

## Step 2 — 替换 `src/en/index.html`

来源：`docs/design/preview/en/index.html`

逐字段把硬编码内容换回 Handlebars：

| Preview 里的硬编码 | 替换为 |
|---|---|
| `<title>Zheng Li - Principal ...` | `<title>{{title}}</title>` |
| `<meta name="description" content="Zheng Li is...">` | `<meta name="description" content="{{description}}">` |
| Hero `<h1>Zheng Li</h1>` | `<h1>{{name}}</h1>` |
| `<p class="role">Principal Software ...</p>` | `<p class="role">{{jobTitle}}</p>` |
| Tagline 整段 `15 years building ...` | `<p class="tagline">{{{tagline}}}</p>` ⚠️ **三花括号**，因为 `tagline` 含 `<br>` 和 `<span class="marked">` |
| 头像 alt | `alt="{{name}}"` |
| Summary section h2 `Professional Summary` | `<h2><span class="num">01</span>{{summaryTitle}}</h2>` |
| Summary subtitle `Engineering Leader ...` | `<p class="summary-subtitle"><strong>{{summarySubtitle}}</strong></p>` |
| Summary 两段 p | `{{#each summary}}<p>{{this}}</p>{{/each}}` |
| Experience section h2 | `<h2><span class="num">02</span>{{experienceTitle}}</h2>` |
| 三个 `<article class="job">` | 一个 `{{#each jobs}} <article class="job">...</article> {{/each}}` 循环，里面用 `{{company}}` `{{title}}` `{{meta}}` `{{#each items}}<li>{{this}}</li>{{/each}}` |
| `{{#if title}} <span class="role-line">{{title}}</span> {{/if}}` | 仅当 `title` 非 null 时渲染（参考旧模板写法） |
| Education section h2 | `<h2><span class="num">03</span>{{educationTitle}}</h2>` |
| 两个 `.edu` 行 | `{{#each education}}` 循环，字段 `school` `degree` `year` |
| Patent h2 | `<h2><span class="num">04</span>{{patentTitle}}</h2>` |
| Patent 行三段 span | `{{patent.id}}` `{{patent.name}}` `{{patent.url}}`；链接文案用 `{{patent.linkText}}` |
| Leadership section h2 | `<h2><span class="num">05</span>{{leadershipTitle}}</h2>` |
| Leadership 两段 prose | `{{#each leadership}}<p>{{this}}</p>{{/each}}` |
| Beyond section h2 | `<h2><span class="num">06</span>{{beyondTitle}}</h2>` |
| Beyond 两段 prose | `{{#each beyond}}<p>{{this}}</p>{{/each}}` |
| Footer copyright | `<span>{{copyright}}</span>`（注意 `{year}` 字符串替换由 `build.js` 处理；如果原 build 用的是客户端 `<span id="year">` 占位，保留即可） |

**Tagline `<br>` 的处理：** `src/data/en.js` 里的 tagline 是 `"15 years building web & mobile software.<br>Now rebuilding myself for the AI era."` 已含 `<br>`。preview 版加了 squiggle `<span class="marked">...</span>` 包裹关键词——这部分需要在数据层里加进去：

```js
// src/data/en.js
tagline: "15 years building web & mobile software.<br>Now <span class=\"marked\">rebuilding myself<svg viewBox=\"0 0 260 18\" preserveAspectRatio=\"none\"><path d=\"M3 12 C 50 4, 120 17, 180 9 S 250 5, 257 11\"/></svg></span> for the AI era.",
```

⚠️ 同步在 `zh.js` 也加 `<span class="marked">...</span>`，包裹的关键词中文用 `"AI 时代"`，参考 preview 里 zh/index.html 的 svg path。

## Step 3 — 替换 `src/zh/index.html`

同 Step 2，字段映射完全一样（中英共用同一套数据 schema）。区别只在：
- 字体引入需要保留 Noto Serif/Sans SC。
- section 标号副文本是中文（"01 — 当下" 等），但 section title 仍走 `{{summaryTitle}}` 等占位符，文案来自 `zh.js`。
- 顶部切换 pill：`{{alternateLang}}` 走 `EN | English`。

## Step 4 — 路径修正

预览版里头像路径是 `../images/profile.webp`（OD 沙盒相对路径）。**落地到 src 时改回 `/images/profile.webp` 和 `/images/profile-optimized.jpg`**——`build.js` 会把 `public/` 复制到 `dist/` 根部，浏览器访问域名根能找到。

## Step 5 — `src/data/cover-*.js` 与 `src/cover/`

旧站有 cover 路由（landing splash）。新设计的"首页 = 语言入口"已经承担了 cover 角色，建议：

- **方案 A（推荐）**：保留 cover 路由暂不动，新首页和 cover 共存，等 owner 决定。
- **方案 B**：移除 cover 路由 + `src/data/cover-*.js`。需要同时更新 `build.js` 的 routes 列表。

**不要擅自删除 cover，先问 owner。**

## Step 6 — 字体引入合并

新增 webfont 链接（写在 `<head>` 里，三个 HTML 都要加）：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;500&family=Noto+Sans+SC:wght@400;500&display=swap">
```

英文页可以省略 Noto Serif/Sans SC 减一次下载，中文页必须留。

## Step 7 — `public/css/style.css`

旧模板用了 `<link rel="stylesheet" href="/css/style.css">`。新设计的 CSS 全部内联在 `<style>` 块里。两条路：

- **A**：把内联 CSS 抽到 `public/css/style.css`，旧 link 标签保留。优点：可缓存。
- **B**：直接删 link 标签，CSS 留在 `<style>` 里。优点：少一次 HTTP 请求，HTML 体积仍 < 24 KB。

推荐 B（更简单，性能差距忽略不计）。

## Step 8 — `main.js` 旧脚本

旧 `src/{en,zh}/index.html` 末尾有 `<script defer src="/main.js"></script>`，负责 theme toggle 和 copyright 年份。

新设计：
- ✗ **theme toggle 已删除**（设计稿是单一 light 主题，没做暗色版本）。
- ✓ 年份用 inline `<script>document.getElementById('year').textContent = new Date().getFullYear();</script>`，preview 里已经写好。

所以可以删 `public/main.js` 的引用，或者把 `main.js` 内容清空只留年份逻辑——看 owner 是否未来要重新加 theme toggle。**建议保留文件、注释掉 theme toggle 代码**，方便回滚。

## Step 9 — 验证

```bash
bun install         # 确保依赖在
bun run lint        # biome 通过
bun run typecheck   # tsc --noEmit
bun run dev         # 本地起 server
```

打开 `http://localhost:<port>/`、`/en/`、`/zh/`：

- [ ] 首页：三张 portal 卡片（Résumé · EN / 简历 · 中文 / Blog & writing）+ social pill 行（GitHub / LinkedIn / X）
- [ ] 简历页：sticky topbar、头像可见、tagline 里有 squiggle 划线、6 个编号 section、background blob 隐约可见
- [ ] 中文页字体降级正确（不变成楷体/宋体系统字）
- [ ] 简历页 Cmd+P → PDF 不含 topbar/flourish/超链装饰
- [ ] mobile 视口（< 640px）章节编号变成 inline，正文左对齐
- [ ] 所有外链 `target="_blank" rel="noopener"`

## Step 10 — 部署

```bash
bun run build     # → dist/
bun run preview   # wrangler dev 本地验证
bun run deploy    # wrangler deploy
```

## 出错时的回滚

旧 src/ 在 git 里有完整 history，`git checkout HEAD~1 -- src/` 即可。

## 不要做的事

- ❌ 不要往 HTML 里硬写姓名、工作经历、年份等任何数据
- ❌ 不要新增 `src/data/*.js` 字段（设计稿不需要）
- ❌ 不要把 `public/images/profile.webp` 删掉换别的图
- ❌ 不要动 `worker/`、`wrangler.jsonc`、`build.js`（除非 cover 路由有变化）
- ❌ 不要把番茄红 accent 用超过 4 次（视觉破产警戒线）
- ❌ 不要把 mint / sun / sky 当作 accent 用（这三个只能做背景柔光）
