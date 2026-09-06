# 03 — 域名、旧博客 301 与公开路由契约

基线：worker/index.ts 与 tests/worker.test.ts，commit bf23331。此文档足以独立重新实现兼容行为。现有实现与断言在替代实现通过之前保留。

## 不变的访问域名

- 简历：lizheng.dev、www.lizheng.dev。
- 落地页：lizheng.me、www.lizheng.me。
- 博客跳转目标：<https://lizheng.blog>。
- 继续使用 Cloudflare Workers + Static Assets，生产 Worker 标识保留 lizheng-dev。

www 和非 www 均可访问；页面 canonical 使用非 www。新实现按 URL.hostname 分域，在本地测试中也正确处理端口。

## 旧 301 的精确匹配

以下规则仅对两个 .me 主机生效。按 URL.pathname 匹配，状态必须为 301，Location 为固定 <https://lizheng.blog> + 原 pathname + 原 search。不得丢失查询参数、自动补斜杠、改变大小写或二次编码路径。URL fragment 不属于 HTTP 请求，服务端无法转发。

| 正则 | 代表性输入 | 预期 |
| --- | --- | --- |
| ^/\d{4}/\d{2}/ | /2024/01/some-post | 301，路径保持 |
| ^/category(/\|$) | /category、/category/tech | 301 |
| ^/tag(/\|$) | /tag、/tag/javascript | 301 |
| ^/archive(/\|$) | /archive、/archive/2024 | 301 |
| ^/search$ | /search | 301 |
| ^/feed\.xml$ | /feed.xml | 301 |
| ^/feed$ | /feed | 301 |
| ^/page/ | /page/2 | 301 |
| ^/preview/ | /preview/secret | 301 |
| ^/sitemap\.xml$ | /sitemap.xml | 301 |
| ^/admin(/\|$) | /admin、/admin/posts | 301 |
| ^/login$ | /login | 301 |

表格中的 \| 表示正则 alternation 的竖线，并为 Markdown 表格转义；它不是 URL 的字面字符。

关键边界：/categoryish、/tagline、/2024/1/post、/search/、/feed/、/page、/preview、/login/、/SITEMAP.xml 不匹配上述规则。不能因“看起来像博客”而扩大永久跳转范围。

示例：<https://www.lizheng.me/tag/js?ref=feed&lang=zh> → 301 <https://lizheng.blog/tag/js?ref=feed&lang=zh>。相同路径在 .dev 不跳转到博客。

## 当前兼容层行为

1. .me 下 /cover/ 及其子路径直接 404，不读取资产。
2. 上述博客规则 301，且不调用资产存储。
3. .me 的 /、/en、/en/、/zh、/zh/ 返回落地页；目前通过内部 /cover/ 目录实现，新目录可改。
4. .me 静态文件目前按包含点且非 .xml 的启发式透传。
5. .me 未知路径目前 302 到 /en/ 或 /zh/；首选 Accept-Language 为中文则 zh，否则 en。
6. .dev 当前全部交给资产服务，未知资源由真实资产服务返回 404。现有 mock 返回 200 仅表示“转发成功”，不是生产状态契约。

新实现保留 301 和语言页面；静态文件启发式改为明确的公开资产/内容路由，避免新 sitemap、robots 和 Markdown 端点被吞掉。2026-09-07 的 SEO 优化将真正未知的 .me 路径改为 404，根路径语言 302 不变，见 [15](15-seo-agent-social.md)。上面的兼容层清单记录重建前的基线。

## 重构后的处理顺序

| 优先级 | 请求 | 行为 |
| --- | --- | --- |
| 1 | 内部资产前缀 /_sites/、.me 下旧 /cover/* | 404，禁止公开访问内部 HTML |
| 2 | .me 旧博客模式 | 原样 301 到博客，包括 /sitemap.xml |
| 3 | /robots.txt、/llms.txt、内容与新 sitemap 端点 | 按访问域名选择显式资源，200 与正确 Content-Type |
| 4 | / | 302 到对应语言首页；客户端无需先执行语言跳转脚本 |
| 5 | /en、/zh 及带斜杠形式 | 对应访问面的语言 HTML，200；canonical 为带斜杠 URL |
| 6 | /assets/*、favicon、touch icon、OG 图片 | 只读取新构建的公开资产 |
| 7 | 未知路径 | 两个访问面均返回真实 404，不把不存在的内容指向首页 |

根路径语言响应必须包含 Vary: Accept-Language，并避免把一个用户的语言 302 长期缓存给其他用户。显式语言 URL 不按浏览器偏好再跳转。

不得把域名写进测试的网络目的地址来请求生产。测试经本地入口或测试域名区分主机，见 [07](07-quality-and-tdd.md)。

## SEO 与 agent 端点

| 路径 | .dev | .me |
| --- | --- | --- |
| /robots.txt | 指向本站 sitemap | 指向本站新 sitemap |
| /sitemap.xml | 本站简历 sitemap | **保持旧 301**，不可改成个人入口 sitemap |
| /sitemap-index.xml | 可选 sitemap index | 本站 sitemap index |
| /sitemap-pages.xml | 可选 | 本站 en/zh 页面列表 |
| /llms.txt | 本站说明及两种简历 Markdown 链接 | 本站说明及两种入口 Markdown 链接 |
| /en/content.md、/zh/content.md | 完整对应简历 | 完整对应入口内容 |

HTML 公开链接到对应 Markdown，并使用 rel=alternate / type=text/markdown。Markdown 与页面内容一致，Content-Type 为 text/markdown; charset=utf-8。HTML 与 Markdown 的 HTTP Link 指向 llms.txt；Markdown 的 canonical 指向同语言 HTML。llms.txt 由两种语言的公开内容在构建时生成，再通过对应访问面的资产提供。不做 User-Agent 专属内容，不向 bot 隐藏或增加用户看不到的职业事实。

## 必须先写的回归用例

- 12 类旧模式 × 两个 .me 主机；验证状态、完整 Location、资产服务未调用。
- 查询参数、中文百分号编码路径、边界非匹配、大小写；不自动跟随跳转。
- .dev 相同路径不被博客 301 捕获。
- 四个语言页面、两个根路由、两个 www 别名、无斜杠路径。
- .me /sitemap.xml 与新 sitemap 路径同时正确。
- robots、llms、Markdown、静态资源的内容、MIME 和域名边界。
- 内部路径不可访问；两个访问面未知路径均为真 404。
- 用真实 Worker + 实际构建资产走 HTTP，捕获内部路径重定向泄漏、canonical 串域和缺失文件。

现有 tests/worker.test.ts 中 301 相关断言可以继承。它们属于 L1，不能代替走真实 HTTP 的 L2。
