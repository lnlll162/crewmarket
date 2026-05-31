#!/usr/bin/env python3
"""CrewAI Pipeline CLI — 从 stdin 读 JSON，向 stdout 输出 JSON。"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# 加载项目根目录 .env，强制覆盖已有环境变量，避免旧占位值残留
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from siliconflow.bootstrap import apply_siliconflow_env_defaults, assert_env_models_whitelisted  # noqa: E402

apply_siliconflow_env_defaults()

from model_config import apply_saved_model_config  # noqa: E402

apply_saved_model_config()
assert_env_models_whitelisted()

from config import TASK_ENV_PREFIX  # noqa: E402
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


def validate_runtime_config() -> None:
    api_key = (os.getenv("SILICONFLOW_API_KEY") or "").strip()
    if not api_key:
        raise ValueError("未配置 SILICONFLOW_API_KEY")
    if api_key.lower() in {"your_siliconflow_api_key_here", "your_api_key_here", "changeme"}:
        raise ValueError("SILICONFLOW_API_KEY 仍是占位符，请替换为真实的硅基流动 API Key")

    default_model = (os.getenv("LLM_DEFAULT_MODEL") or "").strip()
    if not default_model:
        raise ValueError("未配置 LLM_DEFAULT_MODEL")

    for task_id, prefix in TASK_ENV_PREFIX.items():
        model = (os.getenv(f"{prefix}_MODEL") or "").strip()
        if not model:
            raise ValueError(f"{task_id} 未配置 {prefix}_MODEL（bootstrap 未生效）")

    # 白名单内 Pipeline + 辅助能力（不含未实测的 TTS/STT）
    for env_key in (
        "LLM_DEFAULT_MODEL",
        "AGENT_IMAGE_MODEL",
        "AGENT_VIDEO_MODEL",
        "SILICONFLOW_EMBEDDING_MODEL",
        "SILICONFLOW_RERANK_MODEL",
    ):
        if not (os.getenv(env_key) or "").strip():
            raise ValueError(f"未配置 {env_key}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    validate_runtime_config()
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
