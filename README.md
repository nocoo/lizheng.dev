<h1 align="center">lizheng.dev / lizheng.me</h1>
<p align="center">双语简历与交互式个人设备收藏。</p>
<p align="center"><a href="https://lizheng.dev">站点</a> · <a href="docs/README.en.md">English</a></p>

## 这是什么

一个无状态 Cloudflare Worker 提供两种体验：[lizheng.dev](https://lizheng.dev) 展示双语简历，[lizheng.me](https://lizheng.me) 展示可交互的个人设备收藏。两者支持中英文、系统／浅色／深色主题，并通过共享导航连接主页、博客、简历与作品集。

## 功能

- 由[四份公开 Markdown](docs/content/README.md)生成完整 HTML，核心内容和链接在关闭 JavaScript 时仍可访问。
- 简历使用轻量 DOM 客户端；设备收藏按需接入屏幕交互、控件与章节导航。
- 设备页支持键盘导航、章节选择与自动轮播暂停。
- 保留 lizheng.me 历史博客地址到 lizheng.blog 的精确 301 跳转。
- 两个站点共享版本来源，页面页脚与 `/api/live` 使用根 `package.json` 版本。

## 使用

打开[简历](https://lizheng.dev)或[个人主页](https://lizheng.me)，切换语言与主题。设备页用 ↑ / ↓ 选择屏幕链接，← / → 切换设备，Enter 打开链接；也可直接点击章节导航或暂停轮播。

## 开发

需要 Bun 1.4.0 与 Node.js 26+（CI 使用 26.8.1）。

```sh
bun install --frozen-lockfile
bun run dev
bun run build
```

本地 Caddy 将[简历预览](https://lizheng-dev.dev.hexly.ai)和[主页预览](https://lizheng-me.dev.hexly.ai)代理到 `127.0.0.1:7046`。界面分别位于 `apps/resume/`、`apps/landing/`，共享模型与发布代码位于 `packages/`、`scripts/`，Worker 路由位于 `worker/`。

公开内容以 `docs/content/` 的四份文档为准；历史归档不属于当前编辑和发布输入。主分支通过 CI 后，现有 Release 流程部署已验证的 Worker 与静态资源，详见[发布说明](docs/11-release-implementation.md)。

## 测试

```sh
bun run typecheck
bun run lint
bun run check:docs
bun run test:coverage
bun run test:http
bunx playwright install chromium firefox webkit
bun run test:browser
bun run test:performance
bun run test:development
```

Vitest 检查内容、发布与 Worker 逻辑；HTTP 与浏览器测试使用隔离 workerd、独立资源和 `17046` / `27046` 端口。浏览器测试涵盖三种引擎、无障碍和视觉回归；性能与开发体验检查单独运行，浏览器套件依次执行。简历截图为本地与 CI 的系统字体差异保留独立基线。

## 技术栈

| 技术 | 用途 |
| --- | --- |
| React、TypeScript | 内容渲染与交互 |
| Vite、Bun | 本地开发与 HTML 发布 |
| Cloudflare Workers | 双站路由、静态资源和历史跳转 |
| Biome、Vitest、Playwright | 静态、逻辑、HTTP 与浏览器检查 |

## 文档

- [当前文档索引](docs/README.md)与[架构](docs/06-architecture.md)。
- [本地开发](docs/12-local-development.md)与[发布说明](docs/11-release-implementation.md)。
- [设备旅程](docs/13-devices-journey.md)与[关联站点](docs/14-connected-surfaces.md)。
- [公开内容](docs/content/README.md)。

## 许可证

仓库未提供项目级 LICENSE；第三方依赖保留各自许可。
