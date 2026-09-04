# 10 — 设计优先的本机预览

2026-09-05，用户已授权开始实现，并调整顺序为“先松后紧”：先快速实现两个访问面的完整视觉效果，通过本机预览迭代设计；用户满意后，再加强 6DQ、覆盖率和行为/视觉锁定。

本文件的阶段顺序优先于 07、08 中原有的逐功能严格 TDD 和先铺完整门禁的计划。保留现有 Husky、零 lint、严格类型检查、secret 检查及旧 301 回归；不为草稿布局建立全套快照与新覆盖率硬门槛。

## 本机约定

已查询 nmem 记忆 25b22d6b-1df5-4491-ae4d-269a556f6442，并核对实际 Caddyfile：7045 已分配 Giraffe，7046 用于本项目主开发服务。两个访问面由 Host 区分，不额外启动辅助 Vite 端口。

| 用途 | 地址 / 端口 |
| --- | --- |
| 正式简历 | <https://lizheng-dev.dev.hexly.ai> |
| 掌机落地页 | <https://lizheng-me.dev.hexly.ai> |
| 主开发服务 | 127.0.0.1:7046 |
| 后续独立 L2 | 17046，预留 |
| 后续独立 L3 | 27046，预留 |

Caddy 使用已有本机 wildcard mkcert 证书。证书和私钥不入库。DNS 的 wildcard A 记录已指向 127.0.0.1，因此无需改 hosts。配置前备份，validate 成功后 graceful reload。

## 当前范围

新应用从四份公开 Markdown 构建，两套视图、样式和浏览器逻辑重新编写。原始人像生成新的照片及点阵衍生。旧生产构建和 Worker 暂时保留，避免设计草稿触发上线；设计构建输出独立目录。仅本地提交 main，不推送生产。

## 启动与迭代

    bun install --frozen-lockfile
    bun run dev

上述命令启动 7046 的单个服务；Caddy 已在本机添加两个域名、通过 validate 并 graceful reload。原配置备份为 /opt/homebrew/etc/Caddyfile.lizheng-backup-20260905-065949。浏览器已通过实际 HTTPS 校验，无需跳过证书验证。

两站根地址根据 Accept-Language 进入 /en/ 或 /zh/。页头可切换语言与浅/深主题，主题保存在各站 localStorage；禁用存储时容忍失败。预览中两个访问面之间的链接指向本机 HTTPS 地址；canonical 仍为真实生产域名。开发响应携带 noindex。

常用命令：

| 命令 | 行为 |
| --- | --- |
| bun run dev | 新页面开发服务，TSX/CSS 支持 Vite 热更新 |
| bun run build:design | 输出四份完整 HTML、hash CSS/JS、公开 Markdown 和元信息至 .design-dist |
| bun run assets:design | 从原始 profile.jpeg 重建照片和点阵图 |
| bun run review:design | 使用本机 Chrome 截图并检查交互；输出至 .design-review，不锁定视觉基线 |
| bun run lint / typecheck / test:coverage | 现有 Husky 执行的基本质量检查 |
| bun run dev:legacy / build | 仍对应旧生产实现 |

## 已实现的设计

简历：暖纸色与深色阅读面、Newsreader 标题、Source Sans 3 正文、细目录、原创照片衍生、六个完整正文部分、社交链接、双语和打印布局。主视图由 React 预渲染，浏览器只加载小型主题/目录脚本。

落地页：浅色塑料与深色石墨外壳、侧边厚度、接缝、凹陷 LCD、四阶点阵头像、红色电源灯、方向键、酒红 A/B、SELECT/START、扬声器槽和原创 ZL 标识。入场与屏幕唤醒有短动画，鼠标轻微倾斜响应；减少运动模式关闭空间运动。手机采用纵向滚动，保留完整机身。

四个屏幕链接可直接点击。上下选择链接，左右或 SELECT 切换介绍面；A 打开当前链接，B 返回，START 重播入场屏幕。方向键 / Enter / A / B 也可操作，Tab 仍使用正常网页焦点顺序。

全部 UI、CSS、浏览器逻辑与构建模块均新写。正文来自四份公开 Markdown。字体通过 Fontsource 自托管：Newsreader、Source Sans 3、Geist Mono、Space Grotesk、Silkscreen，采用对应包中的 OFL 授权；不依赖外部字体请求。新照片约 25 KiB，点阵图 984 bytes。

## 本轮验证证据

- Chrome 检查两站 × 两语言 × 两主题 × 1440×900 / 390×844，共 16 组截图；未出现页面运行错误或横向溢出。LCD 内容完整展示。
- 补查 320×568 与 844×390 中文页面，无横向溢出；手机完整机身可纵向滚动。
- 实际检查方向键、SELECT、A/B、START、键盘焦点、两个本机访问面之间导航、切换语言后的主题记忆。
- 通过本机 HTTP 检查 12 类旧博客 301，保留 pathname 与 query；.me/sitemap.xml 继续 301，新 sitemap-index.xml 返回 200；简历未知路径和内部 docs 请求为 404。
- 新静态构建的四页面在禁用 JavaScript 时仍有样式、完整正文与真实链接；打印保留简历身份与经历，并生成中英文 PDF；减少运动模式下实体按钮仍可用。
- frozen install、Biome（零 warning/error）、TypeScript 7 strict、旧 53 个回归均通过。已有覆盖率统计仍只衡量旧 build.js，不能当作新 UI/逻辑覆盖率。

本机截图与 JSON 记录在 .design-review；这不是需批准更新的快照测试。新构建中的浏览器 JS gzip 合计约为简历 0.6 KiB、掌机 64 KiB，尚未做完整网络/设备性能实验。

## 后续收紧边界

设计等待用户评审。完整 6DQ 评级、跨浏览器矩阵、axe/对比度与触控目标系统检查、真实 Worker 集成、生产 CSP/缓存、正式 OG 配图、独立掌机 ViewModel、内容 schema 与覆盖率门禁尚未完成。下一步先依据视觉反馈修改，不提前冻结本版布局。

生产 lizheng.dev / lizheng.me 和 Cloudflare Worker 未切换；旧 UI/构建仅保留用于当前生产与回滚，新访问面不引用它们。工作按工具链、简历、掌机与预览分别提交到本地 main，未推送触发生产部署。
