"""读取 data/agent-model-config.json 并注入 Pipeline 运行时环境变量。"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from config import TASK_ENV_PREFIX

CONFIG_REL_PATH = Path("data") / "agent-model-config.json"

GENERATION_ENV_KEYS = {"image": "AGENT_IMAGE_MODEL"}


def config_file_path() -> Path:
    return Path(__file__).resolve().parent.parent / CONFIG_REL_PATH


def parse_config_document(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict) or raw.get("version") != 1:
        return None
    if not isinstance(raw.get("tasks"), dict):
        return None
    return raw


def read_saved_config() -> dict[str, Any] | None:
    path = config_file_path()
    if not path.is_file():
        return None
    try:
        return parse_config_document(json.loads(path.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError):
        return None


def expected_models_from_config(raw: dict[str, Any]) -> dict[str, str]:
    """从配置文档解析 bindingId -> modelId（不读环境变量）。"""
    expected: dict[str, str] = {}
    tasks = raw.get("tasks")
    if isinstance(tasks, dict):
        for task_id, binding in tasks.items():
            if task_id not in TASK_ENV_PREFIX or not isinstance(binding, dict):
                continue
            model = str(binding.get("model") or "").strip()
            if model:
                expected[str(task_id)] = model
    generation = raw.get("generation")
    if isinstance(generation, dict):
        image = str(generation.get("image") or "").strip()
        if image:
            expected["generation.image"] = image
    return expected


def _apply_section_env(section: Any, mapping: dict[str, str]) -> None:
    if not isinstance(section, dict):
        return
    for key, env_var in mapping.items():
        value = str(section.get(key) or "").strip()
        if value:
            os.environ[env_var] = value


def apply_model_config(raw: dict[str, Any]) -> None:
    tasks = raw.get("tasks")
    if isinstance(tasks, dict):
        for task_id, binding in tasks.items():
            if task_id not in TASK_ENV_PREFIX or not isinstance(binding, dict):
                continue
            model = str(binding.get("model") or "").strip()
            if not model:
                continue
            prefix = TASK_ENV_PREFIX[task_id]  # type: ignore[index]
            os.environ[f"{prefix}_MODEL"] = model
            os.environ[f"{prefix}_PROVIDER"] = str(binding.get("provider") or "siliconflow").strip()
    _apply_section_env(raw.get("generation"), GENERATION_ENV_KEYS)


def apply_saved_model_config() -> bool:
    raw = read_saved_config()
    if not raw:
        return False
    apply_model_config(raw)
    return True


def get_effective_model_bindings() -> list[dict[str, str]]:
    """当前进程环境变量中的主链路 8 项绑定（7 Task + 文生图）。"""
    rows: list[dict[str, str]] = []
    for task_id, prefix in TASK_ENV_PREFIX.items():
        model = (os.getenv(f"{prefix}_MODEL") or "").strip()
        if model:
            rows.append(
                {
                    "bindingId": task_id,
                    "envVar": f"{prefix}_MODEL",
                    "modelId": model,
                }
            )
    image = (os.getenv("AGENT_IMAGE_MODEL") or "").strip()
    if image:
        rows.append(
            {
                "bindingId": "generation.image",
                "envVar": "AGENT_IMAGE_MODEL",
                "modelId": image,
            }
        )
    return rows


def verify_config_applied_to_env() -> dict[str, Any]:
    """离线校验：saved config 与当前 env 是否一致（需先 apply_saved_model_config）。"""
    raw = read_saved_config()
    if not raw:
        return {
            "ok": True,
            "skipped": True,
            "message": "无 data/agent-model-config.json，使用 bootstrap 默认",
            "results": [],
        }

    expected = expected_models_from_config(raw)
    results: list[dict[str, Any]] = []
    failures: list[str] = []

    for binding_id, model_id in expected.items():
        if binding_id.startswith("task."):
            prefix = TASK_ENV_PREFIX[binding_id]  # type: ignore[index]
            env_var = f"{prefix}_MODEL"
        elif binding_id == "generation.image":
            env_var = "AGENT_IMAGE_MODEL"
        else:
            continue

        actual = (os.getenv(env_var) or "").strip()
        ok = actual == model_id
        if not ok:
            failures.append(binding_id)
        results.append(
            {
                "bindingId": binding_id,
                "envVar": env_var,
                "expectedModelId": model_id,
                "actualModelId": actual,
                "ok": ok,
            }
        )

    return {
        "ok": not failures,
        "skipped": False,
        "configPath": str(CONFIG_REL_PATH),
        "failures": failures,
        "results": results,
    }
