# CrewMarket API 设计

> 本文档区分 **业务 REST API**（前端调用）与 **AI 执行层**（CrewAI / 大模型调用）。

**版本：** v0.3 · **最后更新：** 2026-05-25

---

## 架构分层

```
前端
  │  HTTP（6 个业务 REST API）
  ▼
Next.js Route Handlers（业务层）
  │  内部调用
  ▼
CrewAI 工作流（AI 执行层，6 个核心模块）
  │  每个模块可绑定不同 LLM（按 Agent 选型）
  ▼
大模型 API（外部，可跨 Provider，按 Task 配置）
```

| 层级 | 数量 | 谁调用 | 说明 |
|------|------|--------|------|
| **业务 REST API** | **6** | 前端 | 用户可见，统一 `{ code, message, data }` |
| **AI Task（Agent 步骤）** | **6 核心模块** | 后端内部 | 每模块 1 个 Agent + 1 次或多次 LLM 调用 |
| **外部大模型 API** | **≥1 Provider** | CrewAI | **不同 Task 可使用不同模型/厂商**（与老师演示一致） |

---

## 一、业务 REST API（6 个）

当前系统的**首页主流程**采用分步串行调用，便于展示进度、定位失败和支持单步重跑；`/api/pipeline/run` 保留为后端一键编排接口，可用于调试、服务端编排或未来异步任务模式。

| # | 方法 | 路径 | 用途 | 前端场景 |
|---|------|------|------|----------|
| 1 | POST | `/api/product/analyze` | 产品信息提取 + 市场分析 | 首页主流程第 1 步 |
| 2 | POST | `/api/content/generate` | 营销内容与物料生成（标题、详情页、海报、图片、视频） | 首页主流程第 2 步 |
| 3 | POST | `/api/seo/optimize` | 搜索优化与渠道适配 | 首页主流程第 3 步 |
| 4 | POST | `/api/social/generate` | 社媒适配文案与脚本建议 | 首页主流程第 4 步 |
| 5 | POST | `/api/result/merge` | 汇总协调输出 | 首页主流程第 5 步 |
| 6 | POST | `/api/pipeline/run` | 后端一键编排：串行执行完整 AI 流程 | 调试 / 服务端编排 / 未来异步任务入口 |

### 统一返回结构

```json
{ "code": 0, "message": "success", "data": {} }
```

> 说明：`data` 的具体结构由各接口返回类型决定，内容生成接口已支持 `posterCopy`、`imageIdeas`、`videoMaterial` 等完整物料字段；前端展示会按字段是否存在进行渲染。

```json
{ "code": 40001, "message": "参数缺失", "data": null }
```

---

## 二、AI 执行层（6 个核心模块）

与系统任务顺序一致，**每个核心模块对应 1 个或多个 Agent 调用**（图片输入时第 1 步可能额外走 Vision）。

| # | AI Task ID | 对应 Agent | 触发方 | 输入 | 输出 |
|---|------------|------------|--------|------|------|
| 1 | `task.product_extract` | 产品信息提取 | `analyze` / `pipeline` | 图片 URL / base64、文字描述 | 品类、属性、卖点、待确认字段 |
| 2 | `task.market_research` | 市场与品牌策略师 | `analyze` / `pipeline` | 产品信息 + 可选补充 | 趋势、竞品、用户画像、品牌调性、视觉风格、营销建议 |
| 3 | `task.content_write` | 营销内容与物料生成师 | `content/generate` / `pipeline` | 产品信息 + 市场与品牌策略 | 标题、卖点、详情页、转化描述、海报文案、图片创意、视频脚本、视频素材 |
| 4 | `task.seo_optimize` | 渠道适配与搜索优化师 | `seo/optimize` / `pipeline` | 营销内容 + 品类关键词 | 关键词列表、优化标题、搜索友好文案、多平台适配文案 |
| 5 | `task.social_adapt` | 社媒文案生成师 | `social/generate` / `pipeline` | 产品信息 + 营销内容 | 小红书、微博、抖音适配文案 |
| 6 | `task.result_merge` | 汇总评估官 | `result/merge` / `pipeline` | 上述全部输出 | 评估报告 JSON（summary） |
| 7 | `task.pdf_report` | PDF 专业报告撰写官 | `pipeline`（summary 之后） | summary + modules | 可打印 PDF 文档结构 |

