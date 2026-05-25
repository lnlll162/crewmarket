"""按 Task 读取硅基流动模型配置，为 CrewAI Agent 创建 LLM。"""

from __future__ import annotations

import os
from typing import Optional

from crewai import LLM

from config import SILICONFLOW_BASE_URL, TASK_ENV_PREFIX, AiTaskId

DEFAULT_MODEL = os.getenv("LLM_DEFAULT_MODEL", "deepseek-ai/DeepSeek-V3")
DEFAULT_KEY = os.getenv("SILICONFLOW_API_KEY", "")

TASK_TEMPERATURE: dict[AiTaskId, float] = {
    "task.product_extract": 0.3,
    "task.market_research": 0.5,
    "task.content_write": 0.55,
    "task.seo_optimize": 0.4,
    "task.social_adapt": 0.65,
    "task.result_merge": 0.35,
}


def get_llm(task_id: AiTaskId) -> LLM:
    prefix = TASK_ENV_PREFIX[task_id]
    model = os.getenv(f"{prefix}_MODEL", DEFAULT_MODEL)
    api_key = os.getenv("SILICONFLOW_API_KEY", DEFAULT_KEY)

    if not api_key:
        raise ValueError("未配置 SILICONFLOW_API_KEY，请在 .env 中设置")

    return LLM(
        model=f"openai/{model}",
        base_url=SILICONFLOW_BASE_URL,
        api_key=api_key,
        temperature=TASK_TEMPERATURE.get(task_id, 0.5),
    )


def build_vision_user_content(description: str, image_url: Optional[str], image_base64: Optional[str]) -> str:
    """Vision Task 将图片信息写入任务描述（CrewAI 文本 Task 携带 URL/base64 提示）。"""
    parts = [f"产品文字描述：{description}"]
    if image_url:
        parts.append(f"产品图片 URL（请结合图片分析）：{image_url}")
    if image_base64:
        prefix = image_base64[:80] + "..." if len(image_base64) > 80 else image_base64
        parts.append(f"产品图片 base64（请结合图片分析）：{prefix}")
    return "\n".join(parts)
