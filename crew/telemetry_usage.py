"""采集 LLM token usage：优先读 CrewAI LLM 累计值，兜底 patch LiteLLM completion。"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

import litellm


def normalize_usage(source: Any) -> dict[str, int] | None:
    """将 usage 对象/字典规范为 inputTokens / outputTokens / totalTokens。"""
    if source is None:
        return None

    usage: Any = None
    if isinstance(source, dict):
        usage = source.get("usage") or source.get("usage_metrics") or source.get("token_usage")
        if usage is None and any(
            key in source
            for key in (
                "prompt_tokens",
                "input_tokens",
                "completion_tokens",
                "output_tokens",
                "inputTokens",
            )
        ):
            usage = source
    else:
        for attr in ("usage", "usage_metrics", "token_usage"):
            value = getattr(source, attr, None)
            if value is not None:
                usage = value
                break

    if usage is None:
        return None

    if hasattr(usage, "model_dump"):
        usage = usage.model_dump()
    elif not isinstance(usage, dict):
        usage = {
            "prompt_tokens": getattr(usage, "prompt_tokens", None),
            "completion_tokens": getattr(usage, "completion_tokens", None),
            "total_tokens": getattr(usage, "total_tokens", None),
            "input_tokens": getattr(usage, "input_tokens", None),
            "output_tokens": getattr(usage, "output_tokens", None),
        }

    input_tokens = usage.get("prompt_tokens") or usage.get("input_tokens") or usage.get("inputTokens")
    output_tokens = (
        usage.get("completion_tokens") or usage.get("output_tokens") or usage.get("outputTokens")
    )
    total_tokens = usage.get("total_tokens") or usage.get("totalTokens")
    if total_tokens is None and input_tokens is not None and output_tokens is not None:
        total_tokens = int(input_tokens) + int(output_tokens)

    if input_tokens is None and output_tokens is None and total_tokens is None:
        return None

    return {
        "inputTokens": int(input_tokens) if input_tokens is not None else 0,
        "outputTokens": int(output_tokens) if output_tokens is not None else 0,
        "totalTokens": int(total_tokens) if total_tokens is not None else 0,
    }


def merge_usage(*sources: dict[str, int] | None) -> dict[str, int] | None:
    """合并多个 usage 源，优先保留有 token 数据的项。"""
    merged: dict[str, int] | None = None
    for source in sources:
        if not source:
            continue
        total = int(source.get("totalTokens") or 0)
        if total <= 0 and not source.get("inputTokens") and not source.get("outputTokens"):
            continue
        if merged is None:
            merged = dict(source)
            continue
        merged["inputTokens"] = int(merged.get("inputTokens") or 0) + int(source.get("inputTokens") or 0)
        merged["outputTokens"] = int(merged.get("outputTokens") or 0) + int(source.get("outputTokens") or 0)
        merged["totalTokens"] = int(merged.get("totalTokens") or 0) + int(source.get("totalTokens") or 0)
    return merged


def extract_usage_from_llm(llm: Any) -> dict[str, int] | None:
    """读取 CrewAI LLM 在 kickoff 后累计的 _token_usage。"""
    if llm is None:
        return None
    for attr in ("_token_usage", "token_usage"):
        parsed = normalize_usage(getattr(llm, attr, None))
        if parsed and (parsed["totalTokens"] > 0 or parsed["inputTokens"] > 0 or parsed["outputTokens"] > 0):
            return parsed
    return None


def usage_delta(
    before: dict[str, int] | None,
    after: dict[str, int] | None,
) -> dict[str, int] | None:
    """计算单次 kickoff 相对之前的 token 增量（支持重试累计）。"""
    if not after:
        return None
    if not before:
        return after
    return {
        "inputTokens": max(0, after["inputTokens"] - before["inputTokens"]),
        "outputTokens": max(0, after["outputTokens"] - before["outputTokens"]),
        "totalTokens": max(0, after["totalTokens"] - before["totalTokens"]),
    }


class _UsageCapture:
    def __init__(self) -> None:
        self._entries: list[dict[str, int]] = []

    def _append(self, response: Any) -> None:
        usage = normalize_usage(response)
        if usage and (usage["totalTokens"] > 0 or usage["inputTokens"] > 0 or usage["outputTokens"] > 0):
            self._entries.append(usage)

    def aggregate(self) -> dict[str, int] | None:
        if not self._entries:
            return None
        return {
            "inputTokens": sum(item["inputTokens"] for item in self._entries),
            "outputTokens": sum(item["outputTokens"] for item in self._entries),
            "totalTokens": sum(item["totalTokens"] for item in self._entries),
        }


@contextmanager
def capture_litellm_usage() -> Iterator[_UsageCapture]:
    """临时包装 litellm.completion / acompletion，从响应体直接提取 usage。"""
    capture = _UsageCapture()
    original_completion = litellm.completion
    original_acompletion = litellm.acompletion

    def completion_wrapper(*args: Any, **kwargs: Any) -> Any:
        response = original_completion(*args, **kwargs)
        capture._append(response)
        return response

    async def acompletion_wrapper(*args: Any, **kwargs: Any) -> Any:
        response = await original_acompletion(*args, **kwargs)
        capture._append(response)
        return response

    litellm.completion = completion_wrapper  # type: ignore[method-assign]
    litellm.acompletion = acompletion_wrapper  # type: ignore[method-assign]
    try:
        yield capture
    finally:
        litellm.completion = original_completion  # type: ignore[method-assign]
        litellm.acompletion = original_acompletion  # type: ignore[method-assign]
