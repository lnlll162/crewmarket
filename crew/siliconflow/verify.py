"""对白名单内每个已接入模型做最小 live API 调用。"""

from __future__ import annotations

import os
from typing import Any, Literal

from generation import generate_image, submit_video
from siliconflow.client import post_json
from siliconflow.embeddings import create_embeddings
from siliconflow.rerank import rerank_documents
from siliconflow.registry import PATH_CHAT
from siliconflow.speech import create_speech
from siliconflow.verified_models import (
    LLM_DEFAULT_VERIFIED,
    OPTIONAL_INTEGRATED_MODELS,
    VERIFIED_AUXILIARY_MODELS,
    VERIFIED_GENERATION_MODELS,
    VERIFIED_TASK_MODELS,
    VerifiedBinding,
    verified_model_ids,
)

ProbeKind = Literal["chat", "image", "video_submit", "embedding", "rerank", "speech", "stt"]


def _resolve_model(binding: VerifiedBinding) -> str:
    return (os.getenv(binding.env_var) or binding.model_id).strip()


def _chat_ping(model_id: str) -> dict[str, Any]:
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": "只回复：OK"}],
        "max_tokens": 8,
        "temperature": 0,
    }
    data = post_json(PATH_CHAT, payload)
    if not data.get("choices"):
        raise ValueError("响应无 choices")
    usage = data.get("usage") or {}
    return {
        "totalTokens": usage.get("total_tokens"),
        "preview": (data["choices"][0].get("message") or {}).get("content", "")[:40],
    }


def _probe_image(model_id: str) -> dict[str, Any]:
    prev_steps = os.environ.get("AGENT_IMAGE_STEPS")
    os.environ["AGENT_IMAGE_STEPS"] = os.getenv("PROBE_IMAGE_STEPS", "8")
    try:
        result = generate_image("简约白色背景上的红色马克杯产品图", model=model_id)
    finally:
        if prev_steps is None:
            os.environ.pop("AGENT_IMAGE_STEPS", None)
        else:
            os.environ["AGENT_IMAGE_STEPS"] = prev_steps
    url = result.get("url") or ""
    if not url:
        raise ValueError("未返回图片 url")
    return {"url": url[:80]}


def _probe_video_submit(model_id: str) -> dict[str, Any]:
    result = submit_video("红色马克杯在白色桌面上缓慢旋转展示", model=model_id)
    request_id = result.get("requestId")
    if not request_id:
        raise ValueError("未返回 requestId")
    return {"requestId": request_id, "status": result.get("status")}


def _probe_embedding(model_id: str) -> dict[str, Any]:
    res = create_embeddings("CrewMarket 模型探针", model=model_id)
    dim = len((res.get("data") or [{}])[0].get("embedding") or [])
    if dim <= 0:
        raise ValueError("embedding 维度为 0")
    return {"dims": dim}


def _probe_rerank(model_id: str) -> dict[str, Any]:
    res = rerank_documents("保温杯", ["苹果", "不锈钢保温杯", "香蕉"], model=model_id, top_n=1)
    if not res.get("results"):
        raise ValueError("无 rerank results")
    return {"topIndex": res["results"][0].get("index")}


def _probe_speech(model_id: str) -> dict[str, Any]:
    res = create_speech("模型探针测试", model=model_id)
    if res.get("audioBase64"):
        return {"byteLength": res.get("byteLength")}
    if res.get("raw"):
        return {"raw": True}
    raise ValueError("无音频输出")


def _run_probe(kind: ProbeKind, model_id: str) -> dict[str, Any]:
    if kind == "chat":
        return _chat_ping(model_id)
    if kind == "image":
        return _probe_image(model_id)
    if kind == "video_submit":
        return _probe_video_submit(model_id)
    if kind == "embedding":
        return _probe_embedding(model_id)
    if kind == "rerank":
        return _probe_rerank(model_id)
    if kind == "speech":
        return _probe_speech(model_id)
    if kind == "stt":
        from siliconflow.account_probe import _ensure_probe_audio
        from siliconflow.stt import transcribe_audio

        res = transcribe_audio(_ensure_probe_audio(), model=model_id)
        if not (res.get("text") or "").strip():
            raise ValueError("转写为空")
        return {"textPreview": str(res.get("text"))[:40]}
    raise ValueError(f"未知探针类型: {kind}")


