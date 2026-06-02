"""硅基流动 HTTP 客户端。"""

from __future__ import annotations

import os
from typing import Any

import httpx

from siliconflow.registry import SILICONFLOW_BASE_URL

DEFAULT_TIMEOUT = httpx.Timeout(connect=30.0, read=600.0, write=30.0, pool=30.0)


def api_key() -> str:
    key = os.getenv("SILICONFLOW_API_KEY", "").strip()
    if not key:
        raise ValueError("未配置 SILICONFLOW_API_KEY")
    if key.lower() in {"your_siliconflow_api_key_here", "your_api_key_here", "changeme"}:
        raise ValueError("SILICONFLOW_API_KEY 仍是占位符，请替换为真实的硅基流动 API Key")
    return key


def base_url() -> str:
    return os.getenv("SILICONFLOW_BASE_URL", SILICONFLOW_BASE_URL).rstrip("/")


def auth_headers(*, json_content: bool = True) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {api_key()}"}
    if json_content:
        headers["Content-Type"] = "application/json"
    return headers


def get_json(path: str, *, params: dict[str, Any] | None = None) -> dict[str, Any]:
    with httpx.Client(timeout=DEFAULT_TIMEOUT, trust_env=True) as client:
        resp = client.get(
            f"{base_url()}{path}",
            headers=auth_headers(json_content=False),
            params=params or {},
        )
    if resp.status_code >= 400:
        raise ValueError(f"硅基流动 GET {path} 失败：{resp.status_code} {resp.text[:500]}")
    data = resp.json()
    return data if isinstance(data, dict) else {"data": data}


def post_json(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    with httpx.Client(timeout=DEFAULT_TIMEOUT, trust_env=True) as client:
        resp = client.post(
            f"{base_url()}{path}",
            headers=auth_headers(),
            json=payload,
        )
    if resp.status_code >= 400:
        raise ValueError(f"硅基流动 POST {path} 失败：{resp.status_code} {resp.text[:500]}")
    data = resp.json()
    return data if isinstance(data, dict) else {"raw": data}
