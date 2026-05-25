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
CrewAI 工作流（AI 执行层，6 个 Task）
  │  每个 Task 绑定不同 LLM（按 Agent 选型）
  ▼
大模型 API（外部，可跨 Provider，按 Task 配置）
```

| 层级 | 数量 | 谁调用 | 说明 |
|------|------|--------|------|
| **业务 REST API** | **6** | 前端 | 用户可见，统一 `{ code, message, data }` |
| **AI Task（Agent 步骤）** | **6** | 后端内部 | 每步 1 个 Agent + 1 次 LLM 调用 |
| **外部大模型 API** | **≥1 Provider** | CrewAI | **不同 Task 可使用不同模型/厂商**（与老师演示一致） |

---

## 一、业务 REST API（6 个）

前端「点一次生成全部」时，**只调 1 个接口**；分步调试时可调其余 5 个。

| # | 方法 | 路径 | 用途 | 前端场景 |
|---|------|------|------|----------|
| 1 | POST | `/api/pipeline/run` | **一键编排**：串行执行 AI 步骤 1→6 | 主按钮「生成全部」 |
| 2 | POST | `/api/product/analyze` | 产品信息提取 + 市场分析 | 分步 / 调试 |
| 3 | POST | `/api/content/generate` | 电商文案生成 | 分步 / 调试 |
| 4 | POST | `/api/seo/optimize` | SEO 优化 | 分步 / 调试 |
| 5 | POST | `/api/social/generate` | 社媒文案 | 分步 / 调试 |
| 6 | POST | `/api/result/merge` | 汇总协调输出 | 分步 / 调试 |

### 统一返回结构

```json
{ "code": 0, "message": "success", "data": {} }
```

```json
{ "code": 40001, "message": "参数缺失", "data": null }
```

---

## 二、AI 执行层（6 个 Task）

与系统任务顺序一致，**每个 Task 对应 1 次 Agent + LLM 调用**（图片输入时第 1 步可能额外走 Vision）。

| # | AI Task ID | 对应 Agent | 触发方 | 输入 | 输出 |
|---|------------|------------|--------|------|------|
| 1 | `task.product_extract` | 产品信息提取 | `analyze` / `pipeline` | 图片 URL / base64、文字描述 | 品类、属性、卖点、待确认字段 |
| 2 | `task.market_research` | 市场调研员 | `analyze` / `pipeline` | 产品信息 + 可选补充 | 趋势、竞品、用户画像、营销建议 |
| 3 | `task.content_write` | 文案策划师 | `content/generate` / `pipeline` | 产品信息 + 市场分析 | 标题、卖点、详情页、转化描述 |
| 4 | `task.seo_optimize` | SEO 优化师 | `seo/optimize` / `pipeline` | 文案 + 品类关键词 | 关键词列表、优化标题、搜索友好文案 |
| 5 | `task.social_adapt` | 社交媒体运营 | `social/generate` / `pipeline` | 文案 + 产品卖点 | 小红书 / 微博 / 抖音文案、话题标签 |
| 6 | `task.result_merge` | 汇总协调 Agent | `result/merge` / `pipeline` | 上述全部输出 | 完整营销物料包 JSON |

### 多模型策略（按 Task 选型）

与老师讲解一致：**6 个 AI Task 各自绑定不同大模型**，按 Agent 职责选型，而非 6 步共用同一模型。

| # | AI Task | 推荐模型类型 | 示例模型（可替换） | 选型理由 |
|---|---------|--------------|-------------------|----------|
| 1 | `task.product_extract` | 多模态 Vision | `Qwen/Qwen3-VL-32B-Instruct` | 需理解产品图片 + 文字 |
| 2 | `task.market_research` | 长上下文 / 推理 | `deepseek-chat` / `gpt-4o` | 竞品与市场归纳 |
| 3 | `task.content_write` | 中文创意文案 | `qwen-max` / `claude-3-5-sonnet` | 电商标题与详情页表达 |
| 4 | `task.seo_optimize` | 结构化输出 | `gpt-4o-mini` / `glm-4` | 关键词提取与自然嵌入 |
| 5 | `task.social_adapt` | 短文案 / 网感 | `doubao-pro` / `qwen-plus` | 小红书、微博、抖音风格 |
| 6 | `task.result_merge` | 强推理 / 一致性 | `gpt-4o` / `claude-3-5-sonnet` | 去重、统一口径、汇总 JSON |

> 上表为**默认推荐**，实际以 `.env` 中 `AGENT_MODEL_*` 配置为准；CrewAI 中为每个 Agent 单独实例化 `LLM`。

### REST ↔ AI 映射

```
POST /api/pipeline/run
  └─ 内部串行调用 task 1 → 2 → 3 → 4 → 5 → 6

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
```

### 外部大模型 API（Provider 配置）

支持 **多 Provider、多模型**。每个 Task 读取独立环境变量；未配置时回退到 `LLM_DEFAULT_*`。

#### 推荐：硅基流动（SiliconFlow）— 一个 Key，文本 + 识图

**已实测确认：一个 `SILICONFLOW_API_KEY` 即可覆盖本项目全部 6 个 Task**（含产品图片识别）。

| 配置项 | 值 |
|--------|-----|
| Base URL | `https://api.siliconflow.cn/v1` |
| API Key | [cloud.siliconflow.cn](https://cloud.siliconflow.cn/account/ak) 获取 |
| 环境变量 | `SILICONFLOW_API_KEY`（**仅放 `.env`，禁止写入文档或提交 Git**） |

**本项目实测可用的模型配置（2026-05-25）：**

| Task | 模型 ID | 类型 | 实测 |
|------|---------|------|------|
| 产品提取（识图） | `Qwen/Qwen3-VL-32B-Instruct` | **Vision 多模态** | ✅ 可用 |
| 市场调研 | `deepseek-ai/DeepSeek-V3` | 文本 | ✅ 可用 |
| 文案生成 | `Qwen/Qwen2.5-72B-Instruct` | 文本 | ✅ 可用 |
| SEO 优化 | `THUDM/GLM-4-32B-0414` | 文本 | ✅ 可用 |
| 社媒适配 | `Qwen/Qwen2.5-32B-Instruct` | 文本 | ✅ 可用 |
| 汇总协调 | `deepseek-ai/DeepSeek-V3` | 文本 | ✅ 可用 |

> 部分文档初稿中的 `deepseek-ai/deepseek-vl2`、`zai-org/GLM-4.5` 在当前账号下返回 `Model disabled`，已替换为上表可用模型。不同账号可用模型可能不同，以控制台为准。

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

---

## 五、联调约定

- 前端主流程：**仅调用** `POST /api/pipeline/run`
- 后端实现：Route Handler 内调用 CrewAI Crew，按 Task 1→6 串行执行
- Mock 阶段：可在业务层返回固定 JSON，AI 层尚未接入时不影响前端开发
- 分步 API（2–6）供调试、单步重跑，**生产主路径不强制前端调用**
