"""营销 Pipeline 编排：产品理解 → 市场与品牌策略 → 营销内容 → 营销物料 → 汇总。"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from agents import (
    content_writer_agent,
    market_research_agent,
    merge_coordinator_agent,
    seo_optimizer_agent,
    social_media_agent,
)
from prompts import (
    content_write_prompt,
    market_research_prompt,
    merge_review_prompt,
    seo_optimize_prompt,
    social_adapt_prompt,
)
from runner import run_json_task
from schemas import (
    validate_content,
    validate_market,
    validate_merge_review,
    validate_seo,
    validate_social,
)
from vision import extract_product


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _options_text(options: Optional[dict[str, Any]]) -> str:
    if not options:
        return "无"
    return json.dumps(options, ensure_ascii=False)


def _collect_product_pending(product: dict[str, Any]) -> list[str]:
    pending: list[str] = []
    for field in ("productName", "category", "attributes", "sellingPoints"):
        item = product.get(field, {})
        if isinstance(item, dict) and item.get("status") == "pending":
            note = item.get("note", "")
            label = f"产品字段 {field} 待确认"
            pending.append(f"{label}：{note}" if note else label)
    return pending


def _build_package(
    product: dict[str, Any],
    market_research: dict[str, Any],
    content: dict[str, Any],
    seo: dict[str, Any],
    social: dict[str, Any],
) -> dict[str, Any]:
    return {
        "product": product,
        "market": market_research,
        "content": content,
        "seo": seo,
        "social": social,
        "mergedAt": _now_iso(),
    }


def _programmatic_consistency_notes(
    product: dict[str, Any],
    content: dict[str, Any],
    seo: dict[str, Any],
) -> list[str]:
    notes: list[str] = []
    product_name = product.get("productName", {}).get("value", "")
    if product_name and product_name not in content.get("title", ""):
        notes.append(f"标题未直接包含产品名「{product_name}」，请人工确认是否合适")

    title = content.get("title", "")
    detail = content.get("detailPageContent", "")
    if title and detail and title in detail:
        notes.append("详情页与标题重复较多，建议补充场景或用户收益表达")

    seo_text = " ".join(str(v) for v in seo.values() if isinstance(v, str))
    if title and seo_text and title in seo_text:
        notes.append("SEO 与主标题重复较多，建议做平台差异化表达")

    if not notes:
        notes.append("各模块字段完整，已通过程序化一致性检查")
    return notes


def _run_merge_step(
    product: dict[str, Any],
    market_research: dict[str, Any],
    content: dict[str, Any],
    seo: dict[str, Any],
    social: dict[str, Any],
    pending: list[str],
) -> dict[str, Any]:
    package = _build_package(
        product,
        market_research,
        content,
        seo,
        social,
    )

    try:
        review = run_json_task(
            merge_coordinator_agent(),
            merge_review_prompt(
                product,
                market_research,
                content,
                seo,
                social,
                pending,
            ),
            "合法 JSON 对象，仅含 consistencyNotes 与 pendingConfirmations",
            validate_merge_review,
            max_retries=2,
        )
        consistency_notes = review["consistencyNotes"]
        extra_pending = review["pendingConfirmations"]
    except Exception:
        consistency_notes = _programmatic_consistency_notes(product, content, seo)
        extra_pending = []

    merged_pending = list(dict.fromkeys([*pending, *extra_pending]))
    return {
        "package": package,
        "consistencyNotes": consistency_notes,
        "pendingConfirmations": merged_pending,
    }


def run_full_pipeline(payload: dict[str, Any]) -> dict[str, Any]:
    """按精简版营销链路串行执行：产品理解 → 市场与品牌策略 → 营销内容 → 营销物料 → 汇总。"""
    pipeline_id = f"pl_{uuid.uuid4().hex[:12]}"
    description = payload.get("description", "")
    image_url = payload.get("imageUrl")
    image_base64 = payload.get("imageBase64")
    options = payload.get("options") or {}
    options_text = _options_text(options)

    steps: dict[str, Any] = {}
    pending: list[str] = []

    try:
        product = extract_product(description, image_url, image_base64)
        steps["productExtract"] = product
        pending.extend(_collect_product_pending(product))

        market_research = run_json_task(
            market_research_agent(),
            market_research_prompt(product, options_text),
            "合法 JSON 对象，字段名必须完全一致",
            validate_market,
        )
        steps["marketResearch"] = market_research

        content = run_json_task(
            content_writer_agent(),
            content_write_prompt(product, market_research, options_text),
            "合法 JSON 对象",
            validate_content,
        )
        steps["content"] = content

        category = product.get("category", {}).get("value", "")
        seo = run_json_task(
            seo_optimizer_agent(),
            seo_optimize_prompt(content, category),
            "合法 JSON 对象",
            validate_seo,
        )
        steps["seo"] = seo

        social = run_json_task(
            social_media_agent(),
            social_adapt_prompt(product, content),
            "合法 JSON 对象",
            validate_social,
        )
        steps["social"] = social

        merged = _run_merge_step(
            product,
            market_research,
            content,
            seo,
            social,
            pending,
        )
        steps["merged"] = merged
        pending = merged["pendingConfirmations"]

        return {
            "pipelineId": pipeline_id,
            "status": "completed",
            "steps": steps,
            "result": merged,
            "pendingConfirmations": pending,
            "generatedAt": _now_iso(),
        }
    except Exception as e:
        return {
            "pipelineId": pipeline_id,
            "status": "failed",
            "steps": steps,
            "pendingConfirmations": pending,
            "generatedAt": _now_iso(),
            "error": {"step": _infer_failed_step(steps), "message": str(e)},
        }


def run_analyze_only(payload: dict[str, Any]) -> dict[str, Any]:
    description = payload.get("description", "")
    options_text = _options_text(payload.get("options"))
    product = extract_product(
        description,
        payload.get("imageUrl"),
        payload.get("imageBase64"),
    )
    market_research = run_json_task(
        market_research_agent(),
        market_research_prompt(product, options_text),
        "合法 JSON 对象",
        validate_market,
    )
    return {"product": product, "market": market_research}


def run_content_only(payload: dict[str, Any]) -> dict[str, Any]:
    product = payload.get("product") or {}
    market = payload.get("market") or {}
    options_text = _options_text(payload.get("options"))
    return run_json_task(
        content_writer_agent(),
        content_write_prompt(product, market, options_text),
        "合法 JSON 对象",
        validate_content,
    )


def run_seo_only(payload: dict[str, Any]) -> dict[str, Any]:
    content = payload.get("content") or payload
    category = payload.get("category", "")
    return run_json_task(
        seo_optimizer_agent(),
        seo_optimize_prompt(content, category),
        "合法 JSON 对象",
        validate_seo,
    )


def run_social_only(payload: dict[str, Any]) -> dict[str, Any]:
    product = payload.get("product") or {"sellingPoints": payload.get("sellingPoints", {})}
    content = payload.get("content") or payload
    return run_json_task(
        social_media_agent(),
        social_adapt_prompt(product, content),
        "合法 JSON 对象",
        validate_social,
    )


def run_merge_only(payload: dict[str, Any]) -> dict[str, Any]:
    product = payload["product"]
    market = payload["market"]
    content = payload["content"]
    seo = payload["seo"]
    social = payload["social"]
    pending = _collect_product_pending(product)
    return _run_merge_step(product, market, content, seo, social, pending)


def _infer_failed_step(steps: dict[str, Any]) -> str:
    order = ["productExtract", "marketResearch", "content", "seo", "social", "merged"]
    done = set(steps.keys())
    for step in order:
        if step not in done:
            return step
    return "merged"
