"""启动时注入硅基流动白名单默认环境变量。"""

from __future__ import annotations

import os

from config import TASK_ENV_PREFIX
from siliconflow.verified_models import (
    LLM_DEFAULT_VERIFIED,
    OPTIONAL_INTEGRATED_MODELS,
    VERIFIED_AUXILIARY_MODELS,
    VERIFIED_GENERATION_MODELS,
    VERIFIED_TASK_MODELS,
    verified_model_ids,
)


def apply_siliconflow_env_defaults() -> None:
    if not (os.getenv("LLM_DEFAULT_PROVIDER") or "").strip():
        os.environ["LLM_DEFAULT_PROVIDER"] = "siliconflow"
    if not (os.getenv("LLM_DEFAULT_API_KEY_ENV") or "").strip():
        os.environ["LLM_DEFAULT_API_KEY_ENV"] = "SILICONFLOW_API_KEY"
    if not (os.getenv("LLM_DEFAULT_MODEL") or "").strip():
        os.environ["LLM_DEFAULT_MODEL"] = LLM_DEFAULT_VERIFIED

    for task_id, prefix in TASK_ENV_PREFIX.items():
        binding = VERIFIED_TASK_MODELS.get(task_id)
        if not binding:
            continue
        model_key = f"{prefix}_MODEL"
        provider_key = f"{prefix}_PROVIDER"
        api_env_key = f"{prefix}_API_KEY_ENV"
        if not (os.getenv(model_key) or "").strip():
            os.environ[model_key] = binding.model_id
        if not (os.getenv(provider_key) or "").strip():
            os.environ[provider_key] = "siliconflow"
        if not (os.getenv(api_env_key) or "").strip():
            os.environ[api_env_key] = "SILICONFLOW_API_KEY"

    for binding in (*VERIFIED_GENERATION_MODELS.values(), *VERIFIED_AUXILIARY_MODELS.values()):
        if not (os.getenv(binding.env_var) or "").strip():
            os.environ[binding.env_var] = binding.model_id

    for binding in OPTIONAL_INTEGRATED_MODELS.values():
        if not (os.getenv(binding.env_var) or "").strip():
            os.environ[binding.env_var] = binding.model_id

    if not (os.getenv("AGENT_IMAGE_EDIT_MODEL") or "").strip():
        os.environ["AGENT_IMAGE_EDIT_MODEL"] = os.environ.get(
            "AGENT_IMAGE_MODEL", VERIFIED_GENERATION_MODELS["image"].model_id
        )

    if not (os.getenv("MERGE_MODEL") or "").strip():
        os.environ["MERGE_MODEL"] = os.environ.get(
            "AGENT_MODEL_RESULT_MERGE_MODEL",
            VERIFIED_TASK_MODELS["task.result_merge"].model_id,
        )
    if not (os.getenv("PDF_REPORT_MODEL") or "").strip():
        os.environ["PDF_REPORT_MODEL"] = os.environ.get(
            "AGENT_MODEL_PDF_REPORT_MODEL",
            VERIFIED_TASK_MODELS["task.pdf_report"].model_id,
        )


def assert_env_models_whitelisted() -> None:
    """若 .env 显式指定模型，必须在白名单内。"""
    allowed = verified_model_ids()
    checks = [
        ("LLM_DEFAULT_MODEL", os.getenv("LLM_DEFAULT_MODEL")),
        *[(b.env_var, os.getenv(b.env_var)) for b in VERIFIED_TASK_MODELS.values()],
        *[(b.env_var, os.getenv(b.env_var)) for b in VERIFIED_GENERATION_MODELS.values()],
        *[(b.env_var, os.getenv(b.env_var)) for b in VERIFIED_AUXILIARY_MODELS.values()],
    ]
    for env_key, value in checks:
        if not value or not str(value).strip():
            continue
        model = str(value).strip()
        if model not in allowed:
            raise ValueError(
                f"{env_key}={model} 不在硅基流动已实测白名单内，"
                f"请改用 crew/siliconflow/verified_models.py 中的模型或更新白名单。"
            )
