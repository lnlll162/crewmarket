"""输出 schema 校验与归一化 — 与 types/index.ts 对齐。"""

from __future__ import annotations

import json
import re
from typing import Any, Callable

SOCIAL_PLATFORMS = ("xiaohongshu", "weibo", "douyin")
PLATFORM_ALIASES = {
    "xiaohongshu": ("xiaohongshu", "小红书", "xhs"),
    "weibo": ("weibo", "微博", "wb"),
    "douyin": ("douyin", "抖音", "dy", "tiktok"),
}


class SchemaValidationError(ValueError):
    """Agent 输出不符合契约。"""


def parse_json(text: str) -> Any:
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if fenced:
        text = fenced.group(1).strip()
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise SchemaValidationError(f"未找到 JSON 对象：{text[:300]}")
    try:
        return json.loads(match.group())
    except json.JSONDecodeError as exc:
        raise SchemaValidationError(f"JSON 解析失败：{exc}") from exc


def _ensure_str(value: Any, label: str) -> str:
    if isinstance(value, str):
        text = value.strip()
    elif value is None:
        raise SchemaValidationError(f"{label} 不能为空")
    else:
        text = str(value).strip()
    if not text:
        raise SchemaValidationError(f"{label} 不能为空")
    return text


def _ensure_str_list(
    value: Any,
    label: str,
    *,
    min_len: int = 1,
    max_len: int | None = None,
) -> list[str]:
    if isinstance(value, str):
        items = [part.strip() for part in re.split(r"[\n;；|]", value) if part.strip()]
    elif isinstance(value, list):
        items = [_ensure_str(item, label) for item in value]
    else:
        raise SchemaValidationError(f"{label} 必须为字符串数组")

    if len(items) < min_len:
        raise SchemaValidationError(f"{label} 至少需要 {min_len} 条，当前 {len(items)} 条")
    if max_len is not None and len(items) > max_len:
        items = items[:max_len]
    return items


def _normalize_field_with_status(raw: Any, label: str) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise SchemaValidationError(f"{label} 必须为对象")

    status = raw.get("status", "confirmed")
    if status not in ("confirmed", "pending"):
        status = "pending"

    value = raw.get("value")
    if isinstance(value, list):
        normalized_value = _ensure_str_list(value, f"{label}.value", min_len=1)
    else:
        normalized_value = _ensure_str(value, f"{label}.value")

    result: dict[str, Any] = {"value": normalized_value, "status": status}
    note = raw.get("note")
    if isinstance(note, str) and note.strip():
        result["note"] = note.strip()
    return result


