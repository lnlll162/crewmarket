"""Task ID 与默认模型配置。"""

from typing import Literal

SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1"

AiTaskId = Literal[
    "task.product_extract",
    "task.market_research",
    "task.content_write",
    "task.seo_optimize",
    "task.social_adapt",
    "task.result_merge",
]

TASK_ENV_PREFIX: dict[AiTaskId, str] = {
    "task.product_extract": "AGENT_MODEL_PRODUCT_EXTRACT",
    "task.market_research": "AGENT_MODEL_MARKET_RESEARCH",
    "task.content_write": "AGENT_MODEL_CONTENT_WRITE",
    "task.seo_optimize": "AGENT_MODEL_SEO_OPTIMIZE",
    "task.social_adapt": "AGENT_MODEL_SOCIAL_ADAPT",
    "task.result_merge": "AGENT_MODEL_RESULT_MERGE",
}

AI_TASK_ORDER: list[AiTaskId] = list(TASK_ENV_PREFIX.keys())
