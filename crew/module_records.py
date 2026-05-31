"""Pipeline 模块过程记录：inputSummary / outputSummary / promptVersion。"""

from __future__ import annotations

import json
from typing import Any, Optional

from prompts import PROMPT_VERSIONS, ROLE_DEFINITIONS


def _module_meta(role_id: str, module_label: str) -> tuple[str, str, str]:
    meta = ROLE_DEFINITIONS[role_id]
    return (meta["roleId"], meta["roleName"], module_label)


MODULE_META: dict[str, tuple[str, str, str]] = {
    "productExtract": _module_meta("productExtract", "产品提取"),
    "marketResearch": _module_meta("marketResearch", "市场分析"),
    "content": _module_meta("content", "文案生成"),
    "seo": _module_meta("seo", "SEO 优化"),
    "social": _module_meta("social", "社媒改写"),
    "merged": _module_meta("merged", "结果汇总"),
}

SUMMARY_MAX_LEN = 220


def _truncate(text: str, limit: int = SUMMARY_MAX_LEN) -> str:
    value = (text or "").strip().replace("\n", " ")
    if len(value) <= limit:
        return value
    return value[: limit - 1].rstrip() + "…"


def _telemetry_for_module(telemetry: list[dict[str, Any]], module_id: str) -> dict[str, Any] | None:
    matches = [item for item in telemetry if item.get("moduleId") == module_id]
    if not matches:
        return None
    for item in reversed(matches):
        if item.get("status") == "success":
            return item
    return matches[-1]


def summarize_product_input(
    description: str,
    *,
    image_url: Optional[str] = None,
    image_base64: Optional[str] = None,
    options: Optional[dict[str, Any]] = None,
) -> str:
    parts = [f"文字描述：{_truncate(description, 120)}"]
    if image_url:
        parts.append("含产品图片 URL")
    elif image_base64:
        parts.append("含产品图片 base64")
    if options:
        parts.append(f"补充选项：{_truncate(json.dumps(options, ensure_ascii=False), 80)}")
    return "；".join(parts)


def summarize_product_output(product: dict[str, Any]) -> str:
    name = product.get("productName", {}).get("value", "")
    category = product.get("category", {}).get("value", "")
    points = product.get("sellingPoints", {}).get("value", [])
    point_text = "、".join(points[:3]) if isinstance(points, list) else ""
    return _truncate(
        f"产品：{name or '待确认'} | 品类：{category or '待确认'} | 卖点：{point_text or '—'} | {product.get('summary', '')}"
    )


def summarize_market_input(product: dict[str, Any], options_text: str) -> str:
    name = product.get("productName", {}).get("value", "")
    category = product.get("category", {}).get("value", "")
    return _truncate(f"基于产品「{name}」（{category}）与补充选项：{options_text}")


def summarize_market_output(market: dict[str, Any]) -> str:
    suggestions = market.get("marketingSuggestions") or []
    suggestion_text = "、".join(suggestions[:2]) if isinstance(suggestions, list) else ""
    return _truncate(
        f"趋势：{market.get('marketTrends', '')} | 人群：{market.get('userPersona', '')} | 建议：{suggestion_text}"
    )


def summarize_content_input(product: dict[str, Any], market: dict[str, Any], options_text: str) -> str:
    name = product.get("productName", {}).get("value", "")
    tone = market.get("brandTone", "")
    return _truncate(f"产品「{name}」+ 市场调性「{tone}」+ 选项：{options_text}")


def summarize_content_output(content: dict[str, Any]) -> str:
    poster = content.get("posterCopy") or {}
    ideas = content.get("imageIdeas") or []
    return _truncate(
        f"标题：{content.get('title', '')} | 海报：{poster.get('headline', '')} | "
        f"创意 {len(ideas) if isinstance(ideas, list) else 0} 条 | 转化：{content.get('conversionDescription', '')}"
    )


def summarize_seo_input(content: dict[str, Any], category: str) -> str:
    return _truncate(f"基于文案标题「{content.get('title', '')}」与品类「{category}」做搜索与渠道优化")


def summarize_seo_output(seo: dict[str, Any]) -> str:
    keywords = seo.get("keywords") or []
    keyword_text = "、".join(keywords[:5]) if isinstance(keywords, list) else ""
    return _truncate(
        f"关键词：{keyword_text} | 优化标题：{seo.get('optimizedTitle', '')} | 搜索文案已生成"
    )


def summarize_social_input(product: dict[str, Any], content: dict[str, Any]) -> str:
    points = product.get("sellingPoints", {}).get("value", [])
    point_text = "、".join(points[:2]) if isinstance(points, list) else ""
    return _truncate(f"卖点：{point_text} | 主标题：{content.get('title', '')}")


def summarize_social_output(social: dict[str, Any]) -> str:
    copies = social.get("copies") or []
    platforms: list[str] = []
    if isinstance(copies, list):
        for item in copies[:3]:
            if isinstance(item, dict) and item.get("platform"):
                platforms.append(str(item["platform"]))
    platform_text = "、".join(platforms) if platforms else "多平台"
    script = social.get("scriptSuggestion") or ""
    return _truncate(f"已生成 {platform_text} 文案 | 脚本建议：{script}")


def summarize_merge_input(pending: list[str]) -> str:
    pending_text = "；".join(pending[:3]) if pending else "无"
    return _truncate(f"汇总 product / market / content / seo / social 五模块输出 | 待确认：{pending_text}")


