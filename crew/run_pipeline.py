#!/usr/bin/env python3
"""CrewAI Pipeline CLI — 从 stdin 读 JSON，向 stdout 输出 JSON。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

# 加载项目根目录 .env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from pipeline import (  # noqa: E402
    run_analyze_only,
    run_content_only,
    run_full_pipeline,
    run_merge_only,
    run_seo_only,
    run_social_only,
)


STEP_HANDLERS = {
    "full": run_full_pipeline,
    "analyze": run_analyze_only,
    "content": run_content_only,
    "seo": run_seo_only,
    "social": run_social_only,
    "merge": run_merge_only,
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--step",
        choices=list(STEP_HANDLERS.keys()),
        default="full",
    )
    args = parser.parse_args()

    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}

    handler = STEP_HANDLERS[args.step]
    result = handler(payload)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
