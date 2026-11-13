---
name: modern-web-guidance
description: "前端 HTML、CSS、DOM、浏览器端 JavaScript、响应式布局、动画、交互、可访问性或网页性能任务开始前，必须先通过 GoogleChrome Modern Web Guidance CLI 搜索并读取相关指南。纯后端、数据库、CI、Git、测试脚手架和简单文案任务无需触发。"
---

# Modern Web Guidance（仓库级 Skill 入口）

上游：<https://github.com/GoogleChrome/modern-web-guidance>

这是官方 Modern Web Guidance **CLI 的调用入口**，不是对其指南的静态复制。各 Agent 应读取本文件，再通过官方 CLI 获取当前指南；不要凭记忆编造指南 ID、浏览器支持范围或 API 建议。

## 何时触发

修改网页 UI、HTML、CSS、浏览器端 JS、SVG 交互、响应式布局、表单、动效、可访问性、加载/渲染性能或浏览器兼容性时，**先检索，再动手**。不因纯后端 API、数据库、构建工具、版本管理、测试基础设施或文字改动而触发。

## 固定流程

1. 用简短、单一的浏览器能力描述（2–5 个英文词，避免项目名）搜索：

   ```bash
   npx -y modern-web-guidance@latest search "responsive data table"
   ```

2. 根据返回结果的 **description** 选确实相关的指南 ID，再检索全文：

   ```bash
   npx -y modern-web-guidance@latest retrieve "<实际检索得到的-guide-id>"
   ```

   没有相关结果时换一种同义词再查一次；仍无结果，按现有项目规范实施，不得随意套用无关指南。

3. 仅把适用建议用于本次需求，不进行无关的大规模重构。凡非 Baseline Widely available 的能力，必须按指南落实浏览器兼容性和降级方案；重点检查 iPhone/iPad Safari 以及 Chromium。
4. **本仓库 AGENTS.md、README 和现有构建/测试要求优先**。保留既有业务、个人数据、题库、图片、路由和存储键。完成后运行本仓库原有测试；有 Playwright 时补充移动端/桌面端浏览器冒烟测试，不能以 Playwright 取代原有检查。
5. 交付说明列出检索并实际采用的指南 ID、关键兼容性取舍、执行过的测试及未能执行的测试；不要声称未运行的测试已经通过。

## 环境说明

首次运行 npx 可能需要 npm 网络权限和确认，之后可通过 npm 缓存使用。仅允许执行 `modern-web-guidance` 所需的命令，不为此全局放开任意 `npx` 权限。CLI 未安装或网络不可用时说明原因，不能假装已读取指南。

本入口不新增网站运行时依赖、不自动部署、不变更浏览器目标策略。