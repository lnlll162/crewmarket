"""验证 PdfReport 输出（离线 fallback / 可选 live merge+pdf）。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

REQUIRED = ("reportTitle", "coverHighlights", "sections", "telemetrySnapshot", "disclaimer")
SECTION_IDS = {"taskOverview", "moduleOutputs", "assessment", "recommendations"}


def _check_pdf_report(report: dict, label: str) -> bool:
    ok = True
    print(f"\n=== {label} ===")
    for key in REQUIRED:
        value = report.get(key)
        if value is None or value == "" or value == []:
            print(f"FAIL missing/empty {key}")
            ok = False
        else:
            preview = json.dumps(value, ensure_ascii=False)[:80]
            print(f"OK {key} = {preview}…")
    section_ids = {item.get("id") for item in report.get("sections") or []}
    missing = SECTION_IDS - section_ids
    if missing:
        print(f"FAIL missing section ids: {missing}")
        ok = False
    else:
        print(f"OK section ids cover {SECTION_IDS}")
    print("reportTitle:", report.get("reportTitle"))
    return ok


def run_offline() -> bool:
    from test_pdf_report_smoke import main as smoke_main

    smoke_main()
    from test_module_records_smoke import (
        _fixture_content,
        _fixture_market,
        _fixture_merged,
        _fixture_product,
        _fixture_seo,
        _fixture_social,
        _fixture_telemetry,
        build_full_pipeline_modules,
    )
    from summary_eval import build_summary_input, fallback_pipeline_summary
    from pdf_report import build_pdf_report_input, fallback_pdf_report

    modules = build_full_pipeline_modules(
        telemetry=_fixture_telemetry(),
        product=_fixture_product(),
        market_research=_fixture_market(),
        content=_fixture_content(),
        seo=_fixture_seo(),
        social=_fixture_social(),
        merged=_fixture_merged(),
        description="便携保温杯测试",
        image_url=None,
        image_base64=None,
        options={"category": "水具", "productName": "便携保温杯"},
        options_text='{"category": "水具"}',
        category="水具",
        pending=[],
    )
    inp = build_summary_input(
        pipeline_id="pl_probe_pdf",
        description="便携保温杯测试",
        modules=modules,
        telemetry=_fixture_telemetry(),
        started_at_iso="2026-05-30T00:00:00Z",
    )
    summary = fallback_pipeline_summary(inp)
    report_input = build_pdf_report_input(
        pipeline_id="pl_probe_pdf",
        description="便携保温杯测试",
        summary=summary,
        modules=modules,
        telemetry=_fixture_telemetry(),
        started_at_iso="2026-05-30T00:00:00Z",
        options={"productName": "便携保温杯"},
    )
    report_input["roleRuns"] = _fixture_telemetry()
    report = fallback_pdf_report(report_input)
    return _check_pdf_report(report, "offline fallback pdfReport")


def run_live() -> bool:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)
    from pipeline import run_merge_only
    from test_module_records_smoke import (
        _fixture_content,
        _fixture_market,
        _fixture_product,
        _fixture_seo,
        _fixture_social,
    )

    payload = {
        "description": "便携保温杯，304不锈钢，500ml",
        "product": _fixture_product(),
        "market": _fixture_market(),
        "content": _fixture_content(),
        "seo": _fixture_seo(),
        "social": _fixture_social(),
        "options": {"productName": "便携保温杯", "category": "水具"},
    }
    result = run_merge_only(payload)
    report = result.get("pdfReport") or {}
    print("telemetry_count=", len(result.get("telemetry") or []))
    return _check_pdf_report(report, "live run_merge_only pdfReport")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    ok = run_live() if args.live else run_offline()
    if not ok:
        raise SystemExit(1)
    print("\nprobe_pdf_report: PASS")


if __name__ == "__main__":
    main()
