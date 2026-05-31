"""硅基流动语音转文本（/audio/transcriptions）。"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import httpx

from siliconflow.client import api_key, base_url
from siliconflow.registry import SILICONFLOW_BASE_URL

PATH_TRANSCRIPTIONS = "/audio/transcriptions"

DEFAULT_TIMEOUT = httpx.Timeout(connect=30.0, read=300.0, write=30.0, pool=30.0)


def transcribe_audio(
    file_path: str | Path,
    *,
    model: str | None = None,
) -> dict[str, Any]:
    final_model = (model or os.getenv("SILICONFLOW_STT_MODEL", "FunAudioLLM/SenseVoiceSmall")).strip()
    path = Path(file_path)
    if not path.is_file():
        raise ValueError(f"音频文件不存在：{path}")

    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        with path.open("rb") as audio_file:
            resp = client.post(
                f"{base_url()}{PATH_TRANSCRIPTIONS}",
                headers={"Authorization": f"Bearer {api_key()}"},
                data={"model": final_model},
                files={"file": (path.name, audio_file, "application/octet-stream")},
            )
    if resp.status_code >= 400:
        raise ValueError(f"硅基流动 STT 失败：{resp.status_code} {resp.text[:500]}")
    data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"text": resp.text}
    return {"provider": "siliconflow", "model": final_model, "text": data.get("text"), "raw": data}
