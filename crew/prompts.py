"""结构化 Prompt 模板 — 可复用、可维护。"""

from __future__ import annotations

import json
from typing import Any, TypedDict

# 与 app/lib/prompts.ts ROLE_PROMPTS.*.version 保持一致
PROMPT_VERSIONS: dict[str, str] = {
    "productExtract": "v1.0.0",
    "marketResearch": "v1.0.0",
    "content": "v1.0.0",
    "seo": "v1.0.0",
    "social": "v1.0.0",
    "merged": "v1.0.0",
    "pdfReport": "v1.0.0",
}

PROMPT_CHANGELOG: dict[str, list[str]] = {
    "productExtract": ["v1.0.0: 初始化固定产品提取提示词与输出规则"],
    "marketResearch": ["v1.0.0: 初始化固定市场分析提示词与输出规则"],
    "content": ["v1.0.0: 初始化固定文案生成提示词，覆盖海报与视频素材"],
    "seo": ["v1.0.0: 初始化固定 SEO 与渠道适配提示词"],
    "social": ["v1.0.0: 初始化固定社媒改写提示词"],
    "merged": ["v1.0.0: 初始化固定汇总评估提示词"],
    "pdfReport": ["v1.0.0: 初始化固定 PDF 报告撰写提示词"],
}

OUTPUT_RULE = (
    "你必须只输出一个合法 JSON 对象，字段名与任务 schema 完全一致，"
    "禁止 markdown、解释文字或额外字段。"
)


class RoleDefinition(TypedDict):
    roleId: str
    roleName: str
    version: str
    telemetryTag: str
    role: str
    goal: str
    systemPrompt: str
    inputContract: list[str]
    outputContract: list[str]
    modelPreference: str
    allowedTools: list[str]


# 单一真相源：CrewAI Agent + 前端 ROLE_PROMPTS + telemetry roleId 对齐
ROLE_DEFINITIONS: dict[str, RoleDefinition] = {
    "productExtract": {
        "roleId": "productExtract",
        "roleName": "产品提取角色",
        "version": "v1.0.0",
        "telemetryTag": "product_extract",
        "role": "产品信息提取专家",
        "goal": "从文本与图片中提取品类、属性、卖点与待确认字段",
        "systemPrompt": (
            "你是产品信息提取专家，负责从文本和图片中提取商品的基础信息、"
            "结构化卖点和可用于后续分析的关键属性。"
        ),
        "inputContract": ["description", "image assets", "productName optional", "category optional"],
        "outputContract": ["productName", "category", "attributes", "sellingPoints", "summary"],
        "modelPreference": "Qwen/Qwen3-VL-32B-Instruct",
        "allowedTools": [],
    },
    "marketResearch": {
        "roleId": "marketResearch",
        "roleName": "市场分析角色",
        "version": "v1.0.0",
        "telemetryTag": "market_research",
        "role": "市场与品牌策略师",
        "goal": "分析产品类目趋势、竞品风格、目标用户画像，并给出品牌调性与视觉风格建议",
        "systemPrompt": "你擅长电商市场研究、品牌定位和风格提炼，输出简洁、可落地。",
        "inputContract": ["product extract result", "user options"],
        "outputContract": ["marketTrends", "competitorStyle", "userPersona", "brandTone", "visualStyle", "marketingSuggestions"],
        "modelPreference": "deepseek-ai/DeepSeek-V3",
        "allowedTools": [],
    },
    "content": {
        "roleId": "content",
        "roleName": "文案生成角色",
        "version": "v1.0.0",
        "telemetryTag": "content_write",
        "role": "营销内容生成师",
        "goal": "撰写高转化标题、卖点、详情页、海报文案、图片创意、视频脚本与视频素材",
        "systemPrompt": (
            "你是资深电商营销文案，风格真实可信，不夸大宣传，"
            "禁止空泛套话，且要兼顾不同营销物料的统一口径。"
        ),
        "inputContract": ["product extract result", "market research result", "user options"],
        "outputContract": ["title", "sellingPointCopy", "detailPageContent", "conversionDescription", "videoScript", "posterCopy", "imageIdeas", "videoMaterial", "imageGeneration", "videoGeneration"],
        "modelPreference": "Qwen/Qwen2.5-72B-Instruct",
        "allowedTools": [],
    },
    "seo": {
        "roleId": "seo",
        "roleName": "SEO 优化角色",
        "version": "v1.0.0",
        "telemetryTag": "seo_optimize",
        "role": "渠道适配与搜索优化师",
        "goal": "输出关键词、搜索友好标题、搜索文案，并生成多平台适配文案",
        "systemPrompt": "你熟悉电商平台搜索与内容分发规则，擅长关键词布局与平台适配。",
        "inputContract": ["content result", "category optional"],
        "outputContract": ["keywords", "optimizedTitle", "searchFriendlyCopy", "channelAdaptation"],
        "modelPreference": "THUDM/GLM-4-32B-0414",
        "allowedTools": [],
    },
    "social": {
        "roleId": "social",
        "roleName": "社媒改写角色",
        "version": "v1.0.0",
        "telemetryTag": "social_adapt",
        "role": "营销物料适配师",
        "goal": "为各平台提供差异化短文案、话题标签与短视频脚本建议",
        "systemPrompt": "你熟悉国内社媒平台语境与短视频传播逻辑，三平台内容不可雷同。",
        "inputContract": ["product extract result", "content result"],
        "outputContract": ["copies", "scriptSuggestion"],
        "modelPreference": "Qwen/Qwen2.5-32B-Instruct",
        "allowedTools": [],
    },
    "merged": {
        "roleId": "merged",
        "roleName": "汇总评估角色",
        "version": "v1.0.0",
        "telemetryTag": "result_merge",
        "role": "汇总评估官",
        "goal": "基于 PipelineSummaryInput 输出结构化评估结论（executiveSummary、风险、机会、建议）",
        "systemPrompt": (
            "你是 CrewMarket 汇总评估模型，只综合已有模块结果与 telemetry，"
            "不重新生成业务物料。"
        ),
        "inputContract": ["module results", "role runs", "telemetry", "constraints"],
        "outputContract": ["executiveSummary", "moduleSummary", "roleEvaluation", "performanceReview", "riskAssessment", "opportunityAnalysis", "recommendations", "pdfHighlights", "confidence", "missingInfo"],
        "modelPreference": "deepseek-ai/DeepSeek-V3",
        "allowedTools": [],
    },
    "pdfReport": {
        "roleId": "pdfReport",
        "roleName": "PDF 报告撰写角色",
        "version": "v1.0.0",
        "telemetryTag": "pdf_report",
        "role": "PDF 专业报告撰写官",
        "goal": "将评估结论与过程记录改写为适合管理层阅读、可直接导出 PDF 的分章节报告",
        "systemPrompt": (
            "你擅长撰写结构清晰、语气专业、可打印的评估报告。"
            "只基于输入的 summary 与 modules 扩写，不编造事实。"
        ),
        "inputContract": ["summary output", "telemetry", "task context"],
        "outputContract": ["reportTitle", "subtitle", "generatedAt", "pipelineId", "promptVersion", "confidence", "coverHighlights", "sections", "telemetrySnapshot", "disclaimer"],
        "modelPreference": "deepseek-ai/DeepSeek-V3",
        "allowedTools": [],
    },
}


