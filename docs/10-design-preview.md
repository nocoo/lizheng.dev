# 10 — 设计优先的本机预览

设计已获用户批准，预览用于日常开发；完整质量与生产状态见 11。先松后紧的设计探索阶段已结束，当前逻辑变更执行 TDD 与完整门禁。

## 本机约定

已查询 nmem 记忆 25b22d6b-1df5-4491-ae4d-269a556f6442，并核对实际 Caddyfile：7045 已分配 Giraffe，7046 用于本项目主开发服务。两个访问面由 Host 区分，不额外启动辅助 Vite 端口。

| 用途 | 地址 / 端口 |
| --- | --- |
| 正式简历 | <https://lizheng-dev.dev.hexly.ai> |
| 掌机落地页 | <https://lizheng-me.dev.hexly.ai> |
| 主开发服务 | 127.0.0.1:7046 |
| 独立 L2 | 17046，已实现 |
| 独立 L3 | 27046，已实现 |

Caddy 使用已有本机 wildcard mkcert 证书。证书和私钥不入库。DNS 的 wildcard A 记录已指向 127.0.0.1，因此无需改 hosts。配置前备份，validate 成功后 graceful reload。

## 当前范围

新应用从四份公开 Markdown 构建。生产已切换至相同的新实现；本机预览与 L2/L3 仍使用独立端口和构建资产，避免测试请求生产。

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
| bun run assets:design | 从assets/source/portrait.jpeg 重建照片和点阵图 |
| bun run review:design | 使用本机 Chrome 截图并检查交互；输出至 .design-review，不锁定视觉基线 |
| bun run check:static / test:coverage | 当前 G1 与 ≥95% L1 门禁 |
| bun run build | 当前生产构建至 dist |

## 已实现的设计

简历：暖纸色与深色阅读面、Newsreader 标题、Source Sans 3 正文、细目录、原创照片衍生、六个完整正文部分、社交链接、双语和打印布局。主视图由 React 预渲染，浏览器只加载小型主题/目录脚本。

落地页：浅色塑料与深色石墨外壳、侧边厚度、接缝、凹陷 LCD、四阶点阵头像、红色电源灯、方向键、酒红 A/B、SELECT/START、扬声器槽和原创 ZL 标识。入场与屏幕唤醒有短动画，鼠标轻微倾斜响应；减少运动模式关闭空间运动。手机采用纵向滚动，保留完整机身。

四个屏幕链接可直接点击。上下选择链接，左右或 SELECT 切换介绍面；A 打开当前链接，B 返回，START 重播入场屏幕。方向键 / Enter / A / B 也可操作，Tab 仍使用正常网页焦点顺序。

全部 UI、CSS、浏览器逻辑与构建模块均新写。正文来自四份公开 Markdown。字体通过 Fontsource 自托管：Newsreader、Source Sans 3、Geist Mono、Space Grotesk、Silkscreen，采用对应包中的 OFL 授权；不依赖外部字体请求。新照片约 25 KiB，点阵图 984 bytes。

## 设计定稿时的验证证据

- Chrome 检查两站 × 两语言 × 两主题 × 1440×900 / 390×844，共 16 组截图；未出现页面运行错误或横向溢出。LCD 内容完整展示。
- 补查 320×568 与 844×390 中文页面，无横向溢出；手机完整机身可纵向滚动。
- 实际检查方向键、SELECT、A/B、START、键盘焦点、两个本机访问面之间导航、切换语言后的主题记忆。
- 通过本机 HTTP 检查 12 类旧博客 301，保留 pathname 与 query；.me/sitemap.xml 继续 301，新 sitemap-index.xml 返回 200；简历未知路径和内部 docs 请求为 404。
- 新静态构建的四页面在禁用 JavaScript 时仍有样式、完整正文与真实链接；打印保留简历身份与经历，并生成中英文 PDF；减少运动模式下实体按钮仍可用。
- frozen install、Biome（零 warning/error）、TypeScript 7 strict、旧 53 个回归均通过。已有覆盖率统计仍只衡量旧 build.js，不能当作新 UI/逻辑覆盖率。

本机截图与 JSON 记录在 .design-review；这不是需批准更新的快照测试。新构建中的浏览器 JS gzip 合计约为简历 0.6 KiB、掌机 64 KiB，尚未做完整网络/设备性能实验。

## 后续收紧边界

2026-09-05 视觉反馈已落实：简历照片由 25% 饱和度调整为 90% 饱和度、98% 对比度，恢复自然彩色。copyright、地点签名、抬头小标签和机身周围的装饰文案在中文模式中保留英文；正文与功能提示仍为中文。两份中文 Markdown 的页脚 metadata 同步更新。

两站页头统一使用掌机页的橙色四格标记与 Space Grotesk 字标，提取为共享 Brand 组件；favicon 同步采用微倾斜四格与暖纸/石墨配色，随浏览器系统主题切换。简历正文的 Newsreader / Source Sans 3 排版保留。

本次调整重新通过 16 组浏览器组合及交互 smoke，并人工检查了中文简历浅/深主题照片、共享字标和 favicon 两种配色；静态构建、类型检查、零 lint 与文档检查通过。

当前设计已批准并上线，旧 UI/构建已移除。版本仅在 footer 显示；两站地点签名统一为 MADE IN BEIJING，左侧暖色电源灯使用不对称曲线呼吸，减少运动模式保留静态光晕。生产和质量的最新证据均以 11 为准。

2026-09-05 追加装饰：简历照片边角增加橙白收藏球，与 Play side 的原创插图保持同一造型。桌面 42px、手机 32px，使用静态 SVG，不遮挡姓名、正文或照片主体；对辅助技术隐藏，打印时移除。对应博客也使用相同图形，保持三个访问面之间的联系。

此次简历装饰变更通过 Chromium、Firefox、WebKit 的 30 项简历回归（含无 JavaScript、图片失败及打印）和 axe 检查。本机 8 张简历视觉基线已更新，并再次运行 8 项 Chromium 对比通过；CI 字体版本的独立基线保持原样，未降低比较阈值。

2026-09-06 的 v3.1.0 发布核对补齐了上述 8 张 CI 基线中的收藏球。逐像素比较确认，每张图只需转入 705–1,258 个装饰像素，与平台字体差异没有交集；其余 CI 像素、图片尺寸和比较阈值均保留。完整回归与发布证据见 13 和 11。
