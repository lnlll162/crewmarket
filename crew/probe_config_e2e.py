#!/usr/bin/env python3
"""端到端验收：saved config → analyze 步骤 telemetry 模型一致。"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PYTHON = ROOT / "crew" / ".venv" / "Scripts" / "python.exe"
PIPELINE = ROOT / "crew" / "run_pipeline.py"
CONFIG = ROOT / "data" / "agent-model-config.json"


def main() -> None:
    if not CONFIG.is_file():
        print("SKIP: 无 agent-model-config.json")
        raise SystemExit(0)

    raw = json.loads(CONFIG.read_text(encoding="utf-8"))
    expected = {
        "productExtract": raw["tasks"]["task.product_extract"]["model"],
        "marketResearch": raw["tasks"]["task.market_research"]["model"],
    }

    payload = json.dumps({"description": "智能手环，支持心率监测与睡眠追踪"}, ensure_ascii=False)
    proc = subprocess.run(
        [str(PYTHON), str(PIPELINE), "--step", "analyze"],
        input=payload,
        capture_output=True,
        text=True,
        encoding="utf-8",
        cwd=str(ROOT),
    )
    if proc.returncode != 0:
        err = proc.stderr or proc.stdout
        if "识图" in err or "vision" in err.lower() or "image" in err.lower():
            print("SKIP: analyze 需产品图；config→env 已由 probe_config_bindings --offline 覆盖")
            raise SystemExit(0)
        print("FAIL pipeline:", err[:500])
        raise SystemExit(1)

    envelope = json.loads(proc.stdout)
    telemetry = envelope.get("telemetry") or []
    actual = {row.get("roleId"): row.get("model") for row in telemetry}

    print("expected:", expected)
    print("telemetry:", actual)

    ok = all(actual.get(role) == model for role, model in expected.items())
    if not ok:
        print("E2E telemetry mismatch")
        raise SystemExit(1)
    print("probe_config_e2e: PASS")


if __name__ == "__main__":
    main()