def summarize_merge_output(merged: dict[str, Any]) -> str:
    notes = merged.get("consistencyNotes") or []
    pending = merged.get("pendingConfirmations") or []
    first_note = notes[0] if isinstance(notes, list) and notes else "—"
    return _truncate(
        f"一致性说明 {len(notes) if isinstance(notes, list) else 0} 条（{first_note}）| "
        f"待确认 {len(pending) if isinstance(pending, list) else 0} 项"
    )


def build_module_record(
    module_id: str,
    *,
    telemetry: list[dict[str, Any]],
    raw: Any,
    input_summary: str,
    output_summary: str,
    status: str = "completed",
    model: str | None = None,
    error_message: str | None = None,
) -> dict[str, Any]:
    role_id, role_name, module_name = MODULE_META[module_id]
    tel = _telemetry_for_module(telemetry, module_id)
    tel_status = tel.get("status") if tel else None
    module_status = "failed" if status == "failed" or tel_status in {"failed", "timeout"} else "completed"

    record: dict[str, Any] = {
        "moduleId": module_id,
        "moduleName": module_name,
        "roleId": role_id,
        "roleName": role_name,
        "status": module_status,
        "inputSummary": input_summary,
        "outputSummary": output_summary,
        "promptVersion": PROMPT_VERSIONS.get(module_id, "v1.0.0"),
        "raw": raw,
    }

    resolved_model = model or (tel.get("model") if tel else None)
    if resolved_model:
        record["model"] = resolved_model
    if tel:
        record["startedAt"] = tel.get("startedAt")
        record["finishedAt"] = tel.get("finishedAt")
        record["durationMs"] = tel.get("durationMs")
        record["inputTokens"] = tel.get("inputTokens")
        record["outputTokens"] = tel.get("outputTokens")
        record["totalTokens"] = tel.get("totalTokens")
        if tel.get("errorMessage"):
            record["errorMessage"] = tel.get("errorMessage")
    if error_message:
        record["errorMessage"] = error_message

    return record


def build_full_pipeline_modules(
    *,
    telemetry: list[dict[str, Any]],
    product: dict[str, Any],
    market_research: dict[str, Any],
    content: dict[str, Any],
    seo: dict[str, Any],
    social: dict[str, Any],
    merged: dict[str, Any],
    description: str,
    image_url: Optional[str],
    image_base64: Optional[str],
    options: Optional[dict[str, Any]],
    options_text: str,
    category: str,
    pending: list[str],
) -> list[dict[str, Any]]:
    return [
        build_module_record(
            "productExtract",
            telemetry=telemetry,
            raw=product,
            input_summary=summarize_product_input(
                description,
                image_url=image_url,
                image_base64=image_base64,
                options=options,
            ),
            output_summary=summarize_product_output(product),
        ),
        build_module_record(
            "marketResearch",
            telemetry=telemetry,
            raw=market_research,
            input_summary=summarize_market_input(product, options_text),
            output_summary=summarize_market_output(market_research),
        ),
        build_module_record(
            "content",
            telemetry=telemetry,
            raw=content,
            input_summary=summarize_content_input(product, market_research, options_text),
            output_summary=summarize_content_output(content),
        ),
        build_module_record(
            "seo",
            telemetry=telemetry,
            raw=seo,
            input_summary=summarize_seo_input(content, category),
            output_summary=summarize_seo_output(seo),
        ),
        build_module_record(
            "social",
            telemetry=telemetry,
            raw=social,
            input_summary=summarize_social_input(product, content),
            output_summary=summarize_social_output(social),
        ),
        build_module_record(
            "merged",
            telemetry=telemetry,
            raw=merged,
            input_summary=summarize_merge_input(pending),
            output_summary=summarize_merge_output(merged),
        ),
    ]


def build_partial_modules_from_steps(
    steps: dict[str, Any],
    telemetry: list[dict[str, Any]],
    *,
    description: str = "",
    image_url: Optional[str] = None,
    image_base64: Optional[str] = None,
    options: Optional[dict[str, Any]] = None,
    options_text: str = "无",
    pending: Optional[list[str]] = None,
) -> list[dict[str, Any]]:
    """失败时根据已完成 steps 重建过程记录。"""
    pending = pending or []
    modules: list[dict[str, Any]] = []
    product = steps.get("productExtract") or {}
    market = steps.get("marketResearch") or {}
    content = steps.get("content") or {}
    seo = steps.get("seo") or {}
    social = steps.get("social") or {}
    merged = steps.get("merged") or {}
    category = product.get("category", {}).get("value", "") if isinstance(product, dict) else ""

    builders: dict[str, tuple[Any, str, str]] = {
        "productExtract": (
            product,
            summarize_product_input(description, image_url=image_url, image_base64=image_base64, options=options),
            summarize_product_output(product) if product else "未完成",
        ),
        "marketResearch": (
            market,
            summarize_market_input(product, options_text),
            summarize_market_output(market) if market else "未完成",
        ),
        "content": (
            content,
            summarize_content_input(product, market, options_text),
            summarize_content_output(content) if content else "未完成",
        ),
        "seo": (
            seo,
            summarize_seo_input(content, category),
            summarize_seo_output(seo) if seo else "未完成",
        ),
        "social": (
            social,
            summarize_social_input(product, content),
            summarize_social_output(social) if social else "未完成",
        ),
        "merged": (
            merged,
            summarize_merge_input(pending),
            summarize_merge_output(merged) if merged else "未完成",
        ),
    }

    for module_id, raw in steps.items():
        if module_id not in builders:
            continue
        payload, input_summary, output_summary = builders[module_id]
        modules.append(
            build_module_record(
                module_id,
                telemetry=telemetry,
                raw=payload,
                input_summary=input_summary,
                output_summary=output_summary,
            )
        )
    return modules
