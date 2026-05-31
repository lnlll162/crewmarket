"""PDF 专业报告：独立大模型将 summary 改写为可打印文档结构。"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Optional

from agents import pdf_report_agent
from prompts import PROMPT_VERSIONS, ROLE_DEFINITIONS, pdf_report_prompt
from runner import run_json_task
from schemas import validate_pdf_report
from summary_eval import _compute_pipeline_telemetry, _modules_for_prompt


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _resolve_pdf_model() -> str:
    return (
        os.getenv("PDF_REPORT_MODEL")
        or os.getenv("AGENT_MODEL_PDF_REPORT_MODEL")
        or "pdf-report-default"
    )


def build_pdf_report_input(
    *,
    pipeline_id: str,
    description: str,
    summary: dict[str, Any],
    modules: list[dict[str, Any]],
    telemetry: list[dict[str, Any]],
    started_at_iso: str,
    options: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    options = options or {}
    return {
        "reportContext": {
            "pipelineId": pipeline_id,
            "productName": options.get("productName"),
            "category": options.get("category"),
            "description": description.strip()[:800] if description else None,
            "startedAt": started_at_iso,
            "finishedAt": _now_iso(),
        },
        "summary": summary,
        "modules": _modules_for_prompt(modules),
        "pipelineTelemetry": _compute_pipeline_telemetry(telemetry),
        "promptVersion": PROMPT_VERSIONS.get("pdfReport", "v1.0.0"),
    }


def _section(
    section_id: str,
    title: str,
    content: str,
    bullets: Optional[list[str]] = None,
) -> dict[str, Any]:
    return {
        "id": section_id,
        "title": title,
        "content": content,
        "bullets": bullets or [],
    }


def fallback_pdf_report(
    report_input: dict[str, Any],
    *,
    error_message: Optional[str] = None,
) -> dict[str, Any]:
    """LLM 失败时从 summary 程序化生成 PDF 文档结构。"""
    ctx = report_input.get("reportContext") or {}
    summary = report_input.get("summary") or {}
    modules = report_input.get("modules") or []
    pipe = report_input.get("pipelineTelemetry") or {}
    perf = summary.get("performanceReview") or {}

    product_name = ctx.get("productName") or "营销产品"
    pipeline_id = ctx.get("pipelineId") or ""
    success_rate = (
        (pipe.get("successCount") or 0) / len(report_input.get("roleRuns") or [])
        if report_input.get("roleRuns")
        else perf.get("successRate")
    )
    if success_rate is None:
        telemetry_len = len(modules) or 1
        success_rate = 1.0 if telemetry_len else 0.0

    module_bullets = [
        f"{item.get('moduleName', item.get('moduleId'))}：{(item.get('outputSummary') or '')[:100]}"
        for item in modules[:6]
        if item.get("outputSummary")
    ]
    if not module_bullets:
        for item in summary.get("moduleSummary") or []:
            module_bullets.append(f"{item.get('moduleName', item.get('moduleId'))}：{item.get('summary', '')[:100]}")

    role_bullets = [
        f"{item.get('roleName', item.get('roleId'))}（{item.get('score', '—')} 分）：{item.get('evaluation', '')[:80]}"
        for item in (summary.get("roleEvaluation") or [])[:6]
    ]

    risk_bullets = [
        f"[{item.get('severity', 'medium')}] {item.get('title')}：{item.get('detail')}"
        for item in (summary.get("riskAssessment") or [])[:5]
    ]
    opp_bullets = [
        f"{item.get('title')}：{item.get('detail')}"
        for item in (summary.get("opportunityAnalysis") or [])[:4]
    ]
    rec_bullets = [
        f"{item.get('title')}：{item.get('detail')}"
        for item in (summary.get("recommendations") or [])[:6]
    ]

    highlights = list(summary.get("pdfHighlights") or [])
    if not highlights:
        highlights = module_bullets[:3] or ["Pipeline 评估已完成"]

    perf_text = perf.get("summary") or (
        f"总耗时 {pipe.get('totalDurationMs', 0)} ms，Token {pipe.get('totalTokens', 0)}。"
    )
    if error_message:
        perf_text += f" PDF 报告模型调用失败：{error_message}"

    sections = [
        _section(
            "taskOverview",
            "任务概述",
            summary.get("executiveSummary")
            or f"本次 CrewMarket Pipeline（{pipeline_id}）围绕「{product_name}」完成多模块营销内容生成与评估。",
            highlights[:4],
        ),
        _section(
            "moduleOutputs",
            "模块输出摘要",
            f"共完成 {len(modules) or len(summary.get('moduleSummary') or [])} 个业务模块，输出已用于上架、SEO 与社媒适配。",
            module_bullets[:6],
        ),
        _section(
            "rolePerformance",
            "角色表现评估",
            "以下为多智能体角色在本次运行中的表现概览，供模型选型与提示词优化参考。",
            role_bullets[:6],
        ),
        _section(
            "telemetryStats",
            "运行统计",
            perf_text,
            [
                f"总耗时：{pipe.get('totalDurationMs', perf.get('totalDurationMs', '—'))} ms",
                f"总 Token：{pipe.get('totalTokens', perf.get('totalTokens', '—'))}",
                f"成功率：{float(success_rate):.0%}",
            ],
        ),
        _section(
            "assessment",
            "综合评估",
            summary.get("executiveSummary") or "整体输出结构完整，建议人工抽检后进入投放测试。",
        ),
    ]
    if risk_bullets:
        sections.append(
            _section(
                "risks",
                "风险预测",
                "需关注以下风险并在投放前完成确认或缓解。",
                risk_bullets,
            )
        )
    if opp_bullets:
        sections.append(
            _section(
                "opportunities",
                "机会分析",
                "基于当前输出，可考虑以下增长与表达优化方向。",
                opp_bullets,
            )
        )
    sections.append(
        _section(
            "recommendations",
            "优化建议",
            "建议按优先级执行以下行动项，以提升转化与内容一致性。",
            rec_bullets or ["人工复核关键卖点与参数", "对标题与社媒文案做 A/B 测试"],
        )
    )

    return validate_pdf_report(
        {
            "reportTitle": f"CrewMarket · {product_name} 营销 Pipeline 评估报告",
            "subtitle": "多智能体协同运行评估（程序化生成）",
            "generatedAt": ctx.get("finishedAt") or _now_iso(),
            "pipelineId": pipeline_id,
            "promptVersion": report_input.get("promptVersion", "v1.0.0"),
            "confidence": summary.get("confidence", 0.65),
            "coverHighlights": highlights[:6],
            "sections": sections,
            "telemetrySnapshot": {
                "totalDurationMs": pipe.get("totalDurationMs") or perf.get("totalDurationMs"),
                "totalTokens": pipe.get("totalTokens") or perf.get("totalTokens"),
                "successRate": float(success_rate) if success_rate is not None else None,
                "summaryText": perf_text[:200],
            },
            "disclaimer": "本报告由 AI 自动生成（fallback），仅供内部评审参考，投放前请人工复核。",
        }
    )


def run_pdf_report(
    *,
    pipeline_id: str,
    description: str,
    summary: dict[str, Any],
    modules: list[dict[str, Any]],
    telemetry: list[dict[str, Any]],
    started_at_iso: str,
    options: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    report_input = build_pdf_report_input(
        pipeline_id=pipeline_id,
        description=description,
        summary=summary,
        modules=modules,
        telemetry=telemetry,
        started_at_iso=started_at_iso,
        options=options,
    )
    report_input["roleRuns"] = telemetry

    try:
        result = run_json_task(
            pdf_report_agent(),
            pdf_report_prompt(report_input),
            "合法 JSON 对象，字段名必须与 schema 完全一致",
            validate_pdf_report,
            max_retries=2,
            timeout_seconds=600,
            telemetry=telemetry,
            role_id="pdfReport",
            role_name=ROLE_DEFINITIONS["pdfReport"]["roleName"],
            module_id="pdfReport",
            model=_resolve_pdf_model(),
        )
        data = result["data"]
        data.setdefault("promptVersion", PROMPT_VERSIONS.get("pdfReport", "v1.0.0"))
        data.setdefault("pipelineId", pipeline_id)
        data.setdefault("generatedAt", _now_iso())
        return data
    except Exception as exc:
        return fallback_pdf_report(report_input, error_message=str(exc))
