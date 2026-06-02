"""PipelineSummaryInput 构建与汇总评估 LLM 调用。"""

from __future__ import annotations

from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Optional

from agents import merge_coordinator_agent
from prompts import pipeline_summary_prompt
from runner import run_json_task
from schemas import validate_pipeline_summary

SUMMARY_CONSTRAINTS = {
    "allowInference": False,
    "reportTone": "professional",
    "includeRiskForecast": True,
    "includeOpportunityAnalysis": True,
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _modules_for_prompt(modules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{key: value for key, value in item.items() if key != "raw"} for item in modules]


def _compute_pipeline_telemetry(telemetry: list[dict[str, Any]]) -> dict[str, Any]:
    durations = [int(item.get("durationMs") or 0) for item in telemetry]
    success = [item for item in telemetry if item.get("status") == "success"]
    failed = [item for item in telemetry if item.get("status") in {"failed", "timeout"}]
    retries = sum(int(item.get("retryCount") or 0) for item in telemetry)
    return {
        "totalDurationMs": sum(durations),
        "totalInputTokens": sum(int(item.get("inputTokens") or 0) for item in telemetry),
        "totalOutputTokens": sum(int(item.get("outputTokens") or 0) for item in telemetry),
        "totalTokens": sum(int(item.get("totalTokens") or 0) for item in telemetry),
        "successCount": len(success),
        "failureCount": len(failed),
        "retryCount": retries,
    }


def build_summary_input(
    *,
    pipeline_id: str,
    description: str,
    modules: list[dict[str, Any]],
    telemetry: list[dict[str, Any]],
    started_at_iso: str,
    finished_at_iso: Optional[str] = None,
    image_url: Optional[str] = None,
    image_base64: Optional[str] = None,
    options: Optional[dict[str, Any]] = None,
    pending: Optional[list[str]] = None,
) -> dict[str, Any]:
    options = options or {}
    assets: list[dict[str, Any]] = []
    if description.strip():
        assets.append({"id": "text-main", "type": "text", "content": description.strip()[:800]})
    if image_url:
        assets.append({"id": "image-url", "type": "image", "url": image_url})
    elif image_base64:
        preview = image_base64[:96] + "…" if len(image_base64) > 96 else image_base64
        assets.append({"id": "image-base64", "type": "image", "base64": preview})

    return {
        "taskInfo": {
            "requestId": pipeline_id,
            "taskName": "CrewMarket 营销 Pipeline",
            "objective": "基于产品与多模块输出，生成可导出的专业评估报告",
            "startedAt": started_at_iso,
            "finishedAt": finished_at_iso or _now_iso(),
        },
        "userInput": {
            "description": description.strip()[:800] if description else None,
            "productName": options.get("productName"),
            "category": options.get("category"),
            "assets": assets,
        },
        "moduleResults": _modules_for_prompt(modules),
        "roleRuns": telemetry,
        "pipelineTelemetry": _compute_pipeline_telemetry(telemetry),
        "constraints": dict(SUMMARY_CONSTRAINTS),
        "_pendingHint": pending or [],
    }


def fallback_pipeline_summary(
    summary_input: dict[str, Any],
    *,
    pending: Optional[list[str]] = None,
    error_message: Optional[str] = None,
) -> dict[str, Any]:
    """LLM 失败时的程序化兜底报告。"""
    modules = summary_input.get("moduleResults") or []
    telemetry = summary_input.get("roleRuns") or []
    pipe = summary_input.get("pipelineTelemetry") or {}
    pending_items = list(dict.fromkeys([*(pending or []), *(summary_input.get("_pendingHint") or [])]))

    module_summary = []
    for item in modules:
        module_summary.append(
            {
                "moduleId": item.get("moduleId"),
                "moduleName": item.get("moduleName"),
                "title": item.get("moduleName") or item.get("moduleId"),
                "summary": item.get("outputSummary") or "",
                "status": item.get("status"),
            }
        )

    role_evaluation = []
    for run in telemetry:
        role_evaluation.append(
            {
                "roleId": run.get("roleId"),
                "roleName": run.get("roleName"),
                "evaluation": f"状态 {run.get('status')}，耗时 {run.get('durationMs', '—')} ms，"
                f"Token {run.get('totalTokens', '—')}。",
                "score": 7 if run.get("status") == "success" else 4,
            }
        )
    if not role_evaluation:
        role_evaluation.append(
            {
                "roleId": "pipeline",
                "roleName": "Pipeline 执行引擎",
                "evaluation": f"Pipeline 未成功执行任何步骤{f'：{error_message}' if error_message else ''}",
                "score": 1,
            }
        )

    success_rate = (
        (pipe.get("successCount") or 0) / len(telemetry) if telemetry else 0.0
    )
    perf_summary = (
        f"共 {len(telemetry)} 次模型调用，成功率 {success_rate:.0%}，"
        f"总 Token {pipe.get('totalTokens', 0)}，总耗时 {pipe.get('totalDurationMs', 0)} ms。"
    )
    if error_message:
        perf_summary += f" 汇总模型调用失败：{error_message}"

    risks = []
    if pending_items:
        risks.append(
            {
                "title": "待确认信息未补齐",
                "detail": "；".join(pending_items[:3]),
                "severity": "medium",
            }
        )
    if (pipe.get("failureCount") or 0) > 0:
        risks.append(
            {
                "title": "部分模块调用失败",
                "detail": f"失败 {pipe.get('failureCount')} 次，需排查模型或输入。",
                "severity": "high",
            }
        )
    if not risks:
        risks.append(
            {
                "title": "整体风险可控",
                "detail": "未发现阻断性失败，建议人工抽检文案真实性。",
                "severity": "low",
            }
        )

    opportunities = [
        {
            "title": "强化高转化卖点表达",
            "detail": "可在详情页与社媒文案中进一步突出已确认卖点。",
        }
    ]

    recommendations = [
        {
            "title": "补齐待确认字段",
            "detail": "优先确认产品参数与图片可见信息，再二次生成。",
        }
        if pending_items
        else {
            "title": "进入 A/B 测试",
            "detail": "对标题与社媒短文案做小规模投放测试。",
        },
        {
            "title": "检查模块口径一致性",
            "detail": "对比 SEO 标题、主文案与社媒版本，避免重复堆砌。",
        },
    ]

    highlights = [item.get("outputSummary", "")[:80] for item in modules[:4] if item.get("outputSummary")]
    if not highlights:
        highlights = ["Pipeline 已完成，可导出模块结果做人工评审。"]

    executive = (
        f"本次 CrewMarket Pipeline（{summary_input.get('taskInfo', {}).get('requestId', '')}）"
        f"已完成 {len(modules)} 个模块。"
        f"{perf_summary}"
    )
    if pending_items:
        executive += f" 当前有 {len(pending_items)} 项待确认，建议在投放前补齐。"

    return validate_pipeline_summary(
        {
            "executiveSummary": executive,
            "moduleSummary": module_summary,
            "roleEvaluation": role_evaluation,
            "performanceReview": {"summary": perf_summary},
            "riskAssessment": risks,
            "opportunityAnalysis": opportunities,
            "recommendations": recommendations,
            "pdfHighlights": highlights[:6],
            "confidence": 0.55 if error_message else 0.72,
            "missingInfo": pending_items,
        }
    )


def run_pipeline_summary(
    *,
    pipeline_id: str,
    description: str,
    modules: list[dict[str, Any]],
    telemetry: list[dict[str, Any]],
    started_at_iso: str,
    pending: Optional[list[str]] = None,
    image_url: Optional[str] = None,
    image_base64: Optional[str] = None,
    options: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    summary_input = build_summary_input(
        pipeline_id=pipeline_id,
        description=description,
        modules=modules,
        telemetry=telemetry,
        started_at_iso=started_at_iso,
        image_url=image_url,
        image_base64=image_base64,
        options=options,
        pending=pending,
    )
    prompt_payload = dict(summary_input)
    prompt_payload.pop("_pendingHint", None)

    try:
        result = run_json_task(
            merge_coordinator_agent(),
            pipeline_summary_prompt(prompt_payload),
            "合法 JSON 对象，字段名必须与 schema 完全一致",
            validate_pipeline_summary,
            max_retries=2,
            timeout_seconds=600,
            telemetry=telemetry,
            role_id="merged",
            role_name="汇总评估角色",
            module_id="merged",
            model=__import__("os").getenv("MERGE_MODEL", "reporting-default"),
        )
        data = result["data"]
        if pending:
            data["missingInfo"] = list(dict.fromkeys([*pending, *(data.get("missingInfo") or [])]))
        return data
    except Exception as exc:
        return fallback_pipeline_summary(summary_input, pending=pending, error_message=str(exc))
