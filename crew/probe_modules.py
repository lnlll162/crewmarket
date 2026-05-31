"""验证 pipeline 返回的 modules[] 是否含过程记录字段。

用法（项目根目录）:
  py crew/test_module_records_smoke.py   # 离线 smoke（不调用 LLM）
  py crew/probe_modules.py --offline    # 同上 + 打印样例
  py crew/probe_modules.py --live       # 调用 analyze 步骤（需 .env API Key，较慢）
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

REQUIRED = (
    "moduleId",
    "moduleName",
    "roleId",
    "roleName",
    "status",
    "inputSummary",
    "outputSummary",
    "promptVersion",
)


def _check_modules(modules: list[dict], label: str) -> bool:
    ok = True
    print(f"\n=== {label} ===")
    print("count=", len(modules))
    for item in modules:
        missing = [key for key in REQUIRED if not item.get(key)]
        if missing:
            ok = False
            print(f"FAIL moduleId={item.get('moduleId')} missing={missing}")
        else:
            print(
                f"OK {item['moduleId']} | v={item['promptVersion']} | "
                f"in={item['inputSummary'][:40]}… | out={item['outputSummary'][:40]}…"
            )
    return ok


def run_offline() -> bool:
    from test_module_records_smoke import main as smoke_main

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

    modules = build_full_pipeline_modules(
        telemetry=_fixture_telemetry(),
        product=_fixture_product(),
        market_research=_fixture_market(),
        content=_fixture_content(),
        seo=_fixture_seo(),
        social=_fixture_social(),
        merged=_fixture_merged(),
        description="一款轻便保温杯",
        image_url=None,
        image_base64=None,
        options={"category": "水具"},
        options_text='{"category": "水具"}',
        category="水具",
        pending=[],
    )
    sample = {key: modules[0].get(key) for key in [*REQUIRED, "durationMs", "totalTokens"]}
    print("\nsample_module=", json.dumps(sample, ensure_ascii=False, indent=2))
    return _check_modules(modules, "offline fixture full pipeline")


def run_live() -> bool:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)
    from pipeline import run_analyze_only

    result = run_analyze_only(
        {
            "description": "便携保温杯，304不锈钢，500ml，保冷12小时，适合通勤。",
            "options": {"productName": "便携保温杯", "category": "水具"},
        }
    )
    modules = result.get("modules") or []
    print("status=", result.get("status"))
    print("telemetry_count=", len(result.get("telemetry") or []))
    return _check_modules(modules, "live run_analyze_only")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--offline", action="store_true", help="仅离线 fixture 验证")
    parser.add_argument("--live", action="store_true", help="调用 analyze API 验证")
    args = parser.parse_args()

    if args.live:
        ok = run_live()
    else:
        ok = run_offline()

    if not ok:
        raise SystemExit(1)
    print("\nprobe_modules: PASS")


if __name__ == "__main__":
    main()
