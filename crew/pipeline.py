"""营销 Pipeline 编排：产品理解 → 市场与品牌策略 → 营销内容 → 营销物料 → 汇总。"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Optional

from agents import (
    content_writer_agent,
    market_research_agent,
    seo_optimizer_agent,
    social_media_agent,
)
from config import SILICONFLOW_IMAGE_MODEL, SILICONFLOW_VIDEO_MODEL
from generation import generate_image
from prompts import (
    content_write_prompt,
    market_research_prompt,
    seo_optimize_prompt,
    social_adapt_prompt,
)
from module_records import (
    build_full_pipeline_modules,
    build_module_record,
    build_partial_modules_from_steps,
    summarize_content_input,
    summarize_content_output,
    summarize_market_input,
    summarize_market_output,
    summarize_merge_input,
    summarize_merge_output,
    summarize_product_input,
    summarize_product_output,
    summarize_seo_input,
    summarize_seo_output,
    summarize_social_input,
    summarize_social_output,
)
from summary_eval import build_summary_input, fallback_pipeline_summary, run_pipeline_summary
from pdf_report import run_pdf_report
from runner import run_json_task
from schemas import (
    validate_content,
    validate_market,
    validate_seo,
    validate_social,
)
from vision import extract_product

IMAGE_MODEL = SILICONFLOW_IMAGE_MODEL
VIDEO_MODEL = SILICONFLOW_VIDEO_MODEL


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _duration_ms(started_at: float) -> int:
    return max(0, int((perf_counter() - started_at) * 1000))


def _options_text(options: Optional[dict[str, Any]]) -> str:
    if not options:
        return "无"
    return json.dumps(options, ensure_ascii=False)


def _empty_telemetry() -> dict[str, Any]:
    return {
        "totalDurationMs": 0,
        "totalInputTokens": 0,
        "totalOutputTokens": 0,
        "totalTokens": 0,
        "successCount": 0,
        "failureCount": 0,
        "retryCount": 0,
    }


def _sum_usage(records: list[dict[str, Any]]) -> dict[str, int]:
    input_tokens = sum(int(r.get("inputTokens") or 0) for r in records)
    output_tokens = sum(int(r.get("outputTokens") or 0) for r in records)
    total_tokens = sum(int(r.get("totalTokens") or 0) for r in records)
    return {
        "totalInputTokens": input_tokens,
        "totalOutputTokens": output_tokens,
        "totalTokens": total_tokens,
    }


def _record_telemetry(
    telemetry: list[dict[str, Any]],
    *,
    model: str,
    role_id: str,
    role_name: str,
    module_id: str,
    started_at: str,
    finished_at: str,
    duration_ms: int,
    status: str,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    total_tokens: int | None = None,
    error_message: str | None = None,
    retry_count: int | None = None,
    provider: str = "siliconflow",
) -> dict[str, Any]:
    record = {
        "model": model,
        "provider": provider,
        "roleId": role_id,
        "roleName": role_name,
        "moduleId": module_id,
        "startedAt": started_at,
        "finishedAt": finished_at,
        "durationMs": duration_ms,
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": total_tokens,
        "status": status,
        "errorMessage": error_message,
        "retryCount": retry_count,
    }
    telemetry.append(record)
    return record


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


def _build_generation_payload(content: dict[str, Any], product: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    image_ideas = content.get("imageIdeas") or []
    video_material = content.get("videoMaterial") or {"hook": "", "scenes": [], "voiceover": "", "caption": ""}
    poster_copy = content.get("posterCopy") or {}
    image_prompt = "\n".join([
        f"产品：{product.get('summary', '')}",
        f"标题：{content.get('title', '')}",
        f"海报：{poster_copy.get('headline', '')} / {poster_copy.get('subheadline', '')}",
        f"创意：{json.dumps(image_ideas, ensure_ascii=False)}",
    ]).strip()
    video_prompt = "\n".join([
        f"产品：{product.get('summary', '')}",
        f"脚本：{content.get('videoScript', '')}",
        f"素材：{json.dumps(video_material, ensure_ascii=False)}",
    ]).strip()
    try:
        image_generation = generate_image(image_prompt, model=IMAGE_MODEL)
    except Exception as exc:
        image_generation = {
            "status": "failed",
            "prompt": image_prompt,
            "provider": "siliconflow",
            "model": IMAGE_MODEL,
            "error": str(exc),
        }
    return image_generation, {
        "status": "disabled",
        "prompt": video_prompt,
        "provider": "siliconflow",
        "model": VIDEO_MODEL,
        "message": "视频能力已从主流程移除，作为独立模块保留",
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


def _partial_summary(
    *,
    modules: list[dict[str, Any]],
    telemetry: list[dict[str, Any]],
    description: str = "",
    pending: Optional[list[str]] = None,
    pipeline_id: Optional[str] = None,
) -> dict[str, Any]:
    summary_input = build_summary_input(
        pipeline_id=pipeline_id or f"pl_{uuid.uuid4().hex[:12]}",
        description=description,
        modules=modules,
        telemetry=telemetry,
        started_at_iso=_now_iso(),
        pending=pending,
    )
    return fallback_pipeline_summary(summary_input, pending=pending)


def _failed_summary(
    *,
    modules: list[dict[str, Any]],
    telemetry: list[dict[str, Any]],
    pending: list[str],
    error_message: str,
    description: str = "",
    pipeline_id: Optional[str] = None,
    started_at_iso: Optional[str] = None,
) -> dict[str, Any]:
    summary_input = build_summary_input(
        pipeline_id=pipeline_id or f"pl_{uuid.uuid4().hex[:12]}",
        description=description,
        modules=modules,
        telemetry=telemetry,
        started_at_iso=started_at_iso or _now_iso(),
        pending=pending,
    )
    summary = fallback_pipeline_summary(summary_input, pending=pending, error_message=error_message)
    summary["executiveSummary"] = f"Pipeline 执行失败：{error_message}。{summary.get('executiveSummary', '')}"
    summary["riskAssessment"] = [
        {"title": "Pipeline 执行失败", "detail": error_message, "severity": "high"},
        *summary.get("riskAssessment", []),
    ]
    summary["confidence"] = min(summary.get("confidence", 0.5), 0.35)
    return summary


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
    consistency_notes = _programmatic_consistency_notes(product, content, seo)
    return {
        "package": package,
        "consistencyNotes": consistency_notes,
        "pendingConfirmations": list(pending),
    }


def _finalize_result(
    *,
    status: str,
    data: Any,
    telemetry: list[dict[str, Any]],
    modules: list[dict[str, Any]],
    summary: dict[str, Any],
    generated_at: str,
    pdf_report: dict[str, Any] | None = None,
    error: dict[str, Any] | None = None,
) -> dict[str, Any]:
    usage = _sum_usage(telemetry)
    summary.setdefault("performanceReview", {})
    perf = summary["performanceReview"]
    llm_perf_summary = perf.get("summary") or ""
    perf.update(usage)
    if llm_perf_summary:
        perf["summary"] = llm_perf_summary
    durations = [int(item.get("durationMs") or 0) for item in telemetry if item.get("durationMs")]
    if durations:
        perf["totalDurationMs"] = sum(durations)
        perf["avgDurationMs"] = int(sum(durations) / len(durations))
    perf.setdefault("summary", "")
    perf["successRate"] = (
        len([t for t in telemetry if t.get("status") == "success"]) / len(telemetry)
        if telemetry
        else 0
    )
    return {
        "status": status,
        "data": data,
        "telemetry": telemetry,
        "modules": modules,
        "summary": summary,
        "pdfReport": pdf_report,
        "generatedAt": generated_at,
        **({"error": error} if error else {}),
    }


def run_full_pipeline(payload: dict[str, Any]) -> dict[str, Any]:
    """按精简版营销链路串行执行：产品理解 → 市场与品牌策略 → 营销内容 → 营销物料 → 汇总。"""
    pipeline_id = f"pl_{uuid.uuid4().hex[:12]}"
    description = payload.get("description", "")
    image_url = payload.get("imageUrl")
    image_base64 = payload.get("imageBase64")
    options = payload.get("options") or {}
    options_text = _options_text(options)
    telemetry: list[dict[str, Any]] = []
    steps: dict[str, Any] = {}
    pending: list[str] = []
    started_at = perf_counter()
    started_at_iso = _now_iso()
    try:
        product = extract_product(description, image_url, image_base64, telemetry=telemetry)
        steps["productExtract"] = product
        pending.extend(_collect_product_pending(product))

        market_result = run_json_task(
            market_research_agent(),
            market_research_prompt(product, options_text),
            "合法 JSON 对象，字段名必须完全一致",
            validate_market,
            telemetry=telemetry,
            role_id="marketResearch",
            role_name="市场分析角色",
            module_id="marketResearch",
            model=os.getenv("MARKET_MODEL", "general-default"),
        )
        market_research = market_result["data"]
        steps["marketResearch"] = market_research

        content_result = run_json_task(
            content_writer_agent(),
            content_write_prompt(product, market_research, options_text),
            "合法 JSON 对象",
            validate_content,
            telemetry=telemetry,
            role_id="content",
            role_name="文案生成角色",
            module_id="content",
            model=os.getenv("CONTENT_MODEL", "creative-default"),
        )
        content = content_result["data"]
        image_generation, video_generation = _build_generation_payload(content, product)
        content["imageGeneration"] = image_generation
        content["videoGeneration"] = video_generation
        steps["content"] = content

        category = product.get("category", {}).get("value", "")
        seo_result = run_json_task(
            seo_optimizer_agent(),
            seo_optimize_prompt(content, category),
            "合法 JSON 对象",
            validate_seo,
            telemetry=telemetry,
            role_id="seo",
            role_name="SEO 优化角色",
            module_id="seo",
            model=os.getenv("SEO_MODEL", "search-default"),
        )
        seo = seo_result["data"]
        steps["seo"] = seo

        social_result = run_json_task(
            social_media_agent(),
            social_adapt_prompt(product, content),
            "合法 JSON 对象",
            validate_social,
            telemetry=telemetry,
            role_id="social",
            role_name="社媒改写角色",
            module_id="social",
            model=os.getenv("SOCIAL_MODEL", "social-default"),
        )
        social = social_result["data"]
        steps["social"] = social

        merged = _run_merge_step(
            product,
            market_research,
            content,
            seo,
            social,
            pending,
        )
        pending = merged["pendingConfirmations"]

        modules = build_full_pipeline_modules(
            telemetry=telemetry,
            product=product,
            market_research=market_research,
            content=content,
            seo=seo,
            social=social,
            merged=merged,
            description=description,
            image_url=image_url,
            image_base64=image_base64,
            options=options,
            options_text=options_text,
            category=category,
            pending=pending,
        )
        summary = run_pipeline_summary(
            pipeline_id=pipeline_id,
            description=description,
            modules=modules,
            telemetry=telemetry,
            started_at_iso=started_at_iso,
            pending=pending,
            image_url=image_url,
            image_base64=image_base64,
            options=options,
        )
        pending = list(dict.fromkeys([*pending, *summary.get("missingInfo", [])]))
        merged["pendingConfirmations"] = pending
        steps["merged"] = merged
        pdf_report = run_pdf_report(
            pipeline_id=pipeline_id,
            description=description,
            summary=summary,
            modules=modules,
            telemetry=telemetry,
            started_at_iso=started_at_iso,
            options=options,
        )
        return _finalize_result(
            status="completed",
            data={
                "pipelineId": pipeline_id,
                "steps": steps,
                "result": merged,
                "pendingConfirmations": pending,
                "generatedAt": _now_iso(),
            },
            telemetry=telemetry,
            modules=modules,
            summary=summary,
            pdf_report=pdf_report,
            generated_at=started_at_iso,
        )
    except Exception as e:
        modules = build_partial_modules_from_steps(
            steps,
            telemetry,
            description=description,
            image_url=image_url,
            image_base64=image_base64,
            options=options,
            options_text=options_text,
            pending=pending,
        )
        summary = _failed_summary(
            modules=modules,
            telemetry=telemetry,
            pending=pending,
            error_message=str(e),
            description=description,
            pipeline_id=pipeline_id,
            started_at_iso=started_at_iso,
        )
        pdf_report = run_pdf_report(
            pipeline_id=pipeline_id,
            description=description,
            summary=summary,
            modules=modules,
            telemetry=telemetry,
            started_at_iso=started_at_iso,
            options=options,
        )
        return _finalize_result(
            status="failed",
            data=None,
            telemetry=telemetry,
            modules=modules,
            summary=summary,
            pdf_report=pdf_report,
            generated_at=started_at_iso,
            error={"step": _infer_failed_step(steps), "message": str(e)},
        )


def run_analyze_only(payload: dict[str, Any]) -> dict[str, Any]:
    description = payload.get("description", "")
    options_text = _options_text(payload.get("options"))
    telemetry: list[dict[str, Any]] = []
    product = extract_product(
        description,
        payload.get("imageUrl"),
        payload.get("imageBase64"),
        telemetry=telemetry,
    )
    pending = _collect_product_pending(product)
    market_result = run_json_task(
        market_research_agent(),
        market_research_prompt(product, options_text),
        "合法 JSON 对象",
        validate_market,
        telemetry=telemetry,
        role_id="marketResearch",
        role_name="市场分析角色",
        module_id="marketResearch",
        model=os.getenv("MARKET_MODEL", "general-default"),
    )
    market_research = market_result["data"]
    modules = [
        build_module_record(
            "productExtract",
            telemetry=telemetry,
            raw=product,
            input_summary=summarize_product_input(
                description,
                image_url=payload.get("imageUrl"),
                image_base64=payload.get("imageBase64"),
                options=payload.get("options"),
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
    ]
    return _finalize_result(
        status="completed",
        data={"product": product, "market": market_research},
        telemetry=telemetry,
        modules=modules,
        summary=_partial_summary(
            modules=modules,
            telemetry=telemetry,
            description=description,
            pending=pending,
        ),
        generated_at=_now_iso(),
    )


def run_content_only(payload: dict[str, Any]) -> dict[str, Any]:
    telemetry: list[dict[str, Any]] = []
    product = payload.get("product") or {}
    market = payload.get("market") or {}
    options_text = _options_text(payload.get("options"))
    content_result = run_json_task(
        content_writer_agent(),
        content_write_prompt(product, market, options_text),
        "合法 JSON 对象",
        validate_content,
        telemetry=telemetry,
        role_id="content",
        role_name="文案生成角色",
        module_id="content",
        model=os.getenv("CONTENT_MODEL", "creative-default"),
    )
    content = content_result["data"]
    image_generation, video_generation = _build_generation_payload(content, product)
    content["imageGeneration"] = image_generation
    content["videoGeneration"] = video_generation
    modules = [
        build_module_record(
            "content",
            telemetry=telemetry,
            raw=content,
            input_summary=summarize_content_input(product, market, options_text),
            output_summary=summarize_content_output(content),
        )
    ]
    return _finalize_result(
        status="completed",
        data=content,
        telemetry=telemetry,
        modules=modules,
        summary=_partial_summary(modules=modules, telemetry=telemetry),
        generated_at=_now_iso(),
    )


def run_seo_only(payload: dict[str, Any]) -> dict[str, Any]:
    telemetry: list[dict[str, Any]] = []
    content = payload.get("content") or payload
    category = payload.get("category", "")
    result = run_json_task(
        seo_optimizer_agent(),
        seo_optimize_prompt(content, category),
        "合法 JSON 对象",
        validate_seo,
        telemetry=telemetry,
        role_id="seo",
        role_name="SEO 优化角色",
        module_id="seo",
        model=os.getenv("SEO_MODEL", "search-default"),
    )
    seo = result["data"]
    modules = [
        build_module_record(
            "seo",
            telemetry=telemetry,
            raw=seo,
            input_summary=summarize_seo_input(content, category),
            output_summary=summarize_seo_output(seo),
        )
    ]
    return _finalize_result(
        status="completed",
        data=seo,
        telemetry=telemetry,
        modules=modules,
        summary=_partial_summary(modules=modules, telemetry=telemetry),
        generated_at=_now_iso(),
    )


def run_social_only(payload: dict[str, Any]) -> dict[str, Any]:
    telemetry: list[dict[str, Any]] = []
    product = payload.get("product") or {"sellingPoints": payload.get("sellingPoints", {})}
    content = payload.get("content") or payload
    result = run_json_task(
        social_media_agent(),
        social_adapt_prompt(product, content),
        "合法 JSON 对象",
        validate_social,
        telemetry=telemetry,
        role_id="social",
        role_name="社媒改写角色",
        module_id="social",
        model=os.getenv("SOCIAL_MODEL", "social-default"),
    )
    social = result["data"]
    modules = [
        build_module_record(
            "social",
            telemetry=telemetry,
            raw=social,
            input_summary=summarize_social_input(product, content),
            output_summary=summarize_social_output(social),
        )
    ]
    return _finalize_result(
        status="completed",
        data=social,
        telemetry=telemetry,
        modules=modules,
        summary=_partial_summary(modules=modules, telemetry=telemetry),
        generated_at=_now_iso(),
    )


def run_merge_only(payload: dict[str, Any]) -> dict[str, Any]:
    started_at_iso = _now_iso()
    pipeline_id = f"pl_{uuid.uuid4().hex[:12]}"
    telemetry: list[dict[str, Any]] = []
    product = payload["product"]
    market = payload["market"]
    content = payload["content"]
    seo = payload["seo"]
    social = payload["social"]
    description = payload.get("description") or product.get("summary", "")
    options = payload.get("options") or {}
    options_text = _options_text(options)
    category = product.get("category", {}).get("value", "")
    pending = _collect_product_pending(product)
    merged = _run_merge_step(product, market, content, seo, social, pending)
    pending = merged["pendingConfirmations"]
    modules = build_full_pipeline_modules(
        telemetry=telemetry,
        product=product,
        market_research=market,
        content=content,
        seo=seo,
        social=social,
        merged=merged,
        description=description,
        image_url=payload.get("imageUrl"),
        image_base64=payload.get("imageBase64"),
        options=options,
        options_text=options_text,
        category=category,
        pending=pending,
    )
    summary = run_pipeline_summary(
        pipeline_id=pipeline_id,
        description=description,
        modules=modules,
        telemetry=telemetry,
        started_at_iso=started_at_iso,
        pending=pending,
        image_url=payload.get("imageUrl"),
        image_base64=payload.get("imageBase64"),
        options=options,
    )
    pending = list(dict.fromkeys([*pending, *summary.get("missingInfo", [])]))
    merged["pendingConfirmations"] = pending
    pdf_report = run_pdf_report(
        pipeline_id=pipeline_id,
        description=description,
        summary=summary,
        modules=modules,
        telemetry=telemetry,
        started_at_iso=started_at_iso,
        options=options,
    )
    return _finalize_result(
        status="completed",
        data=merged,
        telemetry=telemetry,
        modules=modules,
        summary=summary,
        pdf_report=pdf_report,
        generated_at=started_at_iso,
    )


def _infer_failed_step(steps: dict[str, Any]) -> str:
    order = ["productExtract", "marketResearch", "content", "seo", "social", "merged"]
    done = set(steps.keys())
    for step in order:
        if step not in done:
            return step
    return "merged"
