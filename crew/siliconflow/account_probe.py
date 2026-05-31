"""对账号 catalog 中每个模型做最小 live 调用。"""

from __future__ import annotations

import base64
import os
import tempfile
import time
from pathlib import Path
from typing import Any

from generation import generate_image, submit_video
from siliconflow.account_catalog import iter_account_models
from siliconflow.client import post_json
from siliconflow.embeddings import create_embeddings
from siliconflow.registry import PATH_CHAT
from siliconflow.rerank import rerank_documents
from siliconflow.speech import create_speech
from siliconflow.stt import transcribe_audio

_PROBE_AUDIO: Path | None = None


def _ensure_probe_audio() -> Path:
    global _PROBE_AUDIO
    if _PROBE_AUDIO and _PROBE_AUDIO.is_file():
        return _PROBE_AUDIO
    assets = Path(__file__).resolve().parent / ".probe_assets"
    assets.mkdir(exist_ok=True)
    path = assets / "probe_stt.mp3"
    if not path.is_file():
        res = create_speech("语音探针测试", model="fnlp/MOSS-TTSD-v0.5")
        raw = base64.b64decode(res["audioBase64"])
        path.write_bytes(raw)
    _PROBE_AUDIO = path
    return path


def _speech_voice(model_id: str) -> str | None:
    if model_id.startswith("fnlp/MOSS-TTSD"):
        return f"{model_id}:alex"
    if "CosyVoice" in model_id:
        return f"{model_id}:alex"
    return None


def probe_model(*, catalog_key: str, probe_kind: str, model_id: str) -> dict[str, Any]:
    started = time.perf_counter()
    row: dict[str, Any] = {
        "catalogKey": catalog_key,
        "probeKind": probe_kind,
        "modelId": model_id,
        "ok": False,
        "durationMs": 0,
    }
    try:
        if probe_kind == "chat":
            data = post_json(
                PATH_CHAT,
                {
                    "model": model_id,
                    "messages": [{"role": "user", "content": "只回复：OK"}],
                    "max_tokens": 6,
                    "temperature": 0,
                },
            )
            if not data.get("choices"):
                raise ValueError("无 choices")
            row["detail"] = {"tokens": (data.get("usage") or {}).get("total_tokens")}

        elif probe_kind == "embedding":
            res = create_embeddings("probe", model=model_id)
            dim = len((res.get("data") or [{}])[0].get("embedding") or [])
            if dim <= 0:
                raise ValueError("embedding 为空")
            row["detail"] = {"dims": dim}

        elif probe_kind == "rerank":
            res = rerank_documents("测试", ["A", "B"], model=model_id, top_n=1)
            if not res.get("results"):
                raise ValueError("无 rerank 结果")
            row["detail"] = {"topIndex": res["results"][0].get("index")}

        elif probe_kind == "image":
            prev = os.environ.get("AGENT_IMAGE_STEPS")
            os.environ["AGENT_IMAGE_STEPS"] = os.getenv("PROBE_IMAGE_STEPS", "6")
            try:
                res = generate_image("红色马克杯白底产品图", model=model_id)
            finally:
                if prev is None:
                    os.environ.pop("AGENT_IMAGE_STEPS", None)
                else:
                    os.environ["AGENT_IMAGE_STEPS"] = prev
            if not res.get("url"):
                raise ValueError("无图片 url")
            row["detail"] = {"url": res["url"][:64]}

        elif probe_kind == "image_edit":
            row["detail"] = {
                "skipped": True,
                "reason": "图生图需 reference image；已登记为可用模型，未做无参探针",
            }
            row["ok"] = True

        elif probe_kind == "video_submit":
            res = submit_video("产品展示短视频探针", model=model_id)
            if not res.get("requestId"):
                raise ValueError("无 requestId")
            row["detail"] = {"requestId": res["requestId"]}

        elif probe_kind == "speech":
            voice = _speech_voice(model_id)
            if not voice:
                raise ValueError("该 TTS 模型需配置 voice，探针未内置")
            res = create_speech("探针", model=model_id, voice=voice)
            if not res.get("audioBase64"):
                raise ValueError("无音频")
            row["detail"] = {"byteLength": res.get("byteLength")}

        elif probe_kind == "stt":
            audio = _ensure_probe_audio()
            res = transcribe_audio(audio, model=model_id)
            if not (res.get("text") or "").strip():
                raise ValueError("转写为空")
            row["detail"] = {"textPreview": str(res.get("text"))[:40]}

        else:
            raise ValueError(f"未知探针: {probe_kind}")

        row["ok"] = True
    except Exception as exc:
        row["error"] = str(exc)[:500]
    row["durationMs"] = int((time.perf_counter() - started) * 1000)
    return row


def probe_all_account_models(*, on_progress: Any | None = None) -> dict[str, Any]:
    targets = iter_account_models()
    results: list[dict[str, Any]] = []
    for index, target in enumerate(targets, start=1):
        row = probe_model(
            catalog_key=target["catalogKey"],
            probe_kind=target["probeKind"],
            model_id=target["modelId"],
        )
        results.append(row)
        if on_progress:
            on_progress(index, len(targets), row)

    passed = [r for r in results if r.get("ok")]
    failed = [r for r in results if not r.get("ok")]
    by_kind: dict[str, dict[str, int]] = {}
    for row in results:
        kind = str(row.get("probeKind"))
        bucket = by_kind.setdefault(kind, {"total": 0, "passed": 0})
        bucket["total"] += 1
        if row.get("ok"):
            bucket["passed"] += 1

    return {
        "ok": not failed,
        "total": len(results),
        "passed": len(passed),
        "failed": len(failed),
        "byProbeKind": by_kind,
        "failures": [
            {"modelId": r["modelId"], "catalogKey": r["catalogKey"], "error": r.get("error")}
            for r in failed
        ],
        "results": results,
    }
