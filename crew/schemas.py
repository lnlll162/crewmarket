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


def _normalize_optional_generation(data: Any, label: str) -> dict[str, Any]:
    if data is None:
        return {"status": "pending"}
    if not isinstance(data, dict):
        raise SchemaValidationError(f"{label} 必须为对象")

    status = data.get("status", "pending")
    if status not in ("pending", "submitted", "processing", "completed", "generated", "failed"):
        status = "pending"

    result: dict[str, Any] = {"status": status}
    prompt = data.get("prompt")
    if prompt is not None:
        result["prompt"] = _ensure_str(prompt, f"{label}.prompt")

    for key in ("model", "provider", "url", "requestId", "error", "message"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            result[key] = value.strip()

    images = data.get("images")
    if isinstance(images, list):
        normalized_images: list[dict[str, Any]] = []
        for item in images:
            if isinstance(item, dict):
                url = item.get("url")
                if isinstance(url, str) and url.strip():
                    normalized_images.append({"url": url.strip()})
        if normalized_images:
            result["images"] = normalized_images

    urls = data.get("urls")
    if isinstance(urls, list):
        normalized_urls = []
        for item in urls:
            if isinstance(item, str) and item.strip():
                normalized_urls.append(item.strip())
        if normalized_urls:
            result["urls"] = normalized_urls

    timings = data.get("timings")
    if isinstance(timings, dict):
        result["timings"] = timings

    raw = data.get("raw")
    if isinstance(raw, dict):
        result["raw"] = raw

    return result


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

    result: dict[str, Any] = {
        "title": title,
        "sellingPointCopy": selling_point_copy,
        "detailPageContent": detail_page,
        "conversionDescription": conversion,
        "videoScript": _ensure_str(data.get("videoScript"), "videoScript"),
    }

    poster = data.get("posterCopy")
    if isinstance(poster, dict):
        result["posterCopy"] = {
            "headline": _ensure_str(poster.get("headline"), "posterCopy.headline"),
            "subheadline": _ensure_str(poster.get("subheadline"), "posterCopy.subheadline"),
            "slogan": _ensure_str(poster.get("slogan"), "posterCopy.slogan"),
        }

    image_ideas_raw = data.get("imageIdeas")
    image_ideas: list[dict[str, Any]] = []
    if isinstance(image_ideas_raw, list):
        for index, item in enumerate(image_ideas_raw[:5]):
            if not isinstance(item, dict):
                continue
            try:
                image_ideas.append(
                    {
                        "title": _ensure_str(item.get("title"), f"imageIdeas[{index}].title"),
                        "description": _ensure_str(item.get("description"), f"imageIdeas[{index}].description"),
                        "usage": _ensure_str(item.get("usage"), f"imageIdeas[{index}].usage"),
                    }
                )
            except SchemaValidationError:
                continue
    result["imageIdeas"] = image_ideas

    video_material = data.get("videoMaterial")
    if isinstance(video_material, dict):
        try:
            result["videoMaterial"] = {
                "hook": _ensure_str(video_material.get("hook"), "videoMaterial.hook"),
                "scenes": _ensure_str_list(video_material.get("scenes"), "videoMaterial.scenes", min_len=2, max_len=6),
                "voiceover": _ensure_str(video_material.get("voiceover"), "videoMaterial.voiceover"),
                "caption": _ensure_str(video_material.get("caption"), "videoMaterial.caption"),
            }
        except SchemaValidationError:
            result["videoMaterial"] = {"hook": "", "scenes": [], "voiceover": "", "caption": ""}
    else:
        result["videoMaterial"] = {"hook": "", "scenes": [], "voiceover": "", "caption": ""}

    result["imageGeneration"] = _normalize_optional_generation(data.get("imageGeneration"), "imageGeneration")
    result["videoGeneration"] = _normalize_optional_generation(data.get("videoGeneration"), "videoGeneration")

    return result


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

    channel_adaptation = data.get("channelAdaptation")
    if not isinstance(channel_adaptation, dict):
        raise SchemaValidationError("channelAdaptation 必须为对象")

    return {
        "keywords": keywords,
        "optimizedTitle": optimized_title,
        "searchFriendlyCopy": _ensure_str(data.get("searchFriendlyCopy"), "searchFriendlyCopy"),
        "channelAdaptation": {
            "xiaohongshu": _ensure_str(channel_adaptation.get("xiaohongshu"), "channelAdaptation.xiaohongshu"),
            "weibo": _ensure_str(channel_adaptation.get("weibo"), "channelAdaptation.weibo"),
            "douyin": _ensure_str(channel_adaptation.get("douyin"), "channelAdaptation.douyin"),
        },
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


def _ensure_confidence(value: Any, label: str = "confidence") -> float:
    try:
        score = float(value)
    except (TypeError, ValueError) as exc:
        raise SchemaValidationError(f"{label} 必须为 0-1 之间数字") from exc
    return max(0.0, min(1.0, score))


def _ensure_severity(value: Any, label: str) -> str:
    text = _ensure_str(value, label).lower()
    if text not in ("low", "medium", "high"):
        raise SchemaValidationError(f"{label} 必须为 low、medium 或 high")
    return text


def _validate_title_detail_items(
    value: Any,
    label: str,
    *,
    min_len: int = 1,
    max_len: int = 8,
    with_severity: bool = False,
) -> list[dict[str, str]]:
    if not isinstance(value, list):
        raise SchemaValidationError(f"{label} 必须为数组")
    if len(value) < min_len:
        raise SchemaValidationError(f"{label} 至少需要 {min_len} 条")
    items: list[dict[str, str]] = []
    for index, raw in enumerate(value[:max_len]):
        if not isinstance(raw, dict):
            raise SchemaValidationError(f"{label}[{index}] 必须为对象")
        item = {
            "title": _ensure_str(raw.get("title"), f"{label}[{index}].title"),
            "detail": _ensure_str(raw.get("detail"), f"{label}[{index}].detail"),
        }
        if with_severity:
            item["severity"] = _ensure_severity(raw.get("severity"), f"{label}[{index}].severity")
        items.append(item)
    return items


def validate_pipeline_summary(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SchemaValidationError("汇总报告必须为 JSON 对象")

    executive_summary = _ensure_str(data.get("executiveSummary"), "executiveSummary")

    module_summary_raw = data.get("moduleSummary") or []
    if not isinstance(module_summary_raw, list):
        raise SchemaValidationError("moduleSummary 必须为数组")
    module_summary: list[dict[str, Any]] = []
    for index, raw in enumerate(module_summary_raw[:12]):
        if not isinstance(raw, dict):
            raise SchemaValidationError(f"moduleSummary[{index}] 必须为对象")
        module_summary.append(
            {
                "moduleId": _ensure_str(raw.get("moduleId"), f"moduleSummary[{index}].moduleId"),
                "moduleName": _ensure_str(raw.get("moduleName"), f"moduleSummary[{index}].moduleName"),
                "title": _ensure_str(raw.get("title"), f"moduleSummary[{index}].title"),
                "summary": _ensure_str(raw.get("summary"), f"moduleSummary[{index}].summary"),
                "status": raw.get("status") if raw.get("status") in ("pending", "running", "completed", "failed") else "completed",
            }
        )

    role_eval_raw = data.get("roleEvaluation") or []
    if not isinstance(role_eval_raw, list) or not role_eval_raw:
        raise SchemaValidationError("roleEvaluation 至少需要 1 条")
    role_evaluation: list[dict[str, Any]] = []
    for index, raw in enumerate(role_eval_raw[:12]):
        if not isinstance(raw, dict):
            raise SchemaValidationError(f"roleEvaluation[{index}] 必须为对象")
        item: dict[str, Any] = {
            "roleId": _ensure_str(raw.get("roleId"), f"roleEvaluation[{index}].roleId"),
            "roleName": _ensure_str(raw.get("roleName"), f"roleEvaluation[{index}].roleName"),
            "evaluation": _ensure_str(raw.get("evaluation"), f"roleEvaluation[{index}].evaluation"),
        }
        if raw.get("score") is not None:
            try:
                item["score"] = max(1, min(10, int(raw.get("score"))))
            except (TypeError, ValueError):
                pass
        role_evaluation.append(item)

    perf_raw = data.get("performanceReview") or {}
    if not isinstance(perf_raw, dict):
        raise SchemaValidationError("performanceReview 必须为对象")
    performance_review = {
        "summary": _ensure_str(perf_raw.get("summary"), "performanceReview.summary"),
    }

    risk_assessment = _validate_title_detail_items(
        data.get("riskAssessment"),
        "riskAssessment",
        min_len=1,
        max_len=8,
        with_severity=True,
    )
    opportunity_analysis = _validate_title_detail_items(
        data.get("opportunityAnalysis"),
        "opportunityAnalysis",
        min_len=1,
        max_len=6,
    )
    recommendations = _validate_title_detail_items(
        data.get("recommendations"),
        "recommendations",
        min_len=1,
        max_len=8,
    )
    pdf_highlights = _ensure_str_list(data.get("pdfHighlights"), "pdfHighlights", min_len=1, max_len=8)

    missing_raw = data.get("missingInfo", [])
    missing_info: list[str] = []
    if missing_raw:
        missing_info = _ensure_str_list(missing_raw, "missingInfo", min_len=1, max_len=20)

    return {
        "executiveSummary": executive_summary,
        "moduleSummary": module_summary,
        "roleEvaluation": role_evaluation,
        "performanceReview": performance_review,
        "riskAssessment": risk_assessment,
        "opportunityAnalysis": opportunity_analysis,
        "recommendations": recommendations,
        "pdfHighlights": pdf_highlights,
        "confidence": _ensure_confidence(data.get("confidence")),
        "missingInfo": missing_info,
    }


PDF_SECTION_IDS = frozenset(
    {
        "taskOverview",
        "inputSummary",
        "moduleOutputs",
        "rolePerformance",
        "telemetryStats",
        "assessment",
        "risks",
        "opportunities",
        "recommendations",
        "appendix",
    }
)


def validate_pdf_report(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SchemaValidationError("PDF 报告必须为 JSON 对象")

    report_title = _ensure_str(data.get("reportTitle"), "reportTitle")
    subtitle = data.get("subtitle")
    subtitle_str = subtitle.strip() if isinstance(subtitle, str) and subtitle.strip() else None
    generated_at = _ensure_str(data.get("generatedAt"), "generatedAt")
    pipeline_id = data.get("pipelineId")
    pipeline_id_str = pipeline_id.strip() if isinstance(pipeline_id, str) and pipeline_id.strip() else None
    prompt_version = data.get("promptVersion")
    prompt_version_str = (
        prompt_version.strip() if isinstance(prompt_version, str) and prompt_version.strip() else "v1.0.0"
    )
    model_used = data.get("modelUsed")
    model_used_str = model_used.strip() if isinstance(model_used, str) and model_used.strip() else None

    cover_highlights = _ensure_str_list(data.get("coverHighlights"), "coverHighlights", min_len=1, max_len=8)

    sections_raw = data.get("sections") or []
    if not isinstance(sections_raw, list) or len(sections_raw) < 4:
        raise SchemaValidationError("sections 至少需要 4 条")
    sections: list[dict[str, Any]] = []
    for index, raw in enumerate(sections_raw[:12]):
        if not isinstance(raw, dict):
            raise SchemaValidationError(f"sections[{index}] 必须为对象")
        section_id = _ensure_str(raw.get("id"), f"sections[{index}].id")
        if section_id not in PDF_SECTION_IDS:
            raise SchemaValidationError(f"sections[{index}].id 不在允许列表内：{section_id}")
        bullets_raw = raw.get("bullets") or []
        bullets: list[str] = []
        if bullets_raw:
            bullets = _ensure_str_list(bullets_raw, f"sections[{index}].bullets", min_len=1, max_len=8)
        sections.append(
            {
                "id": section_id,
                "title": _ensure_str(raw.get("title"), f"sections[{index}].title"),
                "content": _ensure_str(raw.get("content"), f"sections[{index}].content"),
                "bullets": bullets,
            }
        )

    telemetry_raw = data.get("telemetrySnapshot") or {}
    if not isinstance(telemetry_raw, dict):
        raise SchemaValidationError("telemetrySnapshot 必须为对象")
    telemetry_snapshot: dict[str, Any] = {}
    for key in ("totalDurationMs", "totalTokens"):
        if telemetry_raw.get(key) is not None:
            try:
                telemetry_snapshot[key] = int(telemetry_raw[key])
            except (TypeError, ValueError):
                pass
    if telemetry_raw.get("successRate") is not None:
        try:
            telemetry_snapshot["successRate"] = max(0.0, min(1.0, float(telemetry_raw["successRate"])))
        except (TypeError, ValueError):
            pass
    summary_text = telemetry_raw.get("summaryText")
    if isinstance(summary_text, str) and summary_text.strip():
        telemetry_snapshot["summaryText"] = summary_text.strip()

    disclaimer_raw = data.get("disclaimer")
    disclaimer = (
        disclaimer_raw.strip()
        if isinstance(disclaimer_raw, str) and disclaimer_raw.strip()
        else "本报告由 AI 自动生成，仅供内部评审参考，投放前请人工复核。"
    )

    result: dict[str, Any] = {
        "reportTitle": report_title,
        "generatedAt": generated_at,
        "promptVersion": prompt_version_str,
        "coverHighlights": cover_highlights,
        "sections": sections,
        "telemetrySnapshot": telemetry_snapshot,
        "disclaimer": disclaimer,
        "confidence": _ensure_confidence(data.get("confidence")),
    }
    if subtitle_str:
        result["subtitle"] = subtitle_str
    if pipeline_id_str:
        result["pipelineId"] = pipeline_id_str
    if model_used_str:
        result["modelUsed"] = model_used_str
    return result


Validator = Callable[[Any], dict[str, Any]]
