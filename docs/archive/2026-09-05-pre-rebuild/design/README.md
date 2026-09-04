# lizheng.dev — Redesign drop

完整重写的 UI 设计稿。**信息内容不变**（仍由 `src/data/{en,zh}.js` 驱动），只替换视觉系统与 HTML 模板。

## 目录

```
docs/design/
├── README.md              ← 本文件，总览
├── DESIGN_SYSTEM.md       ← 设计系统（tokens / 字体 / 色板 / 节奏）
├── APPLY.md               ← 给 coding agent 的逐步落地指南
└── preview/               ← 静态预览（HTML 写死文字，仅供肉眼比对设计稿）
    ├── index.html         ← 语言入口（首页）
    ├── en/index.html      ← 英文简历页（静态版）
    ├── zh/index.html      ← 中文简历页（静态版）
    └── images/            ← 用到的头像资源（与 public/images 同源，无需复制）
```

## 给 coding agent 的执行流

按顺序读：

1. **`DESIGN_SYSTEM.md`** — 了解 token、字体、色板、accent 用法约束。
2. **`preview/`** — 直接在浏览器打开 `preview/index.html` 看最终视觉效果（注意预览里图片用了相对路径 `../images/`，上线时改回 `/images/`）。
3. **`APPLY.md`** — 把 preview 中的 HTML 改造成 Handlebars 模板，覆盖 `src/index.html`、`src/en/index.html`、`src/zh/index.html`。

## 一句话原则

- **首页可以稍活泼**（手绘 squiggle、背景柔光圆斑、3 个 portal 卡片）
- **简历页保持传统简历布局**，只在 section 编号 + tagline 关键词处点缀同款 accent 色和淡淡的背景柔光
- **文字一字不动** — 全部来自现有 `src/data/{en,zh}.js`，不新增字段

## 设计师没动的东西

- `src/data/{en,zh}.js`（数据保留）
- `src/data/cover-*.js`（cover 路由如果不再需要可以问 owner）
- `public/images/profile*`（继续用）
- `build.js` / `serve.js` / `worker/` / `wrangler.jsonc`（构建链路不变）

## 设计师动过的东西

新增 `docs/design/` 文件夹本身。其他源码全部未触。
