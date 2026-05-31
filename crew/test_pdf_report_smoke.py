"""PdfReport 校验与 fallback smoke test。"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from pdf_report import build_pdf_report_input, fallback_pdf_report
from schemas import validate_pdf_report
from test_module_records_smoke import _fixture_telemetry


def _fixture_summary() -> dict:
    from summary_eval import build_summary_input, fallback_pipeline_summary

    modules = [
        {
            "moduleId": "content",
            "moduleName": "文案生成",
            "outputSummary": "已生成标题与详情页文案。",
            "status": "completed",
        }
    ]
    summary_input = build_summary_input(
        pipeline_id="pl_pdf_test",
        description="测试保温杯",
        modules=modules,
        telemetry=_fixture_telemetry()[:2],
        started_at_iso="2026-05-30T00:00:00Z",
    )
    return fallback_pipeline_summary(summary_input, pending=["容量待确认"])


def test_validate_pdf_report() -> None:
    data = validate_pdf_report(
        {
            "reportTitle": "CrewMarket · 测试产品 评估报告",
            "subtitle": "运行评估",
            "generatedAt": "2026-05-30T12:00:00Z",
            "pipelineId": "pl_test",
            "coverHighlights": ["模块完整", "Token 可控", "建议可执行"],
            "sections": [
                {
                    "id": "taskOverview",
                    "title": "任务概述",
                    "content": "本次 Pipeline 围绕测试产品完成多模块生成。",
                    "bullets": ["输入清晰"],
                },
                {
                    "id": "moduleOutputs",
                    "title": "模块输出",
                    "content": "各模块均已输出结构化结果。",
                    "bullets": [],
                },
                {
                    "id": "assessment",
                    "title": "综合评估",
                    "content": "整体质量可进入人工抽检。",
                    "bullets": [],
                },
                {
                    "id": "recommendations",
                    "title": "建议",
                    "content": "建议补齐待确认字段后再投放。",
                    "bullets": ["确认容量"],
                },
            ],
            "telemetrySnapshot": {
                "totalDurationMs": 120000,
                "totalTokens": 3500,
                "successRate": 1.0,
                "summaryText": "成功率 100%，总 Token 3500。",
            },
            "confidence": 0.78,
            "disclaimer": "测试免责声明",
        }
    )
    assert data["reportTitle"]
    assert len(data["sections"]) >= 4


def test_fallback_pdf_report() -> None:
    summary = _fixture_summary()
    report_input = build_pdf_report_input(
        pipeline_id="pl_pdf_test",
        description="测试保温杯，316 不锈钢",
        summary=summary,
        modules=[
            {
                "moduleId": "content",
                "moduleName": "文案生成",
                "outputSummary": "标题与详情页已生成。",
                "status": "completed",
            }
        ],
        telemetry=_fixture_telemetry()[:2],
        started_at_iso="2026-05-30T00:00:00Z",
        options={"productName": "测试保温杯"},
    )
    report_input["roleRuns"] = _fixture_telemetry()[:2]
    report = fallback_pdf_report(report_input)
    assert report["reportTitle"]
    assert report["sections"]
    assert any(section["id"] == "recommendations" for section in report["sections"])


def main() -> None:
    test_validate_pdf_report()
    test_fallback_pdf_report()
    print("test_pdf_report_smoke: OK")


if __name__ == "__main__":
    main()
