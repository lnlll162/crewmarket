import type { RoleDefinition } from '@/types';

/** 与 crew/prompts.py ROLE_DEFINITIONS 对齐 — 前端展示与文档用 */
export const ROLE_PROMPTS: Record<string, RoleDefinition> = {
  productExtract: {
    roleId: 'productExtract',
    roleName: '产品提取角色',
    version: 'v1.0.0',
    telemetryTag: 'product_extract',
    systemPrompt:
      '你是产品信息提取专家，负责从文本和图片中提取商品的基础信息、结构化卖点和可用于后续分析的关键属性。',
    taskPromptTemplate:
      '请基于输入内容提取产品名称、品类、核心属性、材质、规格、功能点、卖点，并标注哪些是明确可见信息、哪些是推断信息。',
    inputContract: ['description', 'imageBase64', 'options.productName', 'options.category'],
    outputContract: ['productName', 'category', 'attributes', 'sellingPoints', 'summary', 'missingInfo'],
    modelPreference: 'general-reasoning',
  },
  marketResearch: {
    roleId: 'marketResearch',
    roleName: '市场分析角色',
    version: 'v1.0.0',
    telemetryTag: 'market_research',
    systemPrompt: '你擅长电商市场研究、品牌定位和风格提炼，输出简洁、可落地。',
    taskPromptTemplate:
      '请分析市场趋势、用户画像、竞品风格、品牌调性、视觉风格，并给出可执行的营销建议。',
    inputContract: ['description', 'imageBase64', 'productExtractResult', 'options.productName', 'options.category'],
    outputContract: [
      'marketTrends',
      'competitorStyle',
      'userPersona',
      'brandTone',
      'visualStyle',
      'marketingSuggestions',
    ],
    modelPreference: 'analysis',
  },
  content: {
    roleId: 'content',
    roleName: '文案生成角色',
    version: 'v1.0.0',
    telemetryTag: 'content_write',
    systemPrompt:
      '你是资深电商营销文案，风格真实可信，不夸大宣传，禁止空泛套话，且要兼顾不同营销物料的统一口径。',
    taskPromptTemplate:
      '请生成完整营销内容与物料链路，覆盖标题、详情页、海报文案、图片创意、视频脚本与视频素材，并保持口径一致。',
    inputContract: ['description', 'productExtractResult', 'marketResearchResult', 'options.productName', 'options.category'],
    outputContract: [
      'title',
      'sellingPointCopy',
      'detailPageContent',
      'conversionDescription',
      'posterCopy',
      'imageIdeas',
      'videoScript',
      'videoMaterial',
    ],
    modelPreference: 'creative-writing',
  },
  seo: {
    roleId: 'seo',
    roleName: 'SEO 优化角色',
    version: 'v1.0.0',
    telemetryTag: 'seo_optimize',
    systemPrompt: '你熟悉电商平台搜索与内容分发规则，擅长关键词布局与平台适配。',
    taskPromptTemplate:
      '请输出关键词、搜索友好标题与文案，并生成小红书/微博/抖音三平台适配文案。',
    inputContract: ['content', 'description', 'productExtractResult', 'marketResearchResult'],
    outputContract: ['keywords', 'optimizedTitle', 'searchFriendlyCopy', 'channelAdaptation'],
    modelPreference: 'search-optimization',
  },
  social: {
    roleId: 'social',
    roleName: '社媒改写角色',
    version: 'v1.0.0',
    telemetryTag: 'social_adapt',
    systemPrompt: '你熟悉国内社媒平台语境与短视频传播逻辑，三平台内容不可雷同。',
    taskPromptTemplate:
      '请基于完整营销物料改写小红书/微博/抖音传播文案，并补齐短视频脚本建议。',
    inputContract: ['content', 'sellingPoints', 'description', 'productExtractResult'],
    outputContract: ['copies', 'scriptSuggestion'],
    modelPreference: 'social-copy',
  },
  merged: {
    roleId: 'merged',
    roleName: '汇总评估角色',
    version: 'v1.0.0',
    telemetryTag: 'result_merge',
    systemPrompt:
      '你是 CrewMarket 汇总评估模型，只综合已有模块结果与 telemetry，不重新生成业务物料。',
    taskPromptTemplate:
      '请整合所有模块输出、telemetry 和异常信息，生成包含总结、风险、机会、建议与性能评估的专业报告。',
    inputContract: ['summaryInput', 'moduleResults', 'roleRuns', 'pipelineTelemetry', 'constraints'],
    outputContract: [
      'executiveSummary',
      'moduleSummary',
      'roleEvaluation',
      'performanceReview',
      'riskAssessment',
      'opportunityAnalysis',
      'recommendations',
      'pdfHighlights',
    ],
    modelPreference: 'reporting',
  },
  pdfReport: {
    roleId: 'pdfReport',
    roleName: 'PDF 报告撰写角色',
    version: 'v1.0.0',
    telemetryTag: 'pdf_report',
    systemPrompt:
      '你擅长撰写结构清晰、语气专业、可打印的评估报告。只基于输入的 summary 与 modules 扩写，不编造事实。',
    taskPromptTemplate:
      '请将 PipelineSummaryOutput 与过程记录改写为分章节、可直接导出 PDF 的专业报告 JSON。',
    inputContract: ['summary', 'modules', 'pipelineTelemetry', 'roleRuns'],
    outputContract: ['reportTitle', 'sections', 'coverHighlights', 'telemetrySnapshot', 'disclaimer'],
    modelPreference: 'reporting',
  },
};

/** 校验 Python ROLE_DEFINITIONS 与前端 ROLE_PROMPTS 的 roleId / version 一致 */
export const ROLE_PROMPT_IDS = Object.keys(ROLE_PROMPTS);
