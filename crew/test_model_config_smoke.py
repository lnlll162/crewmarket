"""model_config 离线 smoke — 不调用 LLM。"""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from model_config import apply_model_config, expected_models_from_config, get_effective_model_bindings


def test_apply_model_config_injects_env() -> None:
    fixture = {
        "version": 1,
        "updatedAt": "2026-05-31T00:00:00.000Z",
        "provider": "siliconflow",
        "tasks": {
            "task.product_extract": {"model": "Qwen/Qwen3-VL-32B-Instruct", "provider": "siliconflow"},
            "task.market_research": {"model": "THUDM/GLM-4-32B-0414", "provider": "siliconflow"},
            "task.content_write": {"model": "Qwen/Qwen2.5-72B-Instruct", "provider": "siliconflow"},
            "task.seo_optimize": {"model": "THUDM/GLM-4-32B-0414", "provider": "siliconflow"},
            "task.social_adapt": {"model": "Qwen/Qwen2.5-32B-Instruct", "provider": "siliconflow"},
            "task.result_merge": {"model": "deepseek-ai/DeepSeek-V3", "provider": "siliconflow"},
            "task.pdf_report": {"model": "deepseek-ai/DeepSeek-V3", "provider": "siliconflow"},
        },
        "generation": {"image": "baidu/ERNIE-Image-Turbo"},
    }

    expected = expected_models_from_config(fixture)
    assert len(expected) == 8, f"expected 8 bindings, got {len(expected)}"

    apply_model_config(fixture)
    effective = {row["bindingId"]: row["modelId"] for row in get_effective_model_bindings()}
    assert len(effective) == 8

    for binding_id, model_id in expected.items():
        assert effective.get(binding_id) == model_id, (
            f"{binding_id}: expected {model_id}, got {effective.get(binding_id)}"
        )

    assert os.environ.get("AGENT_MODEL_MARKET_RESEARCH_MODEL") == "THUDM/GLM-4-32B-0414"
    assert os.environ.get("AGENT_IMAGE_MODEL") == "baidu/ERNIE-Image-Turbo"
    print("test_model_config_smoke: PASS")


if __name__ == "__main__":
    test_apply_model_config_injects_env()
