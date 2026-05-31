#!/usr/bin/env python3
"""配置页 8 项绑定探针：离线校验 env 注入 + live 最小 API 调用。

用法:
  py crew/probe_config_bindings.py --offline
  py crew/probe_config_bindings.py --live
  py crew/probe_config_bindings.py --live --json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from model_config import apply_saved_model_config, verify_config_applied_to_env
from siliconflow.bootstrap import apply_siliconflow_env_defaults
from siliconflow.verify import _run_probe

CONFIG_PAGE_PROBE_KINDS: dict[str, str] = {
    "task.product_extract": "chat",
    "task.market_research": "chat",
    "task.content_write": "chat",
    "task.seo_optimize": "chat",
    "task.social_adapt": "chat",
    "task.result_merge": "chat",
    "task.pdf_report": "chat",
    "generation.image": "image",
}


def _binding_env_var(binding_id: str) -> str:
    from config import TASK_ENV_PREFIX

    if binding_id == "generation.image":
        return "AGENT_IMAGE_MODEL"
    prefix = TASK_ENV_PREFIX[binding_id]  # type: ignore[index]
    return f"{prefix}_MODEL"


def probe_live_bindings() -> dict:
    import os

    rows: list[dict] = []
    failures: list[str] = []

    for binding_id, kind in CONFIG_PAGE_PROBE_KINDS.items():
        env_var = _binding_env_var(binding_id)
        model_id = (os.getenv(env_var) or "").strip()
        row: dict = {
            "bindingId": binding_id,
            "envVar": env_var,
            "modelId": model_id,
            "probeKind": kind,
            "ok": False,
        }
        if not model_id:
            row["error"] = f"未配置 {env_var}"
            failures.append(binding_id)
            rows.append(row)
            continue
        try:
            row["detail"] = _run_probe(kind, model_id)  # type: ignore[arg-type]
            row["ok"] = True
        except Exception as exc:
            row["error"] = str(exc)[:500]
            failures.append(binding_id)
        rows.append(row)

    return {
        "ok": not failures,
        "mode": "live",
        "totalBindings": len(rows),
        "passedBindings": len(rows) - len(failures),
        "failures": failures,
        "results": rows,
    }


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="配置页 8 项绑定探针")
    parser.add_argument("--offline", action="store_true", help="仅校验 config → env 注入")
    parser.add_argument("--live", action="store_true", help="live 最小 API 探针（含 offline 校验）")
    parser.add_argument("--json", action="store_true", help="JSON 输出")
    args = parser.parse_args()

    if not args.offline and not args.live:
        args.offline = True

    apply_siliconflow_env_defaults()
    apply_saved_model_config()

    offline_report = verify_config_applied_to_env()
    report: dict = {"offline": offline_report}

    if args.live:
        report["live"] = probe_live_bindings()
        report["ok"] = offline_report.get("ok", True) and report["live"].get("ok", False)
    else:
        report["ok"] = offline_report.get("ok", True)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("=== CrewMarket · 配置页绑定探针 ===\n")
        if offline_report.get("skipped"):
            print(f"offline: SKIP — {offline_report.get('message')}")
        else:
            print(f"offline: {'PASS' if offline_report.get('ok') else 'FAIL'}")
            for row in offline_report.get("results") or []:
                status = "OK" if row.get("ok") else "MISMATCH"
                print(
                    f"  {row.get('bindingId'):<28} expected={row.get('expectedModelId')} "
                    f"actual={row.get('actualModelId')} [{status}]"
                )
        if args.live and report.get("live"):
            live = report["live"]
            print(f"\nlive: {'PASS' if live.get('ok') else 'FAIL'} "
                  f"({live.get('passedBindings')}/{live.get('totalBindings')})")
            for row in live.get("results") or []:
                status = "OK" if row.get("ok") else f"FAIL: {(row.get('error') or '')[:40]}"
                print(f"  {row.get('bindingId'):<28} {row.get('modelId'):<42} {status}")

    if not report.get("ok"):
        raise SystemExit(1)
    if not args.json:
        print("\nprobe_config_bindings: ALL PASS")


if __name__ == "__main__":
    main()