### 多模型策略（按 Task 选型）

与老师讲解一致：**7 个 AI Task 各自绑定不同大模型**（硅基流动白名单），全流程不共用同一模型。

| # | AI Task | 推荐模型类型 | 示例模型（可替换） | 选型理由 |
|---|---------|--------------|-------------------|----------|
| 1 | `task.product_extract` | 多模态 Vision | `Qwen/Qwen3-VL-32B-Instruct` | 需理解产品图片 + 文字 |
| 2 | `task.market_research` | 长上下文 / 推理 | `deepseek-chat` / `gpt-4o` | 竞品、市场、品牌策略归纳 |
| 3 | `task.content_write` | 中文创意文案 | `qwen-max` / `claude-3-5-sonnet` | 电商标题、详情页、脚本、海报、图片与视频物料 |
| 4 | `task.seo_optimize` | 结构化输出 | `gpt-4o-mini` / `glm-4` | 关键词提取、搜索优化与自然嵌入 |
| 5 | `task.social_adapt` | 社媒短文案 | `gpt-4o` / `doubao-pro-32k` | 多平台适配、短内容输出 |
| 6 | `task.result_merge` | 强推理 / 一致性 | `gpt-4o` / `claude-3-5-sonnet` | 去重、统一口径、汇总 JSON |

> 上表为**默认推荐**，实际以 `.env` 中 `AGENT_MODEL_*` 配置为准；CrewAI 中为每个 Agent 单独实例化 `LLM`。

> 当前文档按**完整流程**描述，`task.content_write` 已覆盖视频脚本、海报文案，以及图片创意与视频素材的结构化输出。

### 内容物料输出契约

`task.content_write` / `POST /api/content/generate` 是完整物料链路的核心输出，必须包含：

| 字段 | 含义 |
|------|------|
| `title` | 商品标题 |
| `sellingPointCopy` | 3-5 条卖点文案 |
| `detailPageContent` | 详情页正文 |
| `conversionDescription` | 转化短描述 |
| `posterCopy` | 海报标题、副标题、口号 |
| `imageIdeas` | 商品主图、详情页/活动海报、社媒配图或短视频封面的图片创意 |
| `videoScript` | 15-30 秒短视频脚本 |
| `videoMaterial` | 视频钩子、分镜、口播、字幕/封面文案 |

后端校验会对 `posterCopy`、`imageIdeas`、`videoMaterial` 做兜底归一化，保证前端和汇总结果拿到稳定字段。

### REST ↔ AI 映射

```
前端首页主流程
  └─ 串行调用 task 1 → 2 → 3 → 4 → 5 → 6

POST /api/product/analyze
  └─ task.product_extract + task.market_research

POST /api/content/generate
  └─ task.content_write

POST /api/seo/optimize
  └─ task.seo_optimize

POST /api/social/generate
  └─ task.social_adapt

POST /api/result/merge
  └─ task.result_merge

POST /api/pipeline/run
  └─ 内部串行调用 task 1 → 2 → 3 → 4 → 5 → 6（保留的一键编排入口）
```

### 外部大模型 API（Provider 配置）

支持 **多 Provider、多模型**。每个 Task 读取独立环境变量；未配置时回退到 `LLM_DEFAULT_*`。

#### 推荐：硅基流动（SiliconFlow）— 单 Key + 已实测白名单

