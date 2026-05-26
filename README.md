# CrewMarket

> 基于 [CrewAI](https://www.crewai.com/) 的多智能体电商营销全链路生成系统 — 从产品图/描述到市场策略、营销内容、物料扩展与结果整合的一站式生成。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-orange)](https://www.crewai.com/)
[![Next.js](https://img.shields.io/badge/Next.js-App-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)

## 简介

CrewMarket 面向电商运营与内容团队，通过多智能体协作，自动完成产品信息提取、市场分析、品牌调性建议、营销文案生成、渠道适配与营销物料扩展，输出结构统一、可直接用于商品上架与前后端联调的营销方案。

**仓库地址：** [github.com/lnlll162/crewmarket](https://github.com/lnlll162/crewmarket)

## 功能概览

| 能力 | 说明 |
|------|------|
| 产品理解 | 从图片或文字描述中识别品类、卖点与关键属性 |
| 市场与品牌策略 | 归纳趋势、竞品风格、目标用户画像与调性建议 |
| 营销内容生成 | 标题、详情页、卖点、SEO、社媒、视频脚本与海报文案 |
| 营销物料生成 | 海报布局、分镜、画面提示词与后续视频生成扩展 |
| 结果整合 | JSON 结果统一收口，便于前端展示与后端接口对接 |

## 当前运行方式

- **首页主流程：** 前端采用分步串行调用，依次请求 `/api/product/analyze`、`/api/content/generate`、`/api/seo/optimize`、`/api/social/generate`、`/api/result/merge`
- **保留入口：** `/api/pipeline/run` 作为后端一键编排、调试与未来批处理入口保留
- **图片输入：** 支持首页上传图片或文字描述，识图链路由后端 AI Task 1 负责处理

## 智能体分工

- **产品提取 Agent** — 识图、属性提取、卖点总结
- **市场与品牌策略 Agent** — 类目趋势、竞品特点、用户画像、调性建议
- **营销内容 Agent** — 标题、卖点、详情页、SEO、社媒、视频脚本、海报文案
- **营销物料 Agent** — 海报布局、分镜、画面提示词与物料扩展
- **汇总协调 Agent** — 去重、统一风格、输出完整营销方案

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

### 环境要求

- Node.js 16+（推荐 18+）
- Python 3.10+（`py -3`）

### 安装与运行

```bash
git clone https://github.com/lnlll162/crewmarket.git
cd crewmarket

# 1. 前端依赖
npm install

# 2. Python / CrewAI 环境
npm run crew:setup

# 3. 配置硅基流动 Key（复制 docs/api/env.example → .env）
# SILICONFLOW_API_KEY=你的Key

# 4. 启动开发服务器
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，填写产品描述（可上传图片），点击「一键生成全部内容」。

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/pipeline/run` | 一键编排（前端主入口） |
| POST | `/api/product/analyze` | 产品提取 + 市场分析 |
| POST | `/api/content/generate` | 文案生成 |
| POST | `/api/seo/optimize` | SEO 优化 |
| POST | `/api/social/generate` | 社媒文案 |
| POST | `/api/result/merge` | 汇总输出 |

详见 [`docs/api/README.md`](docs/api/README.md)。

## 路线图

- [x] Next.js 应用脚手架
- [x] 产品分析与内容生成 API
- [x] 前端内容预览与导出
- [x] CrewAI 工作流集成

## 许可证

MIT License — 详见 [LICENSE](LICENSE)。
