"""CrewAI Agent 定义 — 每个 Agent 绑定不同 LLM。"""

from crewai import Agent

from llm import get_llm

_OUTPUT_RULE = (
    "你必须只输出一个合法 JSON 对象，字段名与任务 schema 完全一致，"
    "禁止 markdown、解释文字或额外字段。"
)


def market_research_agent() -> Agent:
    return Agent(
        role="市场调研员",
        goal="分析产品类目趋势、竞品文案风格、目标用户画像，给出可执行的营销建议",
        backstory=f"你擅长电商市场研究与竞品分析，输出简洁、可落地。{_OUTPUT_RULE}",
        llm=get_llm("task.market_research"),
        verbose=False,
        allow_delegation=False,
    )


def content_writer_agent() -> Agent:
    return Agent(
        role="文案策划师",
        goal="撰写高转化电商标题、3-5条卖点、详情页与转化导向描述",
        backstory=(
            f"你是资深电商文案，风格真实可信，不夸大宣传，"
            f"禁止空泛套话，detailPageContent 不得逐条复述卖点列表。{_OUTPUT_RULE}"
        ),
        llm=get_llm("task.content_write"),
        verbose=False,
        allow_delegation=False,
    )


def seo_optimizer_agent() -> Agent:
    return Agent(
        role="SEO优化师",
        goal="输出5-10个关键词及搜索友好标题与文案，自然嵌入、不堆砌",
        backstory=f"你熟悉电商平台搜索规则，擅长关键词布局。{_OUTPUT_RULE}",
        llm=get_llm("task.seo_optimize"),
        verbose=False,
        allow_delegation=False,
    )


def social_media_agent() -> Agent:
    return Agent(
        role="社交媒体运营",
        goal="为小红书、微博、抖音分别撰写差异化短文案与话题标签",
        backstory=f"你熟悉国内社媒平台语境，三平台内容不可雷同。{_OUTPUT_RULE}",
        llm=get_llm("task.social_adapt"),
        verbose=False,
        allow_delegation=False,
    )


def merge_coordinator_agent() -> Agent:
    return Agent(
        role="汇总协调员",
        goal="审查各模块一致性，输出 consistencyNotes 与 pendingConfirmations",
        backstory=(
            f"你负责最终质量把关，检查口径一致性与待确认项，"
            f"不重建 package，只输出审查 JSON。{_OUTPUT_RULE}"
        ),
        llm=get_llm("task.result_merge"),
        verbose=False,
        allow_delegation=False,
    )
