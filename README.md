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

- **首页主流程：** 前端调用 `POST /api/pipeline/run` 一键编排后端完整 AI 流程，提交后立即返回 `pipelineId`，再轮询 `GET /api/pipeline/status/{pipelineId}` 获取分步进度与结果；流水线结果会持久化，切换页面后可通过 `GET /api/pipeline/latest` 恢复最近一次生成状态。
- **分步接口：** `/api/product/analyze`、`/api/content/generate`、`/api/seo/optimize`、`/api/social/generate`、`/api/result/merge` 仍保留，供调试与单步重跑使用。
- **图片输入：** 支持首页上传图片或文字描述，识图链路由后端 AI Task 1（Vision 模型）处理。
- **图片 / 视频生成：** 内容生成后自动产出营销海报图片（文生图）与短视频（文生视频，默认异步：先返回 `requestId`，前端轮询 `GET /api/video/status/{requestId}` 拿结果）。
- **模型配置：** `/models` 页面可按 AI Task 在硅基流动白名单内切换并实测模型。

## 智能体分工（7 个 AI Task）

- **产品提取 Agent**（`task.product_extract`）— 识图、属性提取、卖点总结
- **市场与品牌策略 Agent**（`task.market_research`）— 类目趋势、竞品特点、用户画像、调性建议
- **营销内容 Agent**（`task.content_write`）— 标题、卖点、详情页、视频脚本、海报文案、图片创意与视频素材
- **SEO 优化 Agent**（`task.seo_optimize`）— 关键词、优化标题、搜索友好文案、多平台渠道适配
- **社媒适配 Agent**（`task.social_adapt`）— 小红书 / 微博 / 抖音文案与脚本建议
- **汇总协调 Agent**（`task.result_merge`）— 去重、统一风格、一致性校验、输出完整营销方案
- **PDF 报告 Agent**（`task.pdf_report`）— 将汇总结果整理为可打印的专业 PDF 报告结构

> 文案链路之后，流水线还会调用**文生图**（海报图片）与**文生视频**（短视频，默认异步）生成真实营销物料。

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

- Node.js 18+
- Python **3.11 或 3.12**（⚠️ CrewAI 不支持 Python 3.14；若本机默认 `python` 为 3.14，请用 3.11/3.12 单独建虚拟环境）

### 安装与运行

```bash
git clone https://github.com/lnlll162/crewmarket.git
cd crewmarket

# 1. 前端依赖
npm install

# 2. Python / CrewAI 环境
#    默认 python 为 3.11/3.12 时可直接：npm run crew:setup
#    否则用指定版本建 venv：
py -3.12 -m venv crew/.venv
crew/.venv/Scripts/pip install -r crew/requirements.txt
#    并在 .env 中设置 PYTHON_EXECUTABLE 指向该 venv 的 python.exe（见 docs/api/env.example）

# 3. 配置硅基流动 Key（复制 docs/api/env.example → .env）
# SILICONFLOW_API_KEY=你的Key

# 4. 启动开发服务器
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，填写产品描述（可上传图片），点击「一键生成全部内容」。

> 国内安装 Python 依赖较慢时，可加镜像源：`crew/.venv/Scripts/pip install -r crew/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`

### API 端点

**主流程（前端实际调用）**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/pipeline/run` | 一键编排，提交后返回 `pipelineId`（前端主入口） |
| GET | `/api/pipeline/status/{pipelineId}` | 轮询流水线分步进度与结果 |
| GET | `/api/pipeline/latest` | 恢复最近一次生成状态 |
| GET | `/api/pipeline/result/{pipelineId}` | 读取指定流水线的完整结果 |
| GET | `/api/video/status/{requestId}` | 轮询异步视频生成状态 |

**分步业务接口（调试 / 单步重跑）**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/product/analyze` | 产品提取 + 市场分析 |
| POST | `/api/content/generate` | 文案与物料生成 |
| POST | `/api/seo/optimize` | SEO 优化与渠道适配 |
| POST | `/api/social/generate` | 社媒文案 |
| POST | `/api/result/merge` | 汇总输出 |

**模型配置与硅基流动能力**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PUT/DELETE | `/api/agent-models/config` | 读取/更新/重置各 AI Task 的模型绑定 |
| POST | `/api/agent-models/probe` | 实测探活指定模型 |
| GET | `/api/siliconflow/models` | 模型目录（`?mode=account` 取账号全量） |
| POST | `/api/siliconflow/embeddings`·`/rerank`·`/speech`·`/stt` | 辅助能力（Embedding/Rerank/TTS/STT） |
| GET/POST | `/api/compare/history` | 生成结果对比历史 |
| GET | `/api/image-proxy` | 图片代理（跨域预览 / 导出） |

详见 [`docs/api/README.md`](docs/api/README.md)。

## 路线图

- [x] Next.js 应用脚手架
- [x] 产品分析与内容生成 API
- [x] 前端内容预览与导出（含 PDF 报告导出）
- [x] CrewAI 工作流集成（7 个 AI Task）
- [x] 文生图 / 文生视频物料生成（视频异步轮询）
- [x] 按 AI Task 切换硅基流动模型（`/models` 配置页 + 实测探活）
- [x] 流水线结果持久化与生成历史对比（`/compare`）

## 许可证

MIT License — 详见 [LICENSE](LICENSE)。