def agent_backstory(role_id: str) -> str:
    meta = ROLE_DEFINITIONS[role_id]
    return f"{meta['systemPrompt']}{OUTPUT_RULE}"


def role_meta(role_id: str) -> RoleDefinition:
    return ROLE_DEFINITIONS[role_id]


def role_contract(role_id: str) -> dict[str, Any]:
    meta = ROLE_DEFINITIONS[role_id]
    return {
        "roleId": meta["roleId"],
        "roleName": meta["roleName"],
        "version": meta["version"],
        "telemetryTag": meta["telemetryTag"],
        "modelPreference": meta["modelPreference"],
        "inputContract": meta["inputContract"],
        "outputContract": meta["outputContract"],
        "allowedTools": meta["allowedTools"],
    }


def prompt_changelog(role_id: str) -> list[str]:
    return PROMPT_CHANGELOG.get(role_id, [])

GLOBAL_RULES = """
【全局规则】
1. 只输出一个 JSON 对象，禁止 markdown 代码块、解释文字或多余字段。
2. 内容真实可信，禁止虚假夸大；未提供的信息不得编造具体参数（如续航小时数、防水等级）。
3. 信息不足时在对应字段标注 pending 或写入待确认说明，不要猜测硬参数。
4. 禁止空泛套话，例如：「欢迎来到未来」「开启新篇章」「不可或缺的良伴」「极致体验」。
5. 各模块口径一致，不得与产品属性矛盾。
6. 所有文字输出必须使用中文，包括但不限于字段值、描述、建议、分析结论等。
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
  },
  "imageIdeas": [
    {
      "title": "主图/海报/场景图创意标题",
      "description": "画面主体、背景、构图、氛围、需要突出的产品卖点",
      "usage": "适用场景，如商品主图、详情页、社媒配图、短视频封面"
    }
  ],
  "videoMaterial": {
    "hook": "短视频开场钩子",
    "scenes": ["镜头1：画面 + 动作 + 卖点", "镜头2：画面 + 动作 + 卖点"],
    "voiceover": "完整口播文案",
    "caption": "字幕/封面文案"
  },
  "imageGeneration": {
    "status": "pending | generated | failed",
    "prompt": "用于图像模型的完整提示词",
    "model": "可选：图像模型名",
    "provider": "可选：siliconflow 等",
    "url": "可选：首张生成结果 URL",
    "urls": ["可选：生成结果 URL 列表"],
    "error": "可选：错误说明"
  },
  "videoGeneration": {
    "status": "pending | generated | failed",
    "prompt": "用于视频模型的完整提示词",
    "model": "可选：视频模型名",
    "provider": "可选：siliconflow 等",
    "url": "可选：首个生成结果 URL",
    "urls": ["可选：生成结果 URL 列表"],
    "error": "可选：错误说明"
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

PIPELINE_SUMMARY_SCHEMA = """
{
  "executiveSummary": "150-400字高层总结：整体质量、亮点、主要风险与待办",
  "moduleSummary": [
    {
      "moduleId": "productExtract",
      "moduleName": "产品提取",
      "title": "模块标题",
      "summary": "该模块核心结论（60-150字）",
      "status": "completed"
    }
  ],
  "roleEvaluation": [
    {
      "roleId": "marketResearch",
      "roleName": "市场分析角色",
      "evaluation": "该角色输出质量与稳定性评价（40-120字）",
      "score": 8
    }
  ],
  "performanceReview": {
    "summary": "结合 pipelineTelemetry 对耗时、Token、成功率的文字评价（80-200字）"
  },
  "riskAssessment": [
    {"title": "风险标题", "detail": "风险说明", "severity": "low|medium|high"}
  ],
  "opportunityAnalysis": [
    {"title": "机会标题", "detail": "机会说明"}
  ],
  "recommendations": [
    {"title": "建议标题", "detail": "可执行建议"}
  ],
  "pdfHighlights": ["报告亮点1", "亮点2", "亮点3"],
  "confidence": 0.85,
  "missingInfo": ["待确认项，无则空数组"]
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

【任务】生成完整营销内容与物料链路 JSON，必须覆盖电商文案、海报文案、图片创意、视频脚本与视频素材；输出必须可直接用于前端结果展示与后续视频/图片生成扩展。

【输出 schema】
{CONTENT_SCHEMA}

【要求】
- 必须输出 schema 中所有字段，字段名必须完全一致，不得省略 posterCopy、imageIdeas、videoMaterial。
- sellingPointCopy 必须 3-5 条，格式「特点 - 用户收益」，基于已确认的产品属性。
- detailPageContent 按「使用场景 → 核心体验 → 适合人群 → 购买理由」组织，禁止逐条复制 sellingPointCopy。
- title 与 conversionDescription 必须有转化导向，但不夸大。
- posterCopy 要兼顾海报传播：headline 强吸睛，subheadline 补充卖点，slogan 简短有记忆点。
- imageIdeas 至少 3 条，分别覆盖商品主图、详情页/活动海报、社媒配图或短视频封面；description 要能直接交给设计或图片生成模型使用。
- videoScript 输出 15-30 秒短视频脚本，可按镜头/分镜/口播结构组织。
- videoMaterial.scenes 至少 3 条，包含画面、动作、卖点；voiceover 是完整口播，caption 可作为视频封面或字幕。
- 如当前任务只生成文本，也必须保留 imageIdeas 与 videoMaterial 的结构化输出，不得省略字段。
- 优先使用以下已提取信息：属性={_dump(attributes)}，卖点={_dump(selling_points)}。
- 结合市场分析中的品牌调性与视觉风格建议，保持文案、图片创意、视频素材口径一致。

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

【任务】基于完整营销物料改写社媒传播文案 JSON，并补齐短视频脚本建议，确保与内容模块、图片创意和海报口径一致。

【输出 schema】
{SOCIAL_SCHEMA}

【要求】
- 必须包含 xiaohongshu、weibo、douyin 三个 platform，不可缺失或改名。
- 小红书偏种草分享，微博偏话题传播，抖音偏口播/短视频；三平台内容不可完全相同。
- 每条 hashtags 2-6 个，带 # 前缀。
- scriptSuggestion 给出 15-30 秒短视频结构建议。
- 输出必须是可直接展示的 JSON，不能输出解释文字或 markdown。

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


def pipeline_summary_prompt(summary_input: dict[str, Any]) -> str:
    constraints = summary_input.get("constraints") or {}
    return f"""{GLOBAL_RULES}

【任务】你是 CrewMarket 最终汇总评估官。基于 PipelineSummaryInput 结构化输入，输出专业评估报告 JSON。

【输出 schema — 必须完整输出以下字段】
{PIPELINE_SUMMARY_SCHEMA}

【约束】
- allowInference={constraints.get("allowInference", False)}：禁止编造输入中未出现的具体参数、价格、认证信息
- reportTone={constraints.get("reportTone", "professional")}：专业、客观、可落地
- includeRiskForecast={constraints.get("includeRiskForecast", True)}
- includeOpportunityAnalysis={constraints.get("includeOpportunityAnalysis", True)}

【要求】
1. executiveSummary 150-400 字，概括本次运行整体表现、质量与下一步。
2. moduleSummary 必须覆盖 moduleResults 中每个 moduleId，逐条给出 title + summary。
3. roleEvaluation 必须覆盖 roleRuns 中每个 roleId，score 为 1-10 整数。
4. performanceReview.summary 必须结合 pipelineTelemetry 中的耗时、Token、成功率做量化评价。
5. riskAssessment 2-5 条；severity 只能是 low、medium、high。
6. opportunityAnalysis 2-4 条；recommendations 3-6 条，必须可执行。
7. pdfHighlights 3-6 条，适合写入 PDF 目录或摘要页。
8. missingInfo 合并 userInput 与模块中的待确认项；无则 []。
9. 禁止输出 schema 外字段；禁止 markdown。

【PipelineSummaryInput】
{_dump(summary_input)}"""


PDF_REPORT_SCHEMA = """
{
  "reportTitle": "CrewMarket 营销 Pipeline 评估报告",
  "subtitle": "基于多智能体协同输出的运行评估",
  "generatedAt": "ISO-8601 时间",
  "pipelineId": "pl_xxx",
  "promptVersion": "v1.0.0",
  "confidence": 0.85,
  "coverHighlights": ["封面亮点1", "亮点2", "亮点3"],
  "sections": [
    {
      "id": "taskOverview",
      "title": "任务概述",
      "content": "200-400 字，说明任务目标、输入与整体结论",
      "bullets": ["要点1", "要点2"]
    },
    {
      "id": "moduleOutputs",
      "title": "模块输出摘要",
      "content": "各模块产出质量与完整性概述",
      "bullets": ["模块要点"]
    },
    {
      "id": "rolePerformance",
      "title": "角色表现评估",
      "content": "各 AI 角色稳定性与输出质量",
      "bullets": []
    },
    {
      "id": "telemetryStats",
      "title": "运行统计",
      "content": "耗时、Token、成功率等量化说明",
      "bullets": []
    },
    {
      "id": "assessment",
      "title": "综合评估",
      "content": "executiveSummary 扩写为报告正文",
      "bullets": []
    },
    {
      "id": "risks",
      "title": "风险预测",
      "content": "主要风险与影响",
      "bullets": ["风险项"]
    },
    {
      "id": "opportunities",
      "title": "机会分析",
      "content": "可把握的机会点",
      "bullets": []
    },
    {
      "id": "recommendations",
      "title": "优化建议",
      "content": "可执行的后续行动",
      "bullets": ["建议1", "建议2"]
    }
  ],
  "telemetrySnapshot": {
    "totalDurationMs": 0,
    "totalInputTokens": 0,
    "totalOutputTokens": 0,
    "totalTokens": 0,
    "successRate": 0.95,
    "summaryText": "80-150 字运行统计摘要"
  },
  "disclaimer": "本报告由 AI 自动生成，仅供内部评审参考，投放前请人工复核"
}
""".strip()


def pdf_report_prompt(report_input: dict[str, Any]) -> str:
    return f"""{GLOBAL_RULES}

【任务】你是 CrewMarket PDF 专业报告撰写官（独立于汇总评估模型）。基于已生成的 PipelineSummaryOutput 与过程记录，输出可直接打印、适合管理层阅读的 PDF 报告 JSON。

【与汇总评估的区别】
- 汇总评估（summary）已完成结构化评估；你的职责是将其改写为分章节、可打印的长文报告
- 不得编造输入与 summary 中未出现的事实、参数或数据
- 语气专业、客观，适合 PDF 留档

【输出 schema — 必须完整输出】
{PDF_REPORT_SCHEMA}

【要求】
1. reportTitle 含产品名或任务标识（若有）；coverHighlights 3-6 条，适合封面摘要。
2. sections 至少 6 条，必须覆盖：taskOverview、moduleOutputs、rolePerformance、telemetryStats、assessment、recommendations；risks/opportunities 有数据则必须单独成节。
3. 每节 content 80-350 字；bullets 0-6 条，无则 []。
4. telemetrySnapshot 必须引用 reportInput 中的 pipelineTelemetry 真实数字。
5. confidence 与 summary.confidence 保持一致或略作说明。
6. 禁止 markdown；禁止 schema 外字段。

【reportInput】
{_dump(report_input)}"""