**策略（对齐重构 §3.5 / §4.1）**：
- 唯一供应商：`siliconflow` + `SILICONFLOW_API_KEY`
- 每个 **AiTask** 独立 `AGENT_MODEL_*_MODEL`（7 个 Task，含 PDF 报告）
- 默认模型只来自 `crew/siliconflow/verified_models.py`（Gate 实测通过）
- `.env` 若填写非白名单模型，`run_pipeline` **启动即报错**
- `GET /api/siliconflow/models` 返回 `catalogMode: verified`，不是账号下 60+ 未测模型

| 配置项 | 值 |
|--------|-----|
| Base URL | `https://api.siliconflow.cn/v1` |
| 白名单源码 | `crew/siliconflow/verified_models.py` |
| 白名单校验 | `py crew/probe_siliconflow_verify.py` |
| **全模型 live 测试** | **`py crew/probe_all_models.py`**（Pipeline 绑定 14 项） |
| **账号全量模型测试** | **`py crew/probe_account_models.py`**（catalog 全部模型逐一点测） |
| 模型目录 · 白名单 | `GET /api/siliconflow/models` |
| 模型目录 · 账号全量 | `GET /api/siliconflow/models?mode=account` |
| 账号全量目录（调试） | `py crew/probe_siliconflow_catalog.py --account` |
| live 最小调用 | `py crew/probe_siliconflow_verify.py --live` |

**已实测绑定（生产默认，2026-05-30）**

| 用途 | AiTask / 能力 | 模型 ID | 验证依据 |
|------|---------------|---------|----------|
| 产品识图 | `task.product_extract` | `Qwen/Qwen3-VL-32B-Instruct` | Gate C live |
| 市场分析 | `task.market_research` | `deepseek-ai/DeepSeek-V3` | Gate C live |
| 文案物料 | `task.content_write` | `Qwen/Qwen2.5-72B-Instruct` | 2025-05-25 实测 |
| SEO | `task.seo_optimize` | `THUDM/GLM-4-32B-0414` | 2025-05-25 实测 |
| 社媒 | `task.social_adapt` | `Qwen/Qwen2.5-32B-Instruct` | 2025-05-25 实测 |
| 汇总评估 | `task.result_merge` | `deepseek-ai/DeepSeek-V3` | Gate F live |
| PDF 报告 | `task.pdf_report` | `deepseek-ai/DeepSeek-V3` | Gate G smoke |
| 文生图 | Pipeline 物料 | `baidu/ERNIE-Image-Turbo` | 项目历史默认 |
| 文生视频 | `/api/video/jobs` | `Wan-AI/Wan2.2-T2V-A14B` | 账号唯一 T2V |
| Embedding | 辅助 API | `BAAI/bge-m3` | `POST /api/siliconflow/embeddings` |
| Rerank | 辅助 API | `BAAI/bge-reranker-v2-m3` | `POST /api/siliconflow/rerank` |
| TTS（可选） | 可选 REST | `fnlp/MOSS-TTSD-v0.5` | `POST /api/siliconflow/speech` |
| STT（可选） | 可选 REST | `FunAudioLLM/SenseVoiceSmall` | `POST /api/siliconflow/stt` |
| 模型目录 | 白名单 / 全量 | — | `GET /api/siliconflow/models[?mode=account]` |

> **未接入主链路**：TTS/STT 未列入 `verified_models.py` 白名单（Pipeline bootstrap 不注入），但 **`POST /api/siliconflow/speech` 路由保留**供联调；通过 Gate 后再写入白名单。

#### Task 1 产品识图（Vision）说明

- **只有 Task 1 需要 Vision 模型**，Task 2–6 使用纯文本 LLM。
- 输入支持 `imageUrl`（公网可下载 URL）或 `imageBase64`（`data:image/jpeg;base64,...` 格式）。
- 硅基流动服务端会拉取 `imageUrl` 中的图片，**localhost / 内网 URL 不可用**，开发时建议先上传图床或使用 base64。
- 仅有文字描述、无图片时，Task 1 可只传文本，Vision 模型仍能工作。

