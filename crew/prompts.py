"""结构化 Prompt 模板 — 可复用、可维护。"""

from __future__ import annotations

import json
from typing import Any

GLOBAL_RULES = """
【全局规则】
1. 只输出一个 JSON 对象，禁止 markdown 代码块、解释文字或多余字段。
2. 内容真实可信，禁止虚假夸大；未提供的信息不得编造具体参数（如续航小时数、防水等级）。
3. 信息不足时在对应字段标注 pending 或写入待确认说明，不要猜测硬参数。
4. 禁止空泛套话，例如：「欢迎来到未来」「开启新篇章」「不可或缺的良伴」「极致体验」。
5. 各模块口径一致，不得与产品属性矛盾。
""".strip()

MARKET_SCHEMA = """
{
  "marketTrends": "市场趋势总结（80-200字）",
  "competitorStyle": "竞品文案特点（60-150字）",
  "userPersona": "目标用户画像（60-150字）",
  "brandTone": "品牌调性建议（40-120字）",
  "visualStyle": "视觉风格建议（40-120字）",
  "marketingSuggestions": ["可执行建议1", "可执行建议2", "可执行建议3"]
}
""".strip()

CONTENT_SCHEMA = """
{
  "title": "商品标题（8-40字，含品类+1-2个核心差异点）",
  "sellingPointCopy": ["卖点1：特点 - 用户收益", "卖点2：...", "卖点3：..."],
  "detailPageContent": "详情页正文（150-400字，分场景描述，不得逐条复述 sellingPointCopy）",
  "conversionDescription": "转化短描述（15-50字，含明确行动号召）",
  "videoScript": "15-30秒短视频脚本（按镜头或分镜输出）",
  "posterCopy": {
    "headline": "海报主标题",
    "subheadline": "海报副标题",
    "slogan": "海报传播口号"
  }
}
""".strip()

SEO_SCHEMA = """
{
  "keywords": ["关键词1", "...共5-10个"],
  "optimizedTitle": "搜索优化标题（含核心关键词，8-50字）",
  "searchFriendlyCopy": "搜索友好文案（80-200字，自然嵌入关键词，不堆砌）",
  "channelAdaptation": {
    "xiaohongshu": "小红书适配文案（80-180字）",
    "weibo": "微博适配文案（60-140字）",
    "douyin": "抖音适配文案（50-120字）"
  }
}
""".strip()

SOCIAL_SCHEMA = """
{
  "copies": [
    {"platform": "xiaohongshu", "content": "小红书种草文案（80-180字，口语化）", "hashtags": ["#标签1", "#标签2"]},
    {"platform": "weibo", "content": "微博文案（60-140字，话题感）", "hashtags": ["#标签1", "#标签2"]},
    {"platform": "douyin", "content": "抖音口播文案（50-120字，节奏感）", "hashtags": ["#标签1", "#标签2"]}
  ],
  "scriptSuggestion": "15-30秒短视频分镜/口播建议"
}
""".strip()

MERGE_REVIEW_SCHEMA = """
{
  "consistencyNotes": ["一致性说明1", "说明2"],
  "pendingConfirmations": ["需用户确认项，无则空数组"]
}
""".strip()


def _dump(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False)


def market_research_prompt(product: dict[str, Any], options_text: str) -> str:
    return f"""{GLOBAL_RULES}

【任务】基于产品信息输出市场与竞品分析 JSON。

【输出 schema】
{MARKET_SCHEMA}

【要求】
- marketingSuggestions 至少 3 条，每条可执行、与产品相关。
- 结合补充选项中的目标人群、价格带、竞品信息（若有）。

【产品信息】
{_dump(product)}

【补充选项】
{options_text}"""


def content_write_prompt(
    product: dict[str, Any],
    market: dict[str, Any],
    options_text: str,
) -> str:
    selling_points = product.get("sellingPoints", {}).get("value", [])
    attributes = product.get("attributes", {}).get("value", [])
    return f"""{GLOBAL_RULES}

【任务】生成统一的营销内容与物料文案 JSON。

【输出 schema】
{CONTENT_SCHEMA}

【要求】
- sellingPointCopy 必须 3-5 条，格式「特点 - 用户收益」，基于已确认的产品属性。
- detailPageContent 按「使用场景 → 核心体验 → 适合人群 → 购买理由」组织，禁止逐条复制 sellingPointCopy。
- title 与 conversionDescription 必须有转化导向，但不夸大。
- videoScript 输出 15-30 秒短视频脚本，可按镜头/分镜/口播结构组织。
- posterCopy 要兼顾海报传播：headline 强吸睛，subheadline 补充卖点，slogan 简短有记忆点。
- 优先使用以下已提取信息：属性={_dump(attributes)}，卖点={_dump(selling_points)}。
- 结合市场分析中的品牌调性与视觉风格建议，保持文案口径一致。

【产品信息】
{_dump(product)}

【市场与品牌策略】
{_dump(market)}

【补充选项】
{options_text}"""


def seo_optimize_prompt(content: dict[str, Any], category: str) -> str:
    return f"""{GLOBAL_RULES}

【任务】对营销内容做渠道适配与 SEO 优化，只输出 JSON。

【输出 schema】
{SEO_SCHEMA}

【要求】
- keywords 5-10 个，覆盖品类词、功能词、场景词。
- optimizedTitle 与原文案 title 语义一致但更适合搜索，不要无关堆砌。
- searchFriendlyCopy 与 detailPageContent 互补，不要整段重复。
- channelAdaptation 中的三平台文案要与内容模块一致，但分别适配平台语气。

【原文案】
{_dump(content)}

【品类】
{category or "未指定"}"""


def social_adapt_prompt(product: dict[str, Any], content: dict[str, Any]) -> str:
    return f"""{GLOBAL_RULES}

【任务】改写社媒传播文案 JSON。

【输出 schema】
{SOCIAL_SCHEMA}

【要求】
- 必须包含 xiaohongshu、weibo、douyin 三个 platform，不可缺失或改名。
- 小红书偏种草分享，微博偏话题传播，抖音偏口播/短视频；三平台内容不可完全相同。
- 每条 hashtags 2-6 个，带 # 前缀。
- scriptSuggestion 给出 15-30 秒短视频结构建议。

【产品卖点】
{_dump(product.get("sellingPoints", {}))}

【电商文案】
{_dump(content)}"""


def merge_review_prompt(
    product: dict[str, Any],
    market: dict[str, Any],
    content: dict[str, Any],
    seo: dict[str, Any],
    social: dict[str, Any],
    existing_pending: list[str],
) -> str:
    return f"""{GLOBAL_RULES}

【任务】你是质量审核员。各模块已由系统组装为物料包，你只需做一致性审查并输出 JSON。

【输出 schema — 仅以下两个字段，禁止输出 package】
{MERGE_REVIEW_SCHEMA}

【审查要点】
1. 文案是否与产品属性、卖点一致？有无矛盾或夸大？
2. 各模块是否重复过多？如有，在 consistencyNotes 中说明。
3. 是否有未确认却当事实写的参数？如有，写入 pendingConfirmations。
4. consistencyNotes 2-5 条，简洁具体；无问题也要给出「已通过一致性检查」类说明。

【已有待确认项】
{_dump(existing_pending)}

【各模块数据】
product={_dump(product)}
market={_dump(market)}
content={_dump(content)}
seo={_dump(seo)}
social={_dump(social)}"""
