#!/usr/bin/env python3
"""逐绑定 live 测试所有已接入硅基流动模型。

覆盖：
- LLM_DEFAULT_MODEL
- 7 个 AiTask（AGENT_MODEL_*）
- 生图 / 视频提交
- Embedding / Rerank
- 可选 TTS（POST /api/siliconflow/speech）

用法:
  py crew/probe_all_models.py
  py crew/probe_all_models.py --no-optional   # 跳过 TTS
  py crew/probe_all_models.py --json          # 输出完整 JSON 报告
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from siliconflow.bootstrap import apply_siliconflow_env_defaults, assert_env_models_whitelisted
from siliconflow.verify import verify_all_integrated_models, verify_env_matches_whitelist


def _print_table(report: dict) -> None:
    print(f"\n{'bindingId':<28} {'probe':<14} {'modelId':<42} {'status'}")
    print("-" * 100)
    for row in report.get("results") or []:
        status = "OK" if row.get("ok") else f"FAIL: {(row.get('error') or '')[:36]}"
        print(
            f"{str(row.get('bindingId')):<28} "
            f"{str(row.get('probeKind')):<14} "
            f"{str(row.get('modelId')):<42} "
            f"{status}"
        )
    print("-" * 100)
    print(
        f"绑定 {report.get('passedBindings')}/{report.get('totalBindings')} 通过 · "
        f"唯一模型 {report.get('passedUniqueModels')}/{report.get('uniqueModels')} 通过"
    )
    if report.get("failures"):
        print("失败:", ", ".join(report["failures"]))


def main() -> None:
    parser = argparse.ArgumentParser(description="测试所有已接入硅基流动模型")
    parser.add_argument("--no-optional", action="store_true", help="跳过 optional（TTS）")
    parser.add_argument("--json", action="store_true", help="输出 JSON")
    args = parser.parse_args()

    apply_siliconflow_env_defaults()
    assert_env_models_whitelisted()

    env_bad = [c for c in verify_env_matches_whitelist() if not c.get("ok")]
    if env_bad:
        print("FAIL .env 含非白名单模型:")
        for item in env_bad:
            print(f"  {item['envVar']}={item['configured']}")
        raise SystemExit(1)

    print("=== CrewMarket · 全模型 live 探针 ===\n")
    report = verify_all_integrated_models(include_optional=not args.no_optional)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        _print_table(report)

    if not report.get("ok"):
        raise SystemExit(1)
    print("\nprobe_all_models: ALL PASS")


if __name__ == "__main__":
    main()
