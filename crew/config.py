"""Task ID 与默认模型配置。"""

from typing import Literal

SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1"

# 图像生成默认配置
SILICONFLOW_IMAGE_MODEL = "baidu/ERNIE-Image-Turbo"
SILICONFLOW_IMAGE_PATH = "/images/generations"

# 视频生成默认配置
SILICONFLOW_VIDEO_MODEL = "Wan-AI/Wan2.1-T2V-14B"
SILICONFLOW_VIDEO_SUBMIT_PATH = "/video/submit"
SILICONFLOW_VIDEO_STATUS_PATH = "/video/status"

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
