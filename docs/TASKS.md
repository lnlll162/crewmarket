# CrewMarket 任务清单

> 项目任务跟踪文档。随开发进度更新状态，与 [README](../README.md) 路线图及 Cursor 规则保持一致。

**最后更新：** 2026-06-03（API 契约 v0.4 · 主链路已交付并实测跑通）

---

## 状态说明

| 标记 | 含义 |
|------|------|
| `[x]` | 已完成 |
| `[ ]` | 待办 |
| `[~]` | 进行中 |

---

## 阶段 0：项目基线

- [x] 编写项目 README（简介、功能、技术栈、路线图）
- [x] 添加 MIT LICENSE
- [x] 配置 Cursor 规则（内容系统、智能体、API 契约、开发规范）
- [x] 初始化 Git 仓库并推送到 GitHub
- [x] 创建本任务清单文档

---

## 阶段 1：API 契约与类型定义

- [x] 编写 API 设计文档（[`docs/api/README.md`](api/README.md)）
  - [x] 主流程 / 分步 / 辅助 REST API 分层说明
  - [x] AI 执行层（7 个 AI Task）说明与 REST ↔ AI 映射
  - [x] 统一返回结构 `{ code, message, data }`
  - [x] 错误码体系
  - [x] 请求 / 响应示例 JSON
- [x] 定义核心 TypeScript 类型（[`types/index.ts`](../types/index.ts)）
  - [x] 产品输入、产品理解、市场与品牌策略结果
  - [x] 营销内容与物料结果（含 `posterCopy`、`imageIdeas`、`videoScript`、`videoMaterial`）
  - [x] 图片生成 / 视频生成结果结构（`imageGeneration` / `videoGeneration`）
  - [x] 汇总结果、PDF 报告结构、流水线响应 `PipelineRunResponseData`
  - [x] AI Task 标识 `AiTaskId` 与执行顺序 `AI_TASK_ORDER`（7 个）
- [x] 确认接口路径约定
  - [x] `POST /api/pipeline/run` — 一键编排，返回 `pipelineId`（前端主入口）
  - [x] `GET /api/pipeline/status/{pipelineId}` — 轮询分步进度与结果
  - [x] `GET /api/pipeline/latest` · `GET /api/pipeline/result/{pipelineId}` — 恢复 / 读取结果
  - [x] `GET /api/video/status/{requestId}` — 异步视频状态轮询
  - [x] 分步业务接口（product/analyze、content/generate、seo/optimize、social/generate、result/merge）保留供调试

---

## 阶段 2：Next.js 应用脚手架

- [x] 初始化 Next.js 13.5（App Router）+ TypeScript 项目
- [x] 集成 Tailwind CSS
- [x] 集成 HeroUI 组件库
- [x] 搭建目录结构（`app/`、`components/`、`features/`、`lib/`、`types/`、`constants/`、`data/`、`crew/`）
- [x] 配置环境变量模板（[`docs/api/env.example`](api/env.example)）
- [x] 实现基础布局（Header、主内容区、页脚、全局氛围背景）
- [x] 实现全局加载态 / 空状态 / 错误态组件

### 当前前端模块

- `features/generate/GenerateWorkspace.tsx` — 首页生成工作台
- `features/generate/usePipelineRun.ts` — `pipeline/run` 提交 + `status` 轮询 + `latest` 恢复
- `features/generate/useVideoStatus.ts` — 异步视频状态轮询
- `features/generate/PipelineProgress.tsx` — 步骤进度展示
- `features/generate/ResultDisplay.tsx` / `VideoResultCard.tsx` — 结果与视频展示
- `features/generate/PdfExportDocument.tsx` — PDF 报告导出
- `features/models/ModelConfigWorkspace.tsx` — `/models` 模型配置页
- `features/compare/CompareWorkspace.tsx` / `CompareHistoryWorkspace.tsx` — 结果对比与历史

---

## 阶段 3：后端 API 实现

