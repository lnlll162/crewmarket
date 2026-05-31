"""拉取账号下全部硅基流动模型（按 API sub_type 分组）。"""

from __future__ import annotations

from typing import Any

from siliconflow.catalog import list_models

# (catalogKey, label, sub_type, model_type, apiPath)
ACCOUNT_CATALOG_SPECS: list[tuple[str, str, str | None, str | None, str]] = [
    ("chat", "文本对话", "chat", "text", "/chat/completions"),
    ("embedding", "向量嵌入", "embedding", None, "/embeddings"),
    ("rerank", "重排序", "reranker", None, "/rerank"),
    ("image", "文生图", "text-to-image", None, "/images/generations"),
    ("image_edit", "图生图", "image-to-image", None, "/images/generations"),
    ("video", "文生视频", "text-to-video", None, "/video/submit"),
    ("speech", "文本转语音", "text-to-speech", "audio", "/audio/speech"),
    ("stt", "语音转文本", "speech-to-text", "audio", "/audio/transcriptions"),
]


def fetch_complete_account_catalog() -> dict[str, Any]:
    capabilities: dict[str, Any] = {}
    total = 0
    for key, label, sub_type, model_type, path in ACCOUNT_CATALOG_SPECS:
        models: list[dict[str, Any]] = []
        try:
            models = list_models(sub_type=sub_type, model_type=model_type)
            if not models and model_type == "audio" and sub_type:
                models = list_models(sub_type=sub_type)
        except ValueError:
            models = []

        if key == "image":
            edit_models = [m for m in models if _is_image_edit_model(m.get("id", ""))]
            models = [m for m in models if not _is_image_edit_model(m.get("id", ""))]
            if edit_models:
                capabilities.setdefault(
                    "image_edit",
                    {
                        "label": "图生图",
                        "path": "/images/generations",
                        "subType": "image-to-image",
                        "modelType": None,
                        "models": [],
                        "count": 0,
                    },
                )
                capabilities["image_edit"]["models"] = edit_models
                capabilities["image_edit"]["count"] = len(edit_models)

        capabilities[key] = {
            "label": label,
            "path": path,
            "subType": sub_type,
            "modelType": model_type,
            "models": models,
            "count": len(models),
        }
        total += len(models)

    # 合并 image_edit count 到 total
    total += len(capabilities.get("image_edit", {}).get("models") or [])
    return {
        "provider": "siliconflow",
        "catalogMode": "account_complete",
        "totalModels": total,
        "capabilities": capabilities,
    }


def _is_image_edit_model(model_id: str) -> bool:
    lowered = model_id.lower()
    return "edit" in lowered or "image-edit" in lowered


def iter_account_models() -> list[dict[str, Any]]:
    """扁平化 (catalogKey, modelId) 列表，chat 与 vision 不重复探测。"""
    catalog = fetch_complete_account_catalog()
    rows: list[dict[str, Any]] = []
    seen_chat: set[str] = set()
    for key, block in catalog["capabilities"].items():
        probe_kind = _catalog_key_to_probe_kind(key)
        for item in block.get("models") or []:
            model_id = item.get("id")
            if not model_id:
                continue
            if probe_kind == "chat":
                if model_id in seen_chat:
                    continue
                seen_chat.add(model_id)
            rows.append(
                {
                    "catalogKey": key,
                    "probeKind": probe_kind,
                    "modelId": model_id,
                    "path": block.get("path"),
                }
            )
    return rows


def _catalog_key_to_probe_kind(catalog_key: str) -> str:
    mapping = {
        "chat": "chat",
        "embedding": "embedding",
        "rerank": "rerank",
        "image": "image",
        "image_edit": "image_edit",
        "video": "video_submit",
        "speech": "speech",
        "stt": "stt",
    }
    return mapping.get(catalog_key, "chat")