def validate_product(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SchemaValidationError("产品提取结果必须为 JSON 对象")

    result = {
        "productName": _normalize_field_with_status(data.get("productName"), "productName"),
        "category": _normalize_field_with_status(data.get("category"), "category"),
        "attributes": _normalize_field_with_status(data.get("attributes"), "attributes"),
        "sellingPoints": _normalize_field_with_status(
            data.get("sellingPoints"),
            "sellingPoints",
        ),
        "summary": _ensure_str(data.get("summary"), "summary"),
    }
    selling_values = result["sellingPoints"]["value"]
    if isinstance(selling_values, list) and len(selling_values) < 2:
        raise SchemaValidationError("sellingPoints 至少需要 2 条")
    return result


def validate_market(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SchemaValidationError("市场分析结果必须为 JSON 对象")

    return {
        "marketTrends": _ensure_str(data.get("marketTrends"), "marketTrends"),
        "competitorStyle": _ensure_str(data.get("competitorStyle"), "competitorStyle"),
        "userPersona": _ensure_str(data.get("userPersona"), "userPersona"),
        "marketingSuggestions": _ensure_str_list(
            data.get("marketingSuggestions"),
            "marketingSuggestions",
            min_len=3,
            max_len=6,
        ),
    }


def validate_content(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SchemaValidationError("文案结果必须为 JSON 对象")

    title = _ensure_str(data.get("title"), "title")
    if len(title) < 8 or len(title) > 60:
        raise SchemaValidationError("title 长度应在 8–60 字之间")

    selling_point_copy = _ensure_str_list(
        data.get("sellingPointCopy"),
        "sellingPointCopy",
        min_len=3,
        max_len=5,
    )
    detail_page = _ensure_str(data.get("detailPageContent"), "detailPageContent")
    if len(detail_page) < 120:
        raise SchemaValidationError("detailPageContent 至少 120 字")

    conversion = _ensure_str(data.get("conversionDescription"), "conversionDescription")
    if len(conversion) < 12 or len(conversion) > 80:
        raise SchemaValidationError("conversionDescription 长度应在 12–80 字之间")

    return {
        "title": title,
        "sellingPointCopy": selling_point_copy,
        "detailPageContent": detail_page,
        "conversionDescription": conversion,
    }


def validate_seo(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SchemaValidationError("SEO 结果必须为 JSON 对象")

    keywords = _ensure_str_list(
        data.get("keywords"),
        "keywords",
        min_len=5,
        max_len=12,
    )
    optimized_title = _ensure_str(data.get("optimizedTitle"), "optimizedTitle")
    if len(optimized_title) < 8 or len(optimized_title) > 70:
        raise SchemaValidationError("optimizedTitle 长度应在 8–70 字之间")

    return {
        "keywords": keywords,
        "optimizedTitle": optimized_title,
        "searchFriendlyCopy": _ensure_str(data.get("searchFriendlyCopy"), "searchFriendlyCopy"),
    }


def _normalize_platform(value: Any) -> str | None:
    text = _ensure_str(value, "platform").lower()
    for canonical, aliases in PLATFORM_ALIASES.items():
        if text in aliases or text == canonical:
            return canonical
    return None


def validate_social(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SchemaValidationError("社媒结果必须为 JSON 对象")

    copies_raw = data.get("copies")
    if not isinstance(copies_raw, list) or not copies_raw:
        raise SchemaValidationError("copies 必须为非空数组")

    by_platform: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(copies_raw):
        if not isinstance(item, dict):
            raise SchemaValidationError(f"copies[{index}] 必须为对象")
        platform = _normalize_platform(item.get("platform"))
        if not platform:
            raise SchemaValidationError(f"copies[{index}].platform 无效")
        content = _ensure_str(item.get("content"), f"copies[{index}].content")
        hashtags = _ensure_str_list(
            item.get("hashtags"),
            f"copies[{index}].hashtags",
            min_len=2,
            max_len=8,
        )
        normalized_tags = [
            tag if tag.startswith("#") else f"#{tag.lstrip('#')}" for tag in hashtags
        ]
        by_platform[platform] = {
            "platform": platform,
            "content": content,
            "hashtags": normalized_tags,
        }

    missing = [p for p in SOCIAL_PLATFORMS if p not in by_platform]
    if missing:
        raise SchemaValidationError(f"缺少社媒平台：{', '.join(missing)}")

    result: dict[str, Any] = {
        "copies": [by_platform[p] for p in SOCIAL_PLATFORMS],
    }
    script = data.get("scriptSuggestion")
    if isinstance(script, str) and script.strip():
        result["scriptSuggestion"] = script.strip()
    return result


def validate_merge_review(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SchemaValidationError("汇总校验结果必须为 JSON 对象")

    consistency_notes = _ensure_str_list(
        data.get("consistencyNotes"),
        "consistencyNotes",
        min_len=1,
        max_len=8,
    )
    pending_raw = data.get("pendingConfirmations", [])
    pending: list[str] = []
    if pending_raw:
        pending = _ensure_str_list(pending_raw, "pendingConfirmations", min_len=1, max_len=12)

    return {
        "consistencyNotes": consistency_notes,
        "pendingConfirmations": pending,
    }


Validator = Callable[[Any], dict[str, Any]]