- [x] 实现统一响应封装（`lib/api-response.ts`：success / fail helper）
- [x] `POST /api/pipeline/run` — 一键编排（异步串行 7 个 AI Task + 持久化）
- [x] `GET /api/pipeline/status/{pipelineId}` · `latest` · `result/{pipelineId}`
- [x] `POST /api/product/analyze` — 产品信息提取 + 市场分析
- [x] `POST /api/content/generate` — 文案与物料生成
- [x] `POST /api/seo/optimize` — SEO 优化与渠道适配
- [x] `POST /api/social/generate` — 社媒文案
- [x] `POST /api/result/merge` — 汇总输出
- [x] `GET /api/video/status/{requestId}` — 异步视频状态
- [x] 模型配置接口：`/api/agent-models/config`（GET/PUT/DELETE）、`/api/agent-models/probe`
- [x] 硅基流动能力接口：`/api/siliconflow/models`、`embeddings`、`rerank`、`speech`、`stt`
- [x] 辅助接口：`/api/compare/history`、`/api/image-proxy`

---

## 阶段 4：CrewAI 工作流集成

- [x] 搭建 Python / CrewAI 运行环境（`crew/.venv`，Python 3.11/3.12）
- [x] 实现 7 个 AI Task 智能体（产品提取、市场策略、营销内容、SEO、社媒、汇总、PDF 报告）
- [x] 编排完整工作流（`crew/pipeline.py`，串行 Task 1→7）
- [x] 结构化提示词模板（`crew/prompts.py`）
- [x] 将 CrewAI 输出映射到 API 契约字段、处理「待确认」标记（`crew/schemas.py`）
- [x] 接入硅基流动模型绑定与白名单校验（`crew/llm.py`、`crew/siliconflow/`）
- [x] 文生图（`generate_image`，ERNIE-Image-Turbo）与异步文生视频（`submit_video` / `poll_video_status`，Wan2.2-T2V）

---

## 阶段 5：前端功能与预览

- [x] 产品输入页（文字描述 + 图片上传 + 可选补充信息）
- [x] 生成流程触发与进度展示（轮询式异步）
- [x] 结果预览面板（产品 / 市场 / 文案 / SEO / 社媒 / 汇总）
- [x] 图片与视频物料展示（视频异步状态轮询）
- [x] 复制 / 导出（JSON + PDF 报告导出）
- [x] 前后端真实联调（硅基流动 live）
- [x] 成功态、失败态、重试与页面切换后状态恢复

---

## 阶段 6：质量与交付

- [x] 关键路径手动测试（pipeline 全链路 live 实测通过）
- [x] 更新 README「快速开始」（安装、运行、Python 版本约束、环境变量）
- [x] 同步更新 API 文档与类型定义
- [x] crew 侧 smoke / probe 脚本（`crew/test_*_smoke.py`、`crew/probe_*.py`）
- [ ] （可选）部署方案与生产环境配置说明

---

## 里程碑对照（README 路线图）

| README 路线图项 | 对应阶段 | 状态 |
|-----------------|----------|------|
| Next.js 应用脚手架 | 阶段 2 | ✅ 已完成 |
| 产品分析与内容生成 API | 阶段 1 + 3 + 4 | ✅ 已完成 |
| 前端内容预览与导出（含 PDF） | 阶段 5 | ✅ 已完成 |
| CrewAI 工作流集成（7 Task） | 阶段 4 | ✅ 已完成 |
| 文生图 / 文生视频物料生成 | 阶段 4 | ✅ 已完成 |
| 模型配置页 + 实测探活 | 阶段 3 + 5 | ✅ 已完成 |
| 流水线持久化与生成历史对比 | 阶段 3 + 5 | ✅ 已完成 |

---

## 备注

- 接口或字段变更须同步更新 `docs/api/` 与 `types/`。
- **7 个 AI Task 各自绑定不同硅基流动模型**，通过 `AGENT_MODEL_*` 环境变量配置；默认模型须落在 `crew/siliconflow/verified_models.py` 白名单内。
- 智能体输出须统一口径，由汇总 Agent 做去重与风格统一。
- 页面设计遵循「精致但克制」，优先保证可联调、可维护。
