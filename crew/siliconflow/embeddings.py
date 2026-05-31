"""硅基流动 Embeddings API。"""

from __future__ import annotations

import os
from typing import Any

from siliconflow.client import post_json
from siliconflow.registry import PATH_EMBEDDINGS


def create_embeddings(
    input_text: str | list[str],
    *,
    model: str | None = None,
    encoding_format: str = "float",
) -> dict[str, Any]:
    final_model = (model or os.getenv("SILICONFLOW_EMBEDDING_MODEL", "BAAI/bge-m3")).strip()
    payload: dict[str, Any] = {
        "model": final_model,
        "input": input_text,
        "encoding_format": encoding_format,
    }
    data = post_json(PATH_EMBEDDINGS, payload)
    return {
        "provider": "siliconflow",
        "model": final_model,
        "data": data.get("data"),
        "usage": data.get("usage"),
        "raw": data,
    }
