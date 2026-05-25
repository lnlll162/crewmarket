"""运行单个 CrewAI Task 并解析、校验 JSON 输出。"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Any

from crewai import Agent, Crew, Process, Task

from schemas import SchemaValidationError, Validator, parse_json

MAX_TASK_RETRIES = 5
DEFAULT_TASK_TIMEOUT_SECONDS = 900


def run_json_task(
    agent: Agent,
    description: str,
    expected_output: str,
    validator: Validator,
    *,
    max_retries: int = MAX_TASK_RETRIES,
    timeout_seconds: int = DEFAULT_TASK_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    last_error = ""
    prompt = description

    for attempt in range(max_retries):
        task = Task(
            description=prompt,
            expected_output=expected_output,
            agent=agent,
        )
        crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)

        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(crew.kickoff)
                result = future.result(timeout=timeout_seconds)
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
            raise ValueError(f"Agent 在 {max_retries} 次尝试后仍未返回合格 JSON：{last_error}") from exc

        raw = result.raw if hasattr(result, "raw") else str(result)

        try:
            data = parse_json(raw)
            return validator(data)
        except (SchemaValidationError, ValueError, TypeError) as exc:
            last_error = str(exc)
            if attempt < max_retries - 1:
                prompt = (
                    f"{description}\n\n"
                    f"【上次输出不合格，第 {attempt + 2} 次重试】\n"
                    f"失败原因：{last_error}\n"
                    "请严格按 schema 重新输出完整 JSON，不要省略字段。"
                )

    raise ValueError(f"Agent 在 {max_retries} 次尝试后仍未返回合格 JSON：{last_error}")
