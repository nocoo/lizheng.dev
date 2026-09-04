# Design system

## Palette (OKLch only — no hex)

```css
:root {
  --bg:        oklch(98% 0.006 85);   /* 纸白底 */
  --paper:     oklch(96% 0.008 85);   /* 卡片底 */
  --ink:       oklch(20% 0.025 260);  /* 主文字（偏冷的墨色，非纯黑） */
  --ink-soft:  oklch(38% 0.02 260);   /* 次级文字 */
  --muted:     oklch(56% 0.015 260);  /* meta / 注释 */
  --rule:      oklch(86% 0.012 85);   /* 主分隔线 */
  --rule-soft: oklch(91% 0.01 85);    /* section 间淡分隔线 */

  --tomato:    oklch(63% 0.19 35);    /* 唯一 accent — 番茄橘红 */
  --mint:      oklch(78% 0.10 165);   /* 仅插画 / 装饰，禁止做 accent */
  --sun:       oklch(86% 0.13 95);    /* 仅插画 / 装饰 */
  --sky:       oklch(82% 0.07 230);   /* 仅插画 / 装饰 */
}
```

### Accent 纪律（硬约束）

- **每屏可见 `--tomato` 使用次数 ≤ 4**（首页/简历皆如此）。
- 首页用法：menu chip / squiggle 划线 / portal italic 词 / pulse 信号灯 — 选其中 3–4 个，不要全用。
- 简历页用法：每个 section 编号（如 `01 — 当下`）+ tagline 里一个手绘 squiggle 词 + role pill 边框。
- mint / sun / sky 这三个**只**用于背景柔光圆斑与少量手绘 deco，绝不作为按钮/文字 accent。

### 背景柔光（页面通用 flourish）

```css
.flourish { position: fixed; inset: 0; pointer-events: none; z-index: -1; overflow: hidden; }
.flourish .blob {
  position: absolute; border-radius: 50%;
  mix-blend-mode: multiply; filter: blur(60px);
}
.blob.b1 {
  top: -16vh; right: -10vw;
  width: 50vw; height: 50vw;
  background: var(--sun); opacity: 0.32;
}
.blob.b2 {
  bottom: -22vh; left: -12vw;
  width: 42vw; height: 42vw;
  background: var(--mint); opacity: 0.22;
}
.grid-lines {
  position: absolute; inset: 0;
  background-image: linear-gradient(to right, oklch(20% 0.025 260 / 0.035) 1px, transparent 1px);
  background-size: 80px 100%;
}
```

- 首页 opacity 用 `0.55 / 0.4`（更醒目）。
- 简历页 opacity 用 `0.32 / 0.22`（克制版）。
- `@media print` 必须隐藏 `.flourish`，保证打印/PDF 干净。

## 字体

```css
--serif: 'Instrument Serif', 'Noto Serif SC', 'Iowan Old Style', Georgia, serif;
--sans:  'IBM Plex Sans', 'Noto Sans SC', -apple-system, BlinkMacSystemFont,
         'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif;
--mono:  'IBM Plex Mono', ui-monospace, Menlo, monospace;
```

Google Fonts 引入：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;500&family=Noto+Sans+SC:wght@400;500&display=swap">
```

- 中文版需要 Noto Serif/Sans SC fallback；英文版可不引 Noto SC（节省一组下载）。
- Instrument Serif 用 `font-style: italic` 时风格非常突出，是设计的灵魂。**只在姓名 / section 标题 / tagline 关键词上用 italic**，别全篇 italic。

## Type scale

| 角色 | 字号 | 字体 | 行高 | letter-spacing |
|---|---|---|---|---|
| H1（姓名） | `clamp(48px, 7.5vw, 76px)` (en) / `clamp(44px, 6.8vw, 68px)` (zh) | serif 400/500 | 0.98 / 1.05 | -0.02em |
| Section h2 | `clamp(26px, 3vw, 32px)` | serif 400/500 | 1.15 | -0.01em |
| Tagline | `clamp(18px, 2vw, 22px)` italic | serif | 1.45 | 0 |
| Job h3 / Edu h4 | 20–22px | serif 400/500 | 1.2 | -0.005em |
| Body | 15.5px | sans 400 | 1.65 (en) / 1.75 (zh) | 0 |
| Meta / 编号 / mono labels | 11–12px | mono 400/500 | 1 | 0.04–0.18em |
| ALL CAPS labels | 11px | mono 500 | 1 | **0.18em（必须 ≥ 0.06em）** |

## 主要组件

### 1. Topbar（简历页）

- sticky 顶 bar，半透明 + backdrop blur
- 左：`◇ lizheng.dev`（番茄菱形 + mono 小标）
- 右：单一切换 pill：英文版显示 `EN | 中文`，中文版显示 `EN | English`
- 背景色 `oklch(98% 0.006 85 / 0.7)`，下边线用 `--rule`

### 2. 头像

- 圆形，paper 底，1px rule 边
- 内容用 `<picture>`：`profile.webp` + `profile-optimized.jpg` fallback
- 简历页尺寸：`clamp(110px, 16vw, 148px)`
- 上线后路径用 `/images/profile.webp`（绝对路径）

### 3. 简历正文宽度

```css
--max: 1080px;        /* 整页容器最大宽 */
.prose { max-width: 72ch; margin-left: 46px; }    /* en */
.prose { max-width: 44em; margin-left: 46px; }    /* zh */
```

- mobile（≤ 640px）取消 `margin-left: 46px`、section 编号改成 inline。

### 4. Tagline 上的手绘 squiggle

italic 关键词包一个超薄 SVG 划线作为装饰，是设计的一个 "decisive flourish"：

```html
<span class="marked">关键词<svg viewBox="0 0 260 18" preserveAspectRatio="none">
  <path d="M3 12 C 50 4, 120 17, 180 9 S 250 5, 257 11" />
</svg></span>
```

```css
.marked { color: var(--tomato); position: relative; white-space: nowrap; }
.marked svg {
  position: absolute; left: -1%; right: -1%; bottom: -0.16em;
  width: 102%; height: 0.32em; pointer-events: none;
}
.marked svg path { fill: none; stroke: var(--tomato); stroke-width: 3; stroke-linecap: round; }
```

每页 **只在 tagline 里出现一次**，别多。

### 5. Job / Edu 行

- Job head：左侧公司名（serif）+ 角色 pill（mono uppercase + 番茄红 0.35 透明度边框）；右侧时间 meta（mono muted）。
- 列表项：左侧 6px 短横线代替圆点，`padding-left: 18px`。
- Edu 行：dashed 虚线分隔，左侧学校名 + degree，右侧 year。

### 6. Print 样式

每个简历页都带 `@media print`：

- 隐藏 `.topbar`、`.flourish`、`.foot a`
- 头像隐藏
- 字号转 10–14pt
- `.section { break-inside: avoid; }`

让 Cmd+P 直接得到一份能寄人事的 PDF。

## Anti-AI-slop 检查（合规清单）

- ❌ 无 indigo `#6366f1`
- ❌ 无 purple → blue trust 渐变
- ❌ 无 emoji feature icon（用 mono-line SVG）
- ❌ 无圆角卡 + 左侧色条
- ❌ 无凭空数字（120%+ ROI 是来源文字，不算）
- ❌ 无 lorem ipsum
- ✅ serif 用在 display，sans 用在 body
- ✅ 番茄红 accent 全屏 ≤ 4 次
- ✅ 一个 decisive flourish（squiggle）
