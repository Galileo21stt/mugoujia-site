---
name: modern-web-guidance
description: "适用于 HTML、CSS、DOM、浏览器端 JS、移动端适配、性能和可访问性任务；开始前检索并读取 GoogleChrome Modern Web Guidance CLI 的相关指南。纯后端、CI 和文案任务无需触发。"
---

# Modern Web Guidance — Claude Code 入口

先读取并遵循仓库根目录的 `.agents/skills/modern-web-guidance/SKILL.md`（这是统一的技能定义，不能跳过）。

使用上游 GoogleChrome 官方 CLI，先 `npx -y modern-web-guidance@latest search "<2–5 个英文词描述网页能力>"`，再用实际返回的指南 ID 运行 `npx -y modern-web-guidance@latest retrieve "<guide-id>"`。只采用与当前任务相关的规范，兼顾 iPhone/iPad Safari 和桌面浏览器。完成后执行 AGENTS.md 的现有验收，不修改无关业务内容，也不要假称已运行测试。

来源：<https://github.com/GoogleChrome/modern-web-guidance>
