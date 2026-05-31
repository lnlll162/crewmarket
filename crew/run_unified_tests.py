#!/usr/bin/env python3
"""CrewMarket 统一探针 — 按 Gate A–H 顺序执行，失败即停并汇总。

用法:
  py crew/run_unified_tests.py              # 离线 + 轻量 API（推荐 CI/日常）
  py crew/run_unified_tests.py --offline    # 仅离线 smoke，无需 Key
  py crew/run_unified_tests.py --live       # 含 LLM 联调（耗时长、消耗 Token）
  py crew/run_unified_tests.py --all        # offline + api + live
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PYTHON = ROOT.parent / "crew" / ".venv" / "Scripts" / "python.exe"
if not PYTHON.is_file():
    PYTHON = Path(sys.executable)


@dataclass
class Step:
    gate: str
    label: str
    argv: list[str]
    tier: str  # offline | api | live


STEPS: list[Step] = [
    Step("A", "schema smoke", [str(PYTHON), str(ROOT / "test_schemas_smoke.py")], "offline"),
    Step("C", "module records smoke", [str(PYTHON), str(ROOT / "test_module_records_smoke.py")], "offline"),
    Step("C", "modules probe offline", [str(PYTHON), str(ROOT / "probe_modules.py"), "--offline"], "offline"),
    Step("F", "summary eval smoke", [str(PYTHON), str(ROOT / "test_summary_eval_smoke.py")], "offline"),
    Step("F", "summary probe offline", [str(PYTHON), str(ROOT / "probe_summary.py"), "--offline"], "offline"),
    Step("G", "pdf report smoke", [str(PYTHON), str(ROOT / "test_pdf_report_smoke.py")], "offline"),
    Step("G", "pdf report probe offline", [str(PYTHON), str(ROOT / "probe_pdf_report.py"), "--offline"], "offline"),
    Step("3.6", "model config smoke", [str(PYTHON), str(ROOT / "test_model_config_smoke.py")], "offline"),
    Step("3.6", "config bindings offline", [str(PYTHON), str(ROOT / "probe_config_bindings.py"), "--offline"], "offline"),
    Step("A", "raw usage probe", [str(PYTHON), str(ROOT / "probe_usage.py")], "api"),
    Step("B", "runner telemetry probe", [str(PYTHON), str(ROOT / "probe_runner_usage.py")], "api"),
    Step("H", "siliconflow whitelist verify", [str(PYTHON), str(ROOT / "probe_siliconflow_verify.py")], "api"),
    Step(
        "H",
        "siliconflow catalog + embedding/rerank",
        [str(PYTHON), str(ROOT / "probe_siliconflow_catalog.py"), "--probe-call"],
        "api",
    ),
    Step("C", "modules probe live", [str(PYTHON), str(ROOT / "probe_modules.py"), "--live"], "live"),
    Step("F", "summary probe live", [str(PYTHON), str(ROOT / "probe_summary.py"), "--live"], "live"),
    Step("G", "pdf report probe live", [str(PYTHON), str(ROOT / "probe_pdf_report.py"), "--live"], "live"),
    Step("3.6", "config bindings live", [str(PYTHON), str(ROOT / "probe_config_bindings.py"), "--live"], "live"),
    Step("H", "integrated bindings live", [str(PYTHON), str(ROOT / "probe_all_models.py")], "live"),
    Step(
        "H",
        "account all models live",
        [str(PYTHON), str(ROOT / "probe_account_models.py")],
        "live",
    ),
]


def run_step(step: Step) -> tuple[bool, str, float]:
    started = time.perf_counter()
    proc = subprocess.run(
        step.argv,
        cwd=ROOT.parent,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    elapsed = time.perf_counter() - started
    output = (proc.stdout or "") + (proc.stderr or "")
    ok = proc.returncode == 0
    return ok, output.strip(), elapsed


def main() -> None:
    parser = argparse.ArgumentParser(description="CrewMarket 统一 Gate 探针")
    parser.add_argument("--offline", action="store_true", help="仅离线 tier")
    parser.add_argument("--live", action="store_true", help="离线 + API + LLM live")
    parser.add_argument("--all", action="store_true", help="同 --live")
    parser.add_argument("--continue", dest="keep_going", action="store_true", help="失败后继续执行")
    args = parser.parse_args()

    if args.offline:
        tiers = {"offline"}
    elif args.live or args.all:
        tiers = {"offline", "api", "live"}
    else:
        tiers = {"offline", "api"}

    selected = [s for s in STEPS if s.tier in tiers]
    print(f"=== CrewMarket 统一测试 === tier={','.join(sorted(tiers))} steps={len(selected)}\n")

    passed: list[str] = []
    failed: list[tuple[str, str, str]] = []

    for step in selected:
        tag = f"Gate {step.gate} · {step.label}"
        print(f">> {tag} ...", flush=True)
        ok, output, elapsed = run_step(step)
        status = "PASS" if ok else "FAIL"
        print(f"  {status} ({elapsed:.1f}s)")
        if ok:
            passed.append(tag)
        else:
            failed.append((tag, step.argv[-1] if len(step.argv) > 2 else "", output[-1200:]))
            if not args.keep_going:
                print("\n--- 失败输出（末尾）---")
                print(output[-2000:])
                break
        if output and not ok:
            continue

    print("\n=== 汇总 ===")
    print(f"通过: {len(passed)}/{len(selected)}")
    for name in passed:
        print(f"  OK {name}")
    for name, _, _ in failed:
        print(f"  FAIL {name}")

    if failed:
        print("\n重跑单步示例:")
        step = next(s for s in selected if f"Gate {s.gate} · {s.label}" == failed[0][0])
        print(" ", " ".join(step.argv))
        raise SystemExit(1)

    print("\nrun_unified_tests: ALL PASS")


if __name__ == "__main__":
    main()
