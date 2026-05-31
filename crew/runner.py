"""运行单个 CrewAI Task 并解析、校验 JSON 输出。"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from crewai import Agent, Crew, Process, Task

from schemas import SchemaValidationError, Validator, parse_json
from telemetry_usage import (
    capture_litellm_usage,
    extract_usage_from_llm,
    merge_usage,
    normalize_usage,
    usage_delta,
)

MAX_TASK_RETRIES = 5
DEFAULT_TASK_TIMEOUT_SECONDS = 900


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _now_ms(started_at: float) -> int:
    return max(0, int((perf_counter() - started_at) * 1000))


def _extract_usage_from_crew_result(result: Any) -> dict[str, int] | None:
    """从 CrewAI kickoff 返回对象提取 usage（LiteLLM 未回调时的兜底）。"""
    candidates: list[Any] = []
    for attr in ("usage", "usage_metrics", "token_usage", "llm_usage"):
        value = getattr(result, attr, None)
        if value is not None:
            candidates.append(value)
    if hasattr(result, "raw") and isinstance(result.raw, dict):
        for key in ("usage", "usage_metrics", "token_usage", "llm_usage"):
            if key in result.raw:
                candidates.append(result.raw[key])
        parsed = normalize_usage(result.raw)
        if parsed:
            candidates.append(parsed)

    for item in candidates:
        parsed = normalize_usage(item)
        if parsed and (parsed["totalTokens"] > 0 or parsed["inputTokens"] > 0 or parsed["outputTokens"] > 0):
            return parsed
    return None


def _resolve_task_usage(
    result: Any,
    *,
    llm_usage: dict[str, int] | None,
    collector_usage: dict[str, int] | None,
) -> dict[str, int] | None:
    return merge_usage(llm_usage, collector_usage, _extract_usage_from_crew_result(result))


def _record(
    telemetry: list[dict[str, Any]] | None,
    *,
    model: str | None,
    provider: str,
    role_id: str | None,
    role_name: str | None,
    module_id: str | None,
    started_at: str,
    finished_at: str | None,
    duration_ms: int,
    status: str,
    usage: dict[str, int] | None = None,
    error_message: str | None = None,
    retry_count: int | None = None,
) -> None:
    if telemetry is None:
        return
    telemetry.append(
        {
            "model": model or "unknown",
            "provider": provider,
            "roleId": role_id or "unknown",
            "roleName": role_name or "unknown",
            "moduleId": module_id or "custom",
            "startedAt": started_at,
            "finishedAt": finished_at,
            "durationMs": duration_ms,
            "inputTokens": (usage or {}).get("inputTokens"),
            "outputTokens": (usage or {}).get("outputTokens"),
            "totalTokens": (usage or {}).get("totalTokens"),
            "status": status,
            "errorMessage": error_message,
            "retryCount": retry_count,
        }
    )


def run_json_task(
    agent: Agent,
    description: str,
    expected_output: str,
    validator: Validator,
    *,
    max_retries: int = MAX_TASK_RETRIES,
    timeout_seconds: int = DEFAULT_TASK_TIMEOUT_SECONDS,
    telemetry: list[dict[str, Any]] | None = None,
    role_id: str | None = None,
    role_name: str | None = None,
    module_id: str | None = None,
    model: str | None = None,
    provider: str = "siliconflow",
) -> dict[str, Any]:
    last_error = ""
    prompt = description
    task_started_at = perf_counter()
    task_started_iso = _now_iso()

    for attempt in range(max_retries):
        task = Task(
            description=prompt,
            expected_output=expected_output,
            agent=agent,
        )
        crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)

        usage_before = extract_usage_from_llm(agent.llm)
        try:
            with capture_litellm_usage() as usage_collector:
                with ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(crew.kickoff)
                    result = future.result(timeout=timeout_seconds)
            usage = _resolve_task_usage(
                result,
                llm_usage=usage_delta(usage_before, extract_usage_from_llm(agent.llm)),
                collector_usage=usage_collector.aggregate(),
            )
        except FuturesTimeoutError as exc:
            last_error = f"任务执行超时（{timeout_seconds} 秒）"
            if attempt < max_retries - 1:
                prompt = (
                    f"{description}\n\n"
                    f"【上次执行超时，第 {attempt + 2} 次重试】\n"
                    f"失败原因：{last_error}\n"
                    "请严格按 schema 重新输出完整 JSON，不要省略字段。"
                )
                continue
            _record(
                telemetry,
                model=model,
                provider=provider,
                role_id=role_id,
                role_name=role_name,
                module_id=module_id,
                started_at=task_started_iso,
                finished_at=_now_iso(),
                duration_ms=_now_ms(task_started_at),
                status="timeout",
                error_message=last_error,
                retry_count=attempt,
            )
            raise ValueError(f"Agent 在 {max_retries} 次尝试后仍未返回合格 JSON：{last_error}") from exc

        raw = result.raw if hasattr(result, "raw") else str(result)

        try:
            data = parse_json(raw)
            validated = validator(data)
            _record(
                telemetry,
                model=model,
                provider=provider,
                role_id=role_id,
                role_name=role_name,
                module_id=module_id,
                started_at=task_started_iso,
                finished_at=_now_iso(),
                duration_ms=_now_ms(task_started_at),
                status="success",
                usage=usage,
                retry_count=attempt,
            )
            return {"data": validated, "raw": raw, "usage": usage, "attempts": attempt + 1}
        except (SchemaValidationError, ValueError, TypeError) as exc:
            last_error = str(exc)
            if attempt < max_retries - 1:
                prompt = (
                    f"{description}\n\n"
                    f"【上次输出不合格，第 {attempt + 2} 次重试】\n"
                    f"失败原因：{last_error}\n"
                    "请严格按 schema 重新输出完整 JSON，不要省略字段。"
                )

    _record(
        telemetry,
        model=model,
        provider=provider,
        role_id=role_id,
        role_name=role_name,
        module_id=module_id,
        started_at=task_started_iso,
        finished_at=_now_iso(),
        duration_ms=_now_ms(task_started_at),
        status="failed",
        error_message=last_error,
        retry_count=max_retries,
    )
    raise ValueError(f"Agent 在 {max_retries} 次尝试后仍未返回合格 JSON：{last_error}")
