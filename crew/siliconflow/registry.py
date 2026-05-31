"""硅基流动能力注册表：端点与 Task 绑定。"""

from __future__ import annotations

from typing import TypedDict

from config import TASK_ENV_PREFIX, AiTaskId
from siliconflow.verified_models import (
    VERIFIED_TASK_MODELS,
    capability_default_model,
    task_default_model,
)

SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1"

PATH_CHAT = "/chat/completions"
PATH_MODELS = "/models"
PATH_EMBEDDINGS = "/embeddings"
PATH_RERANK = "/rerank"
PATH_IMAGE_GENERATIONS = "/images/generations"
PATH_VIDEO_SUBMIT = "/video/submit"
PATH_VIDEO_STATUS = "/video/status"
PATH_SPEECH = "/audio/speech"
PATH_TRANSCRIPTIONS = "/audio/transcriptions"


class CapabilityMeta(TypedDict):
    id: str
    label: str
    path: str
    env_model: str
    default_model: str
    scope: str
    list_sub_type: str | None
    list_type: str | None


def _cap(
    cap_id: str,
    label: str,
    path: str,
    env_model: str,
    scope: str,
    list_sub_type: str | None = None,
    list_type: str | None = None,
) -> CapabilityMeta:
    default = capability_default_model(cap_id)
    if not default:
        raise ValueError(f"未注册默认模型: {cap_id}")
    return {
        "id": cap_id,
        "label": label,
        "path": path,
        "env_model": env_model,
        "default_model": default,
        "scope": scope,
        "list_sub_type": list_sub_type,
        "list_type": list_type,
    }


CAPABILITIES: dict[str, CapabilityMeta] = {
    "chat": _cap("chat", "文本对话", PATH_CHAT, "LLM_DEFAULT_MODEL", "pipeline", "chat", "text"),
    "vision": _cap(
        "vision",
        "视觉识图",
        PATH_CHAT,
        "AGENT_MODEL_PRODUCT_EXTRACT_MODEL",
        "pipeline",
        "chat",
        "text",
    ),
    "image": _cap("image", "文生图", PATH_IMAGE_GENERATIONS, "AGENT_IMAGE_MODEL", "pipeline", "text-to-image"),
    "image_edit": _cap(
        "image_edit",
        "图生图",
        PATH_IMAGE_GENERATIONS,
        "AGENT_IMAGE_EDIT_MODEL",
        "optional",
        "image-to-image",
    ),
    "video": _cap("video", "文生视频", PATH_VIDEO_SUBMIT, "AGENT_VIDEO_MODEL", "pipeline", "text-to-video"),
    "embedding": _cap(
        "embedding",
        "向量嵌入",
        PATH_EMBEDDINGS,
        "SILICONFLOW_EMBEDDING_MODEL",
        "auxiliary",
        "embedding",
    ),
    "rerank": _cap("rerank", "重排序", PATH_RERANK, "SILICONFLOW_RERANK_MODEL", "auxiliary", "reranker"),
    "speech": _cap(
        "speech",
        "文本转语音",
        PATH_SPEECH,
        "SILICONFLOW_SPEECH_MODEL",
        "optional",
        "text-to-speech",
        "audio",
    ),
    "stt": _cap(
        "stt",
        "语音转文本",
        PATH_TRANSCRIPTIONS,
        "SILICONFLOW_STT_MODEL",
        "optional",
        "speech-to-text",
        "audio",
    ),
}

TASK_DEFAULT_MODELS: dict[AiTaskId, str] = {
    task_id: task_default_model(task_id) for task_id in VERIFIED_TASK_MODELS
}

VISION_MODEL_HINTS = ("VL", "OCR", "Vision", "vision")

from siliconflow.verified_models import VERIFIED_GENERATION_MODELS  # noqa: E402

SILICONFLOW_IMAGE_MODEL = VERIFIED_GENERATION_MODELS["image"].model_id
SILICONFLOW_VIDEO_MODEL = VERIFIED_GENERATION_MODELS["video"].model_id
SILICONFLOW_IMAGE_PATH = PATH_IMAGE_GENERATIONS
SILICONFLOW_VIDEO_SUBMIT_PATH = PATH_VIDEO_SUBMIT
SILICONFLOW_VIDEO_STATUS_PATH = PATH_VIDEO_STATUS


def task_env_key(task_id: AiTaskId, suffix: str) -> str:
    prefix = TASK_ENV_PREFIX[task_id]
    return f"{prefix}_{suffix}"
