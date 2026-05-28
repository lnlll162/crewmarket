"""硅基流动图片/视频生成接入。"""

from __future__ import annotations

import os
import time
from typing import Any

import httpx

from config import (
    SILICONFLOW_BASE_URL,
    SILICONFLOW_IMAGE_MODEL,
    SILICONFLOW_IMAGE_PATH,
    SILICONFLOW_VIDEO_MODEL,
    SILICONFLOW_VIDEO_STATUS_PATH,
    SILICONFLOW_VIDEO_SUBMIT_PATH,
)

DEFAULT_TIMEOUT = httpx.Timeout(connect=30.0, read=600.0, write=30.0, pool=30.0)
DEFAULT_VIDEO_POLL_INTERVAL = float(os.getenv("AGENT_VIDEO_POLL_INTERVAL", "3"))
DEFAULT_VIDEO_POLL_TIMEOUT = float(os.getenv("AGENT_VIDEO_POLL_TIMEOUT", "600"))


def _api_key() -> str:
    api_key = os.getenv("SILICONFLOW_API_KEY", "").strip()
    if not api_key:
        raise ValueError("未配置 SILICONFLOW_API_KEY")
    if api_key.lower() in {"your_siliconflow_api_key_here", "your_api_key_here", "changeme"}:
        raise ValueError("SILICONFLOW_API_KEY 仍是占位符，请替换为真实的硅基流动 API Key")
    return api_key


def _post_json(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    api_key = _api_key()
    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        resp = client.post(
            f"{SILICONFLOW_BASE_URL}{path}",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
    if resp.status_code >= 400:
        raise ValueError(f"硅基流动生成请求失败：{resp.status_code} {resp.text[:500]}")
    return resp.json()


def _get_json(path: str, params: dict[str, Any]) -> dict[str, Any]:
    api_key = _api_key()
    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        resp = client.get(
            f"{SILICONFLOW_BASE_URL}{path}",
            headers={"Authorization": f"Bearer {api_key}"},
            params=params,
        )
    if resp.status_code >= 400:
        raise ValueError(f"硅基流动状态查询失败：{resp.status_code} {resp.text[:500]}")
    return resp.json()


def _image_payload(prompt: str, model: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "image_size": os.getenv("AGENT_IMAGE_SIZE", "1024x1024"),
        "batch_size": int(os.getenv("AGENT_IMAGE_BATCH_SIZE", "1")),
        "num_inference_steps": int(os.getenv("AGENT_IMAGE_STEPS", "20")),
        "guidance_scale": float(os.getenv("AGENT_IMAGE_GUIDANCE_SCALE", "7.5")),
    }
    negative_prompt = os.getenv("AGENT_IMAGE_NEGATIVE_PROMPT", "").strip()
    if negative_prompt:
        payload["negative_prompt"] = negative_prompt
    cfg = os.getenv("AGENT_IMAGE_CFG", "").strip()
    if cfg:
        payload["cfg"] = float(cfg)
    for key in ("image", "image2", "image3"):
        value = os.getenv(f"AGENT_{key.upper()}", "").strip()
        if value:
            payload[key] = value
    return payload


def _video_payload(prompt: str, model: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "image_size": os.getenv("AGENT_VIDEO_SIZE", "1280x720"),
    }
    negative_prompt = os.getenv("AGENT_VIDEO_NEGATIVE_PROMPT", "").strip()
    if negative_prompt:
        payload["negative_prompt"] = negative_prompt
    seed = os.getenv("AGENT_VIDEO_SEED", "").strip()
    if seed:
        payload["seed"] = int(seed)
    image = os.getenv("AGENT_VIDEO_IMAGE", "").strip()
    if image:
        payload["image"] = image
    return payload


def _normalize_image_response(data: dict[str, Any]) -> dict[str, Any]:
    images = data.get("images")
    if not isinstance(images, list) or not images:
        raise ValueError(f"硅基流动图片接口返回缺少 images 数组：{data}")
    urls = []
    for item in images:
        if isinstance(item, dict):
            url = item.get("url")
            if isinstance(url, str) and url.strip():
                urls.append(url.strip())
    if not urls:
        raise ValueError(f"硅基流动图片接口返回的 images 中缺少 url：{data}")
    return {"status": "generated", "images": [{"url": url} for url in urls], "url": urls[0], "timings": data.get("timings"), "seed": data.get("seed"), "provider": "siliconflow"}


def _normalize_video_submit_response(data: dict[str, Any]) -> dict[str, Any]:
    request_id = data.get("requestId")
    if not isinstance(request_id, str) or not request_id.strip():
        raise ValueError(f"硅基流动视频接口返回缺少 requestId：{data}")
    return {"status": "submitted", "requestId": request_id.strip(), "provider": "siliconflow"}


def _extract_video_url(data: dict[str, Any]) -> str | None:
    for key in ("video", "url", "outputUrl", "output_url"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    result = data.get("result")
    if isinstance(result, dict):
        for key in ("video", "url", "outputUrl", "output_url"):
            value = result.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None


def _normalize_video_status_response(data: dict[str, Any], request_id: str) -> dict[str, Any]:
    status = data.get("status")
    if not isinstance(status, str) or not status.strip():
        status = "processing"
    result: dict[str, Any] = {"status": status.strip(), "requestId": request_id, "provider": "siliconflow", "raw": data}
    video_url = _extract_video_url(data)
    if video_url:
        result["url"] = video_url
    if data.get("seed") is not None:
        result["seed"] = data.get("seed")
    if data.get("timings") is not None:
        result["timings"] = data.get("timings")
    return result


def generate_image(prompt: str, *, model: str | None = None) -> dict[str, Any]:
    final_model = (model or os.getenv("AGENT_IMAGE_MODEL", SILICONFLOW_IMAGE_MODEL)).strip()
    payload = _image_payload(prompt, final_model)
    data = _post_json(SILICONFLOW_IMAGE_PATH, payload)
    result = _normalize_image_response(data)
    result.update({"prompt": prompt, "model": final_model, "raw": data})
    return result


def submit_video(prompt: str, *, model: str | None = None) -> dict[str, Any]:
    final_model = (model or os.getenv("AGENT_VIDEO_MODEL", SILICONFLOW_VIDEO_MODEL)).strip()
    payload = _video_payload(prompt, final_model)
    data = _post_json(SILICONFLOW_VIDEO_SUBMIT_PATH, payload)
    result = _normalize_video_submit_response(data)
    result.update({"prompt": prompt, "model": final_model, "raw": data})
    return result


def poll_video_status(request_id: str) -> dict[str, Any]:
    data = _get_json(SILICONFLOW_VIDEO_STATUS_PATH, {"requestId": request_id})
    return _normalize_video_status_response(data, request_id)


def generate_video(prompt: str, *, model: str | None = None) -> dict[str, Any]:
    submission = submit_video(prompt, model=model)
    return {
        **submission,
        "status": "submitted",
        "message": "视频任务已提交，等待后台轮询或前端轮询状态接口",
        "polling": {
            "interval": DEFAULT_VIDEO_POLL_INTERVAL,
            "timeout": DEFAULT_VIDEO_POLL_TIMEOUT,
        },
    }
