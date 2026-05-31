"""硅基流动模型目录：生产接口仅返回已实测白名单。"""

from __future__ import annotations

from typing import Any

from siliconflow.client import get_json
from siliconflow.registry import CAPABILITIES, VISION_MODEL_HINTS
from siliconflow.verified_models import to_profile_dict, verified_model_ids


def list_models(
    *,
    sub_type: str | None = None,
    model_type: str | None = None,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {}
    if sub_type:
        params["sub_type"] = sub_type
    if model_type:
        params["type"] = model_type
    data = get_json("/models", params=params or None)
    items = data.get("data") or []
    if not isinstance(items, list):
        return []
    return [
        {
            "id": item.get("id"),
            "object": item.get("object"),
            "ownedBy": item.get("owned_by"),
        }
        for item in items
        if isinstance(item, dict) and item.get("id")
    ]


def _filter_vision(chat_models: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        item
        for item in chat_models
        if any(hint in str(item.get("id", "")) for hint in VISION_MODEL_HINTS)
    ]


def _filter_whitelist(models: list[dict[str, Any]], *, extra_ids: set[str] | None = None) -> list[dict[str, Any]]:
    allowed = verified_model_ids() | (extra_ids or set())
    return [item for item in models if item.get("id") in allowed]


def fetch_verified_catalog() -> dict[str, Any]:
    """重构默认：仅返回已实测绑定的模型（供配置页 / GET /api/siliconflow/models）。"""
    whitelist = verified_model_ids()
    capabilities: dict[str, Any] = {}

    for cap_id, meta in CAPABILITIES.items():
        default_id = meta["default_model"]
        entry_models = [{"id": default_id, "object": "model", "verified": True}]
        list_sub = meta.get("list_sub_type")
        list_type = meta.get("list_type")
        if list_sub or list_type:
            try:
                account_models = list_models(
                    sub_type=list_sub if isinstance(list_sub, str) else None,
                    model_type=list_type,
                )
                matched = _filter_whitelist(account_models)
                if cap_id == "vision":
                    matched = _filter_whitelist(_filter_vision(account_models), extra_ids=whitelist)
                if matched:
                    entry_models = [{**m, "verified": m.get("id") in whitelist} for m in matched]
            except ValueError:
                pass

        capabilities[cap_id] = {
            "label": meta["label"],
            "path": meta["path"],
            "scope": meta["scope"],
            "defaultModel": default_id,
            "envModel": meta["env_model"],
            "models": entry_models,
        }

    return {
        "provider": "siliconflow",
        "catalogMode": "verified",
        "profile": to_profile_dict(),
        "capabilities": capabilities,
    }


def fetch_account_catalog() -> dict[str, Any]:
    """调试用：返回账号下全部可用模型（不用于生产默认）。"""
    grouped: dict[str, Any] = {"provider": "siliconflow", "catalogMode": "account", "capabilities": {}}
    for cap_id, meta in CAPABILITIES.items():
        list_sub = meta.get("list_sub_type")
        list_type = meta.get("list_type")
        models: list[dict[str, Any]] = []
        if list_sub or list_type:
            try:
                models = list_models(
                    sub_type=list_sub if isinstance(list_sub, str) else None,
                    model_type=list_type,
                )
                if not models and list_type == "audio":
                    models = list_models(model_type="audio")
            except ValueError:
                models = []
        grouped["capabilities"][cap_id] = {
            "label": meta["label"],
            "path": meta["path"],
            "scope": meta["scope"],
            "defaultModel": meta["default_model"],
            "envModel": meta["env_model"],
            "models": models,
        }
    chat_models = grouped["capabilities"].get("chat", {}).get("models") or []
    grouped["capabilities"]["vision"] = {
        **grouped["capabilities"].get("vision", {}),
        "models": _filter_vision(chat_models),
    }
    return grouped


# 兼容旧调用
def fetch_full_catalog() -> dict[str, Any]:
    return fetch_verified_catalog()
