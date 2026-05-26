"""CrewAI Agent 定义 — 对齐精简版营销链路。"""

from crewai import Agent

from llm import get_llm

_OUTPUT_RULE = (
    "你必须只输出一个合法 JSON 对象，字段名与任务 schema 完全一致，"
    "禁止 markdown、解释文字或额外字段。"
)


def market_research_agent() -> Agent:
    return Agent(
        role="市场与品牌策略师",
        goal="分析产品类目趋势、竞品风格、目标用户画像，并给出品牌调性与视觉风格建议",
        backstory=(
            f"你擅长电商市场研究、品牌定位和风格提炼，输出简洁、可落地。{_OUTPUT_RULE}"
        ),
        llm=get_llm("task.market_research"),
        verbose=False,
        allow_delegation=False,
    )


def content_writer_agent() -> Agent:
    return Agent(
        role="营销内容生成师",
        goal="撰写高转化标题、卖点、详情页、SEO 文案、社媒适配文案、视频脚本与海报文案",
        backstory=(
            f"你是资深电商营销文案，风格真实可信，不夸大宣传，"
            f"禁止空泛套话，且要兼顾不同营销物料的统一口径。{_OUTPUT_RULE}"
        ),
        llm=get_llm("task.content_write"),
        verbose=False,
        allow_delegation=False,
    )


def seo_optimizer_agent() -> Agent:
    return Agent(
        role="渠道适配与搜索优化师",
        goal="输出关键词、搜索友好标题、搜索文案，并生成多平台适配文案",
        backstory=f"你熟悉电商平台搜索与内容分发规则，擅长关键词布局与平台适配。{_OUTPUT_RULE}",
        llm=get_llm("task.seo_optimize"),
        verbose=False,
        allow_delegation=False,
    )


def social_media_agent() -> Agent:
    return Agent(
        role="营销物料适配师",
        goal="为各平台提供差异化短文案、话题标签与短视频脚本建议",
        backstory=f"你熟悉国内社媒平台语境与短视频传播逻辑，三平台内容不可雷同。{_OUTPUT_RULE}",
        llm=get_llm("task.social_adapt"),
        verbose=False,
        allow_delegation=False,
    )


def merge_coordinator_agent() -> Agent:
    return Agent(
        role="营销结果审核员",
        goal="审查各模块一致性，输出一致性建议与待确认项",
        backstory=(
            f"你负责最终质量把关，检查口径一致性与待确认项，"
            f"不重建 package，只输出审查 JSON。{_OUTPUT_RULE}"
        ),
        llm=get_llm("task.result_merge"),
        verbose=False,
        allow_delegation=False,
    )
