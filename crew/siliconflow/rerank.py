"""硅基流动 Rerank API。"""

from __future__ import annotations

import os
from typing import Any

from siliconflow.client import post_json
from siliconflow.registry import PATH_RERANK


def rerank_documents(
    query: str,
    documents: list[str],
    *,
    model: str | None = None,
    top_n: int | None = None,
    return_documents: bool = True,
    instruction: str | None = None,
) -> dict[str, Any]:
    final_model = (model or os.getenv("SILICONFLOW_RERANK_MODEL", "BAAI/bge-reranker-v2-m3")).strip()
    payload: dict[str, Any] = {
        "model": final_model,
        "query": query,
        "documents": documents,
        "return_documents": return_documents,
    }
    if top_n is not None:
        payload["top_n"] = top_n
    if instruction:
        payload["instruction"] = instruction
    data = post_json(PATH_RERANK, payload)
    return {
        "provider": "siliconflow",
        "model": final_model,
        "results": data.get("results"),
        "meta": data.get("meta"),
        "id": data.get("id"),
        "raw": data,
    }