def _binding_row(
    *,
    binding_id: str,
    binding: VerifiedBinding,
    kind: ProbeKind,
    task_id: str | None = None,
) -> dict[str, Any]:
    model_id = _resolve_model(binding)
    row: dict[str, Any] = {
        "bindingId": binding_id,
        "taskId": task_id,
        "scope": binding.scope,
        "envVar": binding.env_var,
        "modelId": model_id,
        "probeKind": kind,
        "ok": False,
    }
    try:
        detail = _run_probe(kind, model_id)
        row["ok"] = True
        row["detail"] = detail
    except Exception as exc:
        row["error"] = str(exc)[:500]
    return row


def verify_all_integrated_models(*, include_optional: bool = True) -> dict[str, Any]:
    """逐绑定测试所有已接入模型（chat ×7 + 生图 + 视频 + embedding + rerank [+ speech]）。"""
    rows: list[dict[str, Any]] = []

    default_model = (os.getenv("LLM_DEFAULT_MODEL") or LLM_DEFAULT_VERIFIED).strip()
    row = {
        "bindingId": "llm_default",
        "taskId": None,
        "scope": "pipeline",
        "envVar": "LLM_DEFAULT_MODEL",
        "modelId": default_model,
        "probeKind": "chat",
        "ok": False,
    }
    try:
        row["detail"] = _chat_ping(default_model)
        row["ok"] = True
    except Exception as exc:
        row["error"] = str(exc)[:500]
    rows.append(row)

    for task_id, binding in VERIFIED_TASK_MODELS.items():
        rows.append(
            _binding_row(binding_id=task_id, binding=binding, kind="chat", task_id=task_id)
        )

    for cap_id, binding in VERIFIED_GENERATION_MODELS.items():
        kind: ProbeKind = "image" if cap_id == "image" else "video_submit"
        rows.append(_binding_row(binding_id=f"generation.{cap_id}", binding=binding, kind=kind))

    for cap_id, binding in VERIFIED_AUXILIARY_MODELS.items():
        kind = "embedding" if cap_id == "embedding" else "rerank"
        rows.append(_binding_row(binding_id=f"auxiliary.{cap_id}", binding=binding, kind=kind))

    if include_optional:
        for cap_id, binding in OPTIONAL_INTEGRATED_MODELS.items():
            kind = "speech" if cap_id == "speech" else "stt"
            rows.append(_binding_row(binding_id=f"optional.{cap_id}", binding=binding, kind=kind))

    failures = [r["bindingId"] for r in rows if not r.get("ok")]
    unique_models = sorted({r["modelId"] for r in rows})
    passed_models = sorted({r["modelId"] for r in rows if r.get("ok")})

    return {
        "ok": not failures,
        "totalBindings": len(rows),
        "passedBindings": len(rows) - len(failures),
        "uniqueModels": len(unique_models),
        "passedUniqueModels": len(passed_models),
        "failures": failures,
        "results": rows,
    }


def verify_env_matches_whitelist() -> list[dict[str, Any]]:
    allowed = verified_model_ids()
    checks: list[dict[str, Any]] = []
    all_bindings = (
        list(VERIFIED_TASK_MODELS.values())
        + list(VERIFIED_GENERATION_MODELS.values())
        + list(VERIFIED_AUXILIARY_MODELS.values())
        + list(OPTIONAL_INTEGRATED_MODELS.values())
    )
    if (os.getenv("LLM_DEFAULT_MODEL") or "").strip():
        configured = os.getenv("LLM_DEFAULT_MODEL", "").strip()
        checks.append(
            {
                "envVar": "LLM_DEFAULT_MODEL",
                "configured": configured,
                "ok": configured in allowed,
            }
        )
    for binding in all_bindings:
        configured = (os.getenv(binding.env_var) or "").strip()
        if not configured:
            continue
        checks.append(
            {
                "envVar": binding.env_var,
                "configured": configured,
                "ok": configured in allowed,
            }
        )
    return checks


def run_full_verify(*, include_optional: bool = True) -> dict[str, Any]:
    """兼容旧接口：env 校验 + 全模型 live 探针。"""
    env_checks = verify_env_matches_whitelist()
    model_report = verify_all_integrated_models(include_optional=include_optional)
    failures = list(model_report.get("failures") or [])
    for item in env_checks:
        if not item.get("ok"):
            failures.append(item.get("envVar"))
    return {
        "ok": not failures,
        "failures": failures,
        "envWhitelist": env_checks,
        **model_report,
    }
