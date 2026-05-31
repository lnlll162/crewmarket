"""PipelineSummary 校验与 fallback smoke test。"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from schemas import validate_pipeline_summary
from summary_eval import build_summary_input, fallback_pipeline_summary
from test_module_records_smoke import _fixture_telemetry


def test_validate_pipeline_summary() -> None:
    data = validate_pipeline_summary(
        {
            "executiveSummary": "本次运行整体完成，各模块输出结构完整，适合进入人工抽检与投放前确认。",
            "moduleSummary": [
                {
                    "moduleId": "content",
                    "moduleName": "文案生成",
                    "title": "文案生成",
                    "summary": "已生成标题、详情页与海报文案。",
                    "status": "completed",
                }
            ],
            "roleEvaluation": [
                {
                    "roleId": "content",
                    "roleName": "文案生成角色",
                    "evaluation": "输出完整，结构符合 schema。",
                    "score": 8,
                }
            ],
            "performanceReview": {"summary": "总 Token 1500，成功率 100%。"},
            "riskAssessment": [{"title": "待确认参数", "detail": "部分卖点待确认", "severity": "medium"}],
            "opportunityAnalysis": [{"title": "强化场景表达", "detail": "可补充通勤场景文案"}],
            "recommendations": [{"title": "人工复核", "detail": "确认产品参数后再投放"}],
            "pdfHighlights": ["标题已生成", "SEO 关键词齐全", "三平台社媒文案就绪"],
            "confidence": 0.82,
            "missingInfo": [],
        }
    )
    assert data["executiveSummary"]
    assert data["riskAssessment"][0]["severity"] == "medium"


def test_fallback_pipeline_summary() -> None:
    modules = [
        {
            "moduleId": "marketResearch",
            "moduleName": "市场分析",
            "outputSummary": "市场趋势稳定。",
            "status": "completed",
        }
    ]
    summary_input = build_summary_input(
        pipeline_id="pl_test",
        description="测试产品",
        modules=modules,
        telemetry=_fixture_telemetry()[:1],
        started_at_iso="2026-05-30T00:00:00Z",
    )
    summary = fallback_pipeline_summary(summary_input, pending=["品类待确认"])
    assert summary["executiveSummary"]
    assert summary["riskAssessment"]
    assert summary["recommendations"]
    assert "品类待确认" in summary["missingInfo"][0]


def main() -> None:
    test_validate_pipeline_summary()
    test_fallback_pipeline_summary()
    print("test_summary_eval_smoke: OK")


if __name__ == "__main__":
    main()