**Vision 请求示例（OpenAI 兼容）：**

```json
{
  "model": "Qwen/Qwen3-VL-32B-Instruct",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "分析这张产品图的品类、属性和卖点" },
      { "type": "image_url", "image_url": { "url": "https://example.com/product.jpg" } }
    ]
  }]
}
```

#### 环境变量示例 — 硅基流动（推荐，已实测）

```bash
SILICONFLOW_API_KEY=你的Key
LLM_DEFAULT_PROVIDER=siliconflow
LLM_DEFAULT_MODEL=deepseek-ai/DeepSeek-V3

# Task 1 必须用 Vision 模型（识图）
AGENT_MODEL_PRODUCT_EXTRACT_PROVIDER=siliconflow
AGENT_MODEL_PRODUCT_EXTRACT_MODEL=Qwen/Qwen3-VL-32B-Instruct

AGENT_MODEL_MARKET_RESEARCH_PROVIDER=siliconflow
AGENT_MODEL_MARKET_RESEARCH_MODEL=deepseek-ai/DeepSeek-V3

AGENT_MODEL_CONTENT_WRITE_PROVIDER=siliconflow
AGENT_MODEL_CONTENT_WRITE_MODEL=Qwen/Qwen2.5-72B-Instruct

AGENT_MODEL_SEO_OPTIMIZE_PROVIDER=siliconflow
AGENT_MODEL_SEO_OPTIMIZE_MODEL=THUDM/GLM-4-32B-0414

AGENT_MODEL_SOCIAL_ADAPT_PROVIDER=siliconflow
AGENT_MODEL_SOCIAL_ADAPT_MODEL=Qwen/Qwen2.5-32B-Instruct

AGENT_MODEL_RESULT_MERGE_PROVIDER=siliconflow
AGENT_MODEL_RESULT_MERGE_MODEL=deepseek-ai/DeepSeek-V3
```

完整模板见 [`docs/api/env.example`](env.example)；本地复制为项目根目录 `.env` 并填入 Key。

#### CrewAI 接入示意（硅基流动）

```python
from crewai import LLM

def get_llm(task_id: str) -> LLM:
    model = os.getenv(f"AGENT_MODEL_{task_id}_MODEL")
    return LLM(
        model=f"openai/{model}",           # LiteLLM 路由
        base_url="https://api.siliconflow.cn/v1",
        api_key=os.getenv("SILICONFLOW_API_KEY"),
    )
```

#### 环境变量示例 — 多厂商分别配置（备选）

```bash
# 默认回退（任意 Task 未单独配置时使用）
LLM_DEFAULT_PROVIDER=openai
LLM_DEFAULT_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...

# 按 Task 覆盖（与老师「不同 Agent 用不同模型」一致）
AGENT_MODEL_PRODUCT_EXTRACT_PROVIDER=openai
AGENT_MODEL_PRODUCT_EXTRACT_MODEL=gpt-4o

AGENT_MODEL_MARKET_RESEARCH_PROVIDER=deepseek
AGENT_MODEL_MARKET_RESEARCH_MODEL=deepseek-chat
DEEPSEEK_API_KEY=sk-...

AGENT_MODEL_CONTENT_WRITE_PROVIDER=dashscope
AGENT_MODEL_CONTENT_WRITE_MODEL=qwen-max
DASHSCOPE_API_KEY=sk-...

AGENT_MODEL_SEO_OPTIMIZE_PROVIDER=zhipu
AGENT_MODEL_SEO_OPTIMIZE_MODEL=glm-4
ZHIPU_API_KEY=...

AGENT_MODEL_SOCIAL_ADAPT_PROVIDER=volcengine
AGENT_MODEL_SOCIAL_ADAPT_MODEL=doubao-pro-32k
VOLCENGINE_API_KEY=...

AGENT_MODEL_RESULT_MERGE_PROVIDER=openai
AGENT_MODEL_RESULT_MERGE_MODEL=gpt-4o
```

