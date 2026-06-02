"""硅基流动 Vision API — Task 1 产品识图。"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Optional

import httpx

from config import SILICONFLOW_BASE_URL, SILICONFLOW_IMAGE_MODEL
from prompts import GLOBAL_RULES
from schemas import SchemaValidationError, parse_json, validate_product
from telemetry_usage import normalize_usage

MAX_VISION_RETRIES = 3
MAX_DESCRIPTION_CHARS = 1800


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _now_ms(started_at: float) -> int:
    return max(0, int((perf_counter() - started_at) * 1000))

EXTRACT_PROMPT = f"""{GLOBAL_RULES}

【任务】根据产品图片和/或文字描述，提取结构化产品信息。

【输出 schema】
{{
  "productName": {{"value": "产品名称", "status": "confirmed或pending", "note": "可选"}},
  "category": {{"value": "品类", "status": "confirmed或pending", "note": "可选"}},
  "attributes": {{"value": ["可观察属性1", "属性2"], "status": "confirmed或pending", "note": "可选"}},
  "sellingPoints": {{"value": ["卖点1", "卖点2", "卖点3"], "status": "confirmed或pending", "note": "可选"}},
  "summary": "80-150字产品摘要"
}}

【要求】
- 有图片时优先从图片识别可见属性（颜色、材质、结构、配件等）。
- sellingPoints 至少 2 条，基于可见事实或文字描述，不要编造技术参数。
- 无法确认的信息 status 设为 pending 并在 note 说明原因。"""


def _truncate_description(description: str) -> str:
    text = (description or "").strip()
    if len(text) <= MAX_DESCRIPTION_CHARS:
        return text
    return text[:MAX_DESCRIPTION_CHARS].rstrip() + "…"


def _call_vision_api(
    description: str,
    image_url: Optional[str],
    image_base64: Optional[str],
    *,
    retry_hint: str = "",
) -> tuple[str, dict[str, int] | None]:
    api_key = os.getenv("SILICONFLOW_API_KEY", "").strip()
    if not api_key:
        raise ValueError("未配置 SILICONFLOW_API_KEY")
    if api_key.lower() in {"your_siliconflow_api_key_here", "your_api_key_here", "changeme"}:
        raise ValueError("SILICONFLOW_API_KEY 仍是占位符，请替换为真实的硅基流动 API Key")

    model = os.getenv(
        "AGENT_MODEL_PRODUCT_EXTRACT_MODEL",
        SILICONFLOW_IMAGE_MODEL,
    ).strip()

    normalized_description = _truncate_description(description)
    user_text = f"{EXTRACT_PROMPT}\n\n产品描述：{normalized_description}"
    if retry_hint:
        user_text += f"\n\n【上次输出不合格】{retry_hint}"

    content: list[dict[str, Any]] = [{"type": "text", "text": user_text}]
    if image_url:
        content.append({"type": "image_url", "image_url": {"url": image_url}})
    elif image_base64:
        url = image_base64 if image_base64.startswith("data:") else f"data:image/jpeg;base64,{image_base64}"
        content.append({"type": "image_url", "image_url": {"url": url}})

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": content}],
        "max_tokens": 2048,
        "temperature": 0.3,
    }

    timeout = httpx.Timeout(connect=60.0, read=600.0, write=60.0, pool=60.0)
    with httpx.Client(timeout=timeout, trust_env=True) as client:
        try:
            resp = client.post(
                f"{SILICONFLOW_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        except httpx.ReadTimeout as exc:
            raise ValueError(
                "硅基流动 Vision 请求超时（read timeout）。请检查网络、模型是否过忙，或尝试换一个更快的视觉模型。"
            ) from exc
        if resp.status_code == 401:
            raise ValueError(
                "硅基流动 API 返回 401 Unauthorized。请检查 SILICONFLOW_API_KEY 是否正确、是否仍为占位符、以及该 Key 是否有对应模型权限。"
            )
        resp.raise_for_status()
        data = resp.json()

    usage = normalize_usage(data)
    return data["choices"][0]["message"]["content"], usage


def extract_product(
    description: str,
    image_url: Optional[str] = None,
    image_base64: Optional[str] = None,
    *,
    telemetry: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    last_error = ""
    retry_hint = ""
    task_started_iso = _now_iso()
    task_started_at = perf_counter()
    model = os.getenv("AGENT_MODEL_PRODUCT_EXTRACT_MODEL", SILICONFLOW_IMAGE_MODEL).strip()

    for attempt in range(MAX_VISION_RETRIES):
        try:
            raw, usage = _call_vision_api(description, image_url, image_base64, retry_hint=retry_hint)
            data = parse_json(raw)
            product = validate_product(data)
            if telemetry is not None:
                telemetry.append(
                    {
                        "model": model,
                        "provider": "siliconflow",
                        "roleId": "productExtract",
                        "roleName": "产品提取角色",
                        "moduleId": "productExtract",
                        "startedAt": task_started_iso,
                        "finishedAt": _now_iso(),
                        "durationMs": _now_ms(task_started_at),
                        "inputTokens": (usage or {}).get("inputTokens"),
                        "outputTokens": (usage or {}).get("outputTokens"),
                        "totalTokens": (usage or {}).get("totalTokens"),
                        "status": "success",
                        "errorMessage": None,
                        "retryCount": attempt,
                    }
                )
            return product
        except (SchemaValidationError, ValueError, TypeError, KeyError) as exc:
            last_error = str(exc)
            retry_hint = last_error

    if telemetry is not None:
        telemetry.append(
            {
                "model": model,
                "provider": "siliconflow",
                "roleId": "productExtract",
                "roleName": "产品提取角色",
                "moduleId": "productExtract",
                "startedAt": task_started_iso,
                "finishedAt": _now_iso(),
                "durationMs": _now_ms(task_started_at),
                "inputTokens": None,
                "outputTokens": None,
                "totalTokens": None,
                "status": "failed",
                "errorMessage": last_error,
                "retryCount": MAX_VISION_RETRIES,
            }
        )
    raise ValueError(f"产品识图在 {MAX_VISION_RETRIES} 次尝试后仍未返回合格 JSON：{last_error}")
