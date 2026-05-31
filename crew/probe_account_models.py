#!/usr/bin/env python3
"""对硅基流动账号下全部 catalog 模型做 live 探针。

用法:
  py crew/probe_account_models.py
  py crew/probe_account_models.py --save crew/reports/account_models.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from siliconflow.account_catalog import fetch_complete_account_catalog
from siliconflow.account_probe import probe_all_account_models
from siliconflow.bootstrap import apply_siliconflow_env_defaults, assert_env_models_whitelisted


def _progress(index: int, total: int, row: dict) -> None:
    status = "OK" if row.get("ok") else "FAIL"
    print(
        f"[{index}/{total}] {status} {row.get('probeKind'):<14} {row.get('modelId')} "
        f"({row.get('durationMs')}ms)",
        flush=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--save", default="", help="保存 JSON 报告路径")
    args = parser.parse_args()

    apply_siliconflow_env_defaults()
    assert_env_models_whitelisted()

    catalog = fetch_complete_account_catalog()
    print("=== 硅基流动 · 账号全量模型探针 ===")
    print(f"catalog 合计 {catalog.get('totalModels')} 个模型（去重后 chat 只测一次）\n")
    for key, block in catalog.get("capabilities", {}).items():
        print(f"  {key}: {block.get('count')}")

    report = probe_all_account_models(on_progress=_progress)
    report["catalog"] = catalog
    report["testedAt"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    print("\n=== 汇总 ===")
    print(f"通过 {report['passed']}/{report['total']}")
    for kind, stats in (report.get("byProbeKind") or {}).items():
        print(f"  {kind}: {stats['passed']}/{stats['total']}")

    if report.get("failures"):
        print("\n失败模型:")
        for item in report["failures"]:
            print(f"  - {item['modelId']} ({item['catalogKey']}): {item.get('error', '')[:80]}")

    save_path = args.save or str(Path(__file__).resolve().parent / "reports" / "account_models_latest.json")
    out = Path(save_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n报告已保存: {out}")

    if not report.get("ok"):
        raise SystemExit(1)
    print("probe_account_models: ALL PASS")


if __name__ == "__main__":
    main()