#### 支持的 Provider 类型（CrewAI / LiteLLM 兼容）

| Provider ID | 典型用途 | API Key 环境变量 |
|-------------|----------|------------------|
| **`siliconflow`** | **国内推荐，一个 Key 多模型** | **`SILICONFLOW_API_KEY`** |
| `openai` | Vision、汇总、通用 | `OPENAI_API_KEY` |
| `anthropic` | 长文案、创意 | `ANTHROPIC_API_KEY` |
| `deepseek` | 推理、市场分析 | `DEEPSEEK_API_KEY` |
| `dashscope` | 通义千问，中文文案 | `DASHSCOPE_API_KEY` |
| `zhipu` | 智谱 GLM，结构化 | `ZHIPU_API_KEY` |
| `volcengine` | 豆包，社媒短文案 | `VOLCENGINE_API_KEY` |
| `google` | Gemini，多模态 | `GOOGLE_API_KEY` |

#### CrewAI 侧绑定方式（示意）

```python
# 每个 Agent 使用独立 LLM 实例
product_agent = Agent(..., llm=get_llm("task.product_extract"))
market_agent  = Agent(..., llm=get_llm("task.market_research"))
# ...
```

`get_llm(task_id)` 根据 `AGENT_MODEL_*` 环境变量创建对应 Provider 的 LLM，**业务 REST API 层不暴露模型选择**，模型策略仅在后端 / AI 层配置。

---

## 三、错误码

| code | 含义 |
|------|------|
| `0` | 成功 |
| `40001` | 参数缺失或格式错误 |
| `40002` | 图片解析失败 |
| `50001` | 模型生成失败 |
| `50002` | 返回数据为空 |
| `50003` | AI 服务异常（超时、Provider 不可用） |
| `50004` | 汇总一致性校验失败 |

---

## 四、一键生成流程（`/api/pipeline/run`）

### 请求示例

```json
{
  "description": "便携式蓝牙音箱，IPX7 防水，24 小时续航",
  "imageUrl": "https://example.com/product.jpg",
  "options": {
    "productName": "SoundGo Mini",
    "category": "数码配件",
    "targetAudience": "年轻户外用户",
    "priceRange": "199-299",
    "brandStyle": "年轻、活力",
    "marketingGoal": "提升转化",
    "competitorInfo": "JBL Go 系列",
    "platformRequirements": ["淘宝", "小红书"]
  }
}
```

### 响应 `data` 结构（摘要）

```json
{
  "pipelineId": "pl_abc123",
  "status": "completed",
  "steps": {
    "productExtract": {},
    "marketResearch": {},
    "content": {},
    "seo": {},
    "social": {},
    "merged": {}
  },
  "result": {},
  "pendingConfirmations": [],
  "generatedAt": "2026-05-25T12:00:00.000Z"
}
```

完整字段见 [types 定义](../../types/index.ts)。

### 分步接口返回字段对照

- `POST /api/product/analyze`
  - `product`
  - `market`
- `POST /api/content/generate`
  - `content`
- `POST /api/seo/optimize`
  - `seo`
- `POST /api/social/generate`
  - `social`
- `POST /api/result/merge`
  - `package`
  - `consistencyNotes`
  - `pendingConfirmations`

> 前端状态流里使用的步骤键仍保持为 `productExtract`、`marketResearch`、`content`、`seo`、`social`、`merged`，与 `PipelineRunResponseData.steps` 一致。

---

## 五、联调约定

- 前端主流程：**仅调用** `POST /api/pipeline/run`
- 后端实现：Route Handler 内调用 CrewAI 工作流，按 Task 1→6 串行执行
- Mock 阶段：可在业务层返回固定 JSON，AI 层尚未接入时不影响前端开发
- 分步 API（2–6）供调试、单步重跑，**生产主路径不强制前端调用**
