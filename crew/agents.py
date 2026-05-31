"""CrewAI Agent 定义 — 角色元数据来自 prompts.ROLE_DEFINITIONS。"""

from crewai import Agent

from llm import get_llm
from prompts import ROLE_DEFINITIONS, agent_backstory

_TASK_KEYS: dict[str, str] = {
    "marketResearch": "task.market_research",
    "content": "task.content_write",
    "seo": "task.seo_optimize",
    "social": "task.social_adapt",
    "merged": "task.result_merge",
    "pdfReport": "task.pdf_report",
}


def _agent(role_id: str) -> Agent:
    meta = ROLE_DEFINITIONS[role_id]
    return Agent(
        role=meta["role"],
        goal=meta["goal"],
        backstory=agent_backstory(role_id),
        llm=get_llm(_TASK_KEYS[role_id]),
        verbose=False,
        allow_delegation=False,
    )


def market_research_agent() -> Agent:
    return _agent("marketResearch")


def content_writer_agent() -> Agent:
    return _agent("content")


def seo_optimizer_agent() -> Agent:
    return _agent("seo")


def social_media_agent() -> Agent:
    return _agent("social")


def merge_coordinator_agent() -> Agent:
    return _agent("merged")


def pdf_report_agent() -> Agent:
    return _agent("pdfReport")
