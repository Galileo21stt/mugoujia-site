# AI Agent 工作约定

1. 修改前阅读 `README.md`、`sources.md`。本站是离线可用的原生 HTML/CSS/JS/SVG 静态站点，源文件主要位于 `site/`，不要平白引入构建系统或运行时依赖。
2. 保持 `#map`、`#timeline`、`#compare`、`#fashi`、`#cases`、`#draw`、`#quiz` 路由和 localStorage 学习记录兼容；重构 SVG 引擎不得改变构件坐标、学术依据或绘图步骤。
3. `site/img/` 含教学资料及有限许可图片。保留原始图和授权来源，禁止公开再分发受限图片，不应因网站优化擅自替换。
4. 代码修改后至少检查静态语法、离线打开和上述关键路由的桌面/手机显示。仓库已有 `node tools/cdp.mjs <配置.json>` 截图方式，可在本地有 Chrome 和相应配置时使用；没有 Playwright 不要求新增依赖。
5. 在独立分支提交 PR；未经确认不合并、不发布。

## Modern Web Guidance（前端任务必读）

- 修改 HTML、CSS、SVG 交互、浏览器 JS、响应式布局、无障碍或前端性能之前，先读取 `.agents/skills/modern-web-guidance/SKILL.md`；Claude Code 也可通过 `.claude/skills/modern-web-guidance/SKILL.md` 调用。使用 GoogleChrome 官方 CLI 先 `search` 再 `retrieve`，只应用与当前任务相关的指南。
- 用户主要用手机、iPad 和电脑复习。核对 iOS Safari 与 Chromium，兼顾触控、键盘可达性、窄屏溢出和 `prefers-reduced-motion`；非广泛支持的特性必须有恰当降级。
- 这是编码指导，不是自动重构指令。保持既有页面行为、路由、存储键、题目内容与权限边界。先跑项目原有测试，再按需用 Playwright 做移动端（390px、768px）与桌面端（1440px）的冒烟检查；未配置 Playwright 时使用本仓库现有浏览器验收方式，不要强装依赖。
- 仅在独立分支开发并通过 PR 评审；未经确认不合并、不部署。报告实际执行的命令与结果，不能把计划中的验收写成已通过。
