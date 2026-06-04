# CrewMarket 项目现状总览

> 记录项目当前真实结构、已交付能力与关键约定，统一产品定位、后端任务边界与前端展示口径。

**版本：** v0.3
**最后更新：** 2026-06-03

---

## 1. 项目定位

CrewMarket 是一个 **多智能体电商营销内容生成系统**，主链路为：

> 产品理解 → 市场与品牌策略 → 营销内容与物料 → SEO → 社媒 → 汇总 → PDF 报告

在文案物料链路之后，系统进一步调用 **文生图** 与 **文生视频** 产出真实营销素材。

### 已交付范围
- 产品图片 / 文字描述输入，支持产品识图（Vision）
- 结构化营销内容生成（标题、卖点、详情页、转化描述、海报文案、视频脚本、视频素材、图片创意）
- SEO 优化与多平台渠道适配
- 小红书 / 微博 / 抖音社媒文案与脚本建议
- 汇总协调与一致性校验
- **真实文生图**（`baidu/ERNIE-Image-Turbo`）生成营销海报图片
- **真实文生视频**（`Wan-AI/Wan2.2-T2V-A14B`，默认异步：提交返回 `requestId`，前端轮询）
- PDF 专业报告生成与前端导出
- 按 AI Task 切换硅基流动模型（`/models` 配置页 + 实测探活）
- 流水线结果持久化、页面切换后恢复、生成历史对比

### 前端运行方式
首页主流程调用 `POST /api/pipeline/run`（异步一键编排），轮询 `GET /api/pipeline/status/{pipelineId}` 获取进度与结果，必要时用 `GET /api/pipeline/latest` 恢复。分步业务接口仅作调试 / 单步重跑入口，不是主路径。

---

## 2. 当前项目结构

### 2.1 前端（Next.js 13.5 App Router）

页面：`/`（营销首页）、`/generate`（生成工作台）、`/models`（模型配置）、`/compare` 与 `/compare/history`（结果对比）。

- `features/generate/GenerateWorkspace.tsx` — 生成工作台
- `features/generate/usePipelineRun.ts` — `pipeline/run` 提交 + `status` 轮询 + `latest` 恢复
- `features/generate/useVideoStatus.ts` — 异步视频状态轮询
- `features/generate/PipelineProgress.tsx` — 流程进度
- `features/generate/ResultDisplay.tsx` / `VideoResultCard.tsx` — 结果与视频展示
- `features/generate/PdfExportDocument.tsx` — PDF 报告导出
- `features/models/ModelConfigWorkspace.tsx` — 模型配置页
- `features/compare/*` — 结果对比与历史
- `components/ui/EmptyState.tsx` / `ErrorState.tsx` / `LoadingState.tsx` — 状态组件

### 2.2 后端（Next.js Route Handlers + Python CrewAI）

业务层 Route Handler 通过 `PYTHON_EXECUTABLE` spawn `crew/` 下脚本，结果持久化到 `data/pipeline-results/`。

- `crew/pipeline.py` — 工作流编排入口（Task 1→7 + 图片/视频生成）
- `crew/agents.py` — CrewAI Agent 定义
- `crew/prompts.py` — 提示词模板
- `crew/schemas.py` — 输出校验与归一化
- `crew/runner.py` — JSON 任务执行与重试
- `crew/vision.py` — 产品识图任务
- `crew/generation.py` — 文生图 / 文生视频调用
- `crew/poll_video.py` — 视频异步状态轮询
- `crew/pdf_report.py` — PDF 报告生成
- `crew/llm.py` / `crew/model_config.py` / `crew/config.py` — 模型绑定与 Task / 模型配置
- `crew/module_records.py` — 模块运行记录
- `crew/siliconflow/` — 硅基流动客户端、白名单（`verified_models.py`）、catalog、bootstrap、embeddings/rerank/speech/stt

### 2.3 类型与契约

- `types/index.ts` — 请求、响应、AI Task ID、模型配置、结果与流水线类型
- `docs/api/README.md` — API 契约、AI Task 映射、模型配置说明
- `.cursor/rules/*.mdc` — 项目规则、接口规则、开发规范

---

## 3. AI Task（7 个）

| # | Task ID | 职责 | 默认模型 |
|---|---------|------|----------|
| 1 | `task.product_extract` | 产品识图与信息提取 | `Qwen/Qwen3-VL-32B-Instruct`（Vision） |
| 2 | `task.market_research` | 市场与品牌策略 | `deepseek-ai/DeepSeek-V3` |
| 3 | `task.content_write` | 营销内容与物料 | `Qwen/Qwen2.5-72B-Instruct` |
| 4 | `task.seo_optimize` | SEO 与渠道适配 | `THUDM/GLM-4-32B-0414` |
| 5 | `task.social_adapt` | 社媒文案 | `Qwen/Qwen2.5-32B-Instruct` |
| 6 | `task.result_merge` | 汇总与一致性校验 | `deepseek-ai/DeepSeek-V3` |
| 7 | `task.pdf_report` | PDF 专业报告 | `deepseek-ai/DeepSeek-V3` |

> 文案之后追加文生图（`baidu/ERNIE-Image-Turbo`）与文生视频（`Wan-AI/Wan2.2-T2V-A14B`）。实际模型以 `.env` 中 `AGENT_MODEL_*` 配置为准，默认值须落在 `crew/siliconflow/verified_models.py` 白名单内。

### `content_write` 输出字段
`title`、`sellingPointCopy`、`detailPageContent`、`conversionDescription`、`posterCopy`、`imageIdeas`、`videoScript`、`videoMaterial`。

---

## 4. 关键约定

1. **模型供应方统一**：仅使用硅基流动（`siliconflow`）单 Provider + `SILICONFLOW_API_KEY`；不同 AI Task 绑定不同硅基流动模型。
2. **白名单约束**：默认模型必须在 `crew/siliconflow/verified_models.py` 内；`.env` 填非白名单模型时 `run_pipeline` 启动即报错。
3. **统一返回结构**：所有接口返回 `{ code, message, data }`。
4. **schema 不掩盖缺失**：关键字段须由模型真实返回，兜底只用于非核心字段。
5. **视频默认异步**：pipeline 提交即返回 `requestId`；`AGENT_VIDEO_INLINE=1` 可切回同步内联。
6. **文档、类型、实现一致**：README、API 文档、任务清单、Cursor rules、`types/`、crew prompts/pipeline/schemas、前端展示须同口径。

---

## 5. 运行环境注意

- **Python 版本**：CrewAI 不支持 Python 3.14，需用 3.11 / 3.12 建 `crew/.venv`，并在 `.env` 设置 `PYTHON_EXECUTABLE` 指向该 venv。
- **依赖**：`crew/requirements.txt` 已包含 `botocore`（LiteLLM 运行所需），不再缺失。
- 详细环境变量见 [`docs/api/env.example`](api/env.example)。

---

## 6. 后续可选演进

- 部署与生产环境配置说明
- 更多渠道 / 平台适配与批处理模式
- TTS / STT 接入主链路（当前 `/api/siliconflow/speech`、`/stt` 路由已保留，未入白名单主链路）
- 生成结果的版本管理与团队协作
