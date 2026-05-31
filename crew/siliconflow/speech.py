"""硅基流动 TTS（/audio/speech）。"""

from __future__ import annotations

import os
from typing import Any

import httpx

from siliconflow.client import api_key, base_url, auth_headers
from siliconflow.registry import SILICONFLOW_BASE_URL

PATH_SPEECH = "/audio/speech"

DEFAULT_TIMEOUT = httpx.Timeout(connect=30.0, read=300.0, write=30.0, pool=30.0)


def create_speech(
    text: str,
    *,
    model: str | None = None,
    voice: str | None = None,
    response_format: str = "mp3",
    stream: bool = False,
) -> dict[str, Any]:
    final_model = (model or os.getenv("SILICONFLOW_SPEECH_MODEL", "fnlp/MOSS-TTSD-v0.5")).strip()
    payload: dict[str, Any] = {
        "model": final_model,
        "input": text,
        "response_format": response_format,
        "stream": stream,
    }
    if voice:
        payload["voice"] = voice
    elif final_model.startswith("fnlp/MOSS-TTSD"):
        payload["voice"] = f"{final_model}:alex"

    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        resp = client.post(
            f"{base_url()}{PATH_SPEECH}",
            headers=auth_headers(),
            json=payload,
        )
    if resp.status_code >= 400:
        raise ValueError(f"硅基流动 TTS 失败：{resp.status_code} {resp.text[:500]}")

    content_type = resp.headers.get("content-type", "")
    if "application/json" in content_type:
        data = resp.json()
        return {"provider": "siliconflow", "model": final_model, "format": response_format, "raw": data}

    import base64

    audio_b64 = base64.b64encode(resp.content).decode("ascii")
    return {
        "provider": "siliconflow",
        "model": final_model,
        "format": response_format,
        "audioBase64": audio_b64,
        "byteLength": len(resp.content),
    }
