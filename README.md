# CrewMarket

> 基于 [CrewAI](https://www.crewai.com/) 的多智能体电商营销内容生成系统 — 从产品图/描述到上架文案、SEO 与社媒内容的一站式生成。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-orange)](https://www.crewai.com/)
[![Next.js](https://img.shields.io/badge/Next.js-App-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)

## 简介

CrewMarket 面向电商运营与内容团队，通过多智能体协作，自动完成产品信息提取、市场分析、文案撰写、SEO 优化与社交平台适配，输出结构统一、可直接用于商品上架与前后端联调的营销物料。

**仓库地址：** [github.com/lnlll162/crewmarket](https://github.com/lnlll162/crewmarket)

## 功能概览

| 能力 | 说明 |
|------|------|
| 产品信息提取 | 从图片或文字描述中识别品类、卖点与关键属性 |
| 市场与竞品分析 | 归纳趋势、竞品文案风格与目标用户画像 |
| 电商文案生成 | 标题、详情页、核心卖点与转化导向描述 |
| SEO 优化 | 关键词列表与自然嵌入的搜索友好文案 |
| 社媒适配 | 小红书、微博、抖音等平台短文案与话题标签 |
| 结构化输出 | JSON 结果，便于前端展示与后端接口对接 |

## 智能体分工

- **市场调研员** — 类目趋势、竞品特点、用户画像
- **文案策划师** — 标题、卖点、详情页内容
- **SEO 优化师** — 关键词与搜索友好文案
- **社交媒体运营** — 多平台短文案与脚本建议
- **汇总协调 Agent** — 去重、统一风格、输出完整物料包

## 项目规范（Cursor Rules）

本仓库通过 Cursor 规则约束产品方向与开发标准，在 Cursor 中打开项目即可自动生效：

| 规则文件 | 用途 |
|----------|------|
| `crewai-ecommerce-content-system.mdc` | 系统总体目标、输入输出与协作原则 |
| `crewai-ecommerce-agents.mdc` | 智能体分工与输出要求 |
| `crewai-ecommerce-api-contracts.mdc` | 前后端接口规范与联调约定 |
| `crewai-ecommerce-development-standards.mdc` | 技术栈、目录结构与代码规范 |

## 推荐技术栈

- **前端：** Next.js、TypeScript、Hero UI、Tailwind CSS
- **AI：** CrewAI 多智能体编排
- **接口：** 统一 `{ code, message, data }` 返回结构

## 开发原则

- 界面精致且实用，避免过度设计
- API 契约稳定、明确、可扩展
- AI 提示词结构化、可复用
- 优先可维护的实现，避免过度工程化

## 快速开始

```bash
git clone https://github.com/lnlll162/crewmarket.git
cd crewmarket
```

当前仓库为**规范与规则基线**，应用脚手架与 API 实现将在后续迭代中补充。

## 路线图

- [ ] Next.js 应用脚手架
- [ ] 产品分析与内容生成 API
- [ ] 前端内容预览与导出
- [ ] CrewAI 工作流集成

## 许可证

MIT License — 详见 [LICENSE](LICENSE)。
