/** CrewMarket 共享类型 — 与 docs/api/README.md 保持一致 */

// ─── 通用 ───────────────────────────────────────────────

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface FieldWithStatus<T = string> {
  value: T;
  status: 'confirmed' | 'pending';
  note?: string;
}

export interface ProductInputOptions {
  productName?: string;
  category?: string;
  targetAudience?: string;
  priceRange?: string;
  brandStyle?: string;
  marketingGoal?: string;
  competitorInfo?: string;
  platformRequirements?: string[];
}

export interface ProductInput {
  description: string;
  imageUrl?: string;
  imageBase64?: string;
  options?: ProductInputOptions;
}

// ─── AI Task 输出 ───────────────────────────────────────

export interface ProductExtractResult {
  productName: FieldWithStatus;
  category: FieldWithStatus;
  attributes: FieldWithStatus<string[]>;
  sellingPoints: FieldWithStatus<string[]>;
  summary: string;
}

export interface MarketResearchResult {
  marketTrends: string;
  competitorStyle: string;
  userPersona: string;
  brandTone: string;
  visualStyle: string;
  marketingSuggestions: string[];
}

export interface PosterCopy {
  headline: string;
  subheadline: string;
  slogan: string;
}

export interface VisualAssetIdea {
  title: string;
  description: string;
  usage: string;
}

export interface VideoMaterial {
  hook: string;
  scenes: string[];
  voiceover: string;
  caption: string;
}

export interface ContentGenerateResult {
  title: string;
  sellingPointCopy: string[];
  detailPageContent: string;
  conversionDescription: string;
  videoScript: string;
  posterCopy?: PosterCopy;
  imageIdeas?: VisualAssetIdea[];
  videoMaterial?: VideoMaterial;
}

export interface SeoOptimizeResult {
  keywords: string[];
  optimizedTitle: string;
  searchFriendlyCopy: string;
  channelAdaptation: {
    xiaohongshu: string;
    weibo: string;
    douyin: string;
  };
}

export interface SocialPlatformCopy {
  platform: 'xiaohongshu' | 'weibo' | 'douyin';
  content: string;
  hashtags: string[];
}

export interface SocialGenerateResult {
  copies: SocialPlatformCopy[];
  scriptSuggestion?: string;
}

export interface MarketingMaterialPackage {
  product: ProductExtractResult;
  market: MarketResearchResult;
  content: ContentGenerateResult;
  seo: SeoOptimizeResult;
  social: SocialGenerateResult;
  mergedAt: string;
}

export interface MergeResult {
  package: MarketingMaterialPackage;
  consistencyNotes: string[];
  pendingConfirmations: string[];
}

// ─── 业务 REST 请求 / 响应 data ─────────────────────────

/** POST /api/product/analyze */
export interface AnalyzeRequest extends ProductInput {}

export interface AnalyzeResponseData {
  product: ProductExtractResult;
  market: MarketResearchResult;
}

/** POST /api/content/generate */
export interface ContentGenerateRequest {
  product: ProductExtractResult;
  market: MarketResearchResult;
  options?: ProductInputOptions;
}

/** POST /api/seo/optimize */
export interface SeoOptimizeRequest {
  content: ContentGenerateResult;
  category?: string;
  keywordsHint?: string[];
}

/** POST /api/social/generate */
export interface SocialGenerateRequest {
  content: ContentGenerateResult;
  sellingPoints: string[];
  platformRequirements?: string[];
}

/** POST /api/result/merge */
export interface MergeRequest {
  product: ProductExtractResult;
  market: MarketResearchResult;
  content: ContentGenerateResult;
  seo: SeoOptimizeResult;
  social: SocialGenerateResult;
}

/** POST /api/pipeline/run — 前端主入口 */
export interface PipelineRunRequest extends ProductInput {}

export type PipelineStepId =
  | 'productExtract'
  | 'marketResearch'
  | 'content'
  | 'seo'
  | 'social'
  | 'merged';

export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PipelineRunResponseData {
  pipelineId: string;
  status: PipelineStatus;
  currentStep?: PipelineStepId;
  steps: {
    productExtract?: ProductExtractResult;
    marketResearch?: MarketResearchResult;
    content?: ContentGenerateResult;
    seo?: SeoOptimizeResult;
    social?: SocialGenerateResult;
    merged?: MergeResult;
  };
  result?: MergeResult;
  pendingConfirmations: string[];
  generatedAt: string;
  error?: {
    step: PipelineStepId;
    message: string;
  };
}

// ─── AI Task 标识（内部编排用）────────────────────────────

export type AiTaskId =
  | 'task.product_extract'
  | 'task.market_research'
  | 'task.content_write'
  | 'task.seo_optimize'
  | 'task.social_adapt'
  | 'task.result_merge';

export const AI_TASK_ORDER: AiTaskId[] = [
  'task.product_extract',
  'task.market_research',
  'task.content_write',
  'task.seo_optimize',
  'task.social_adapt',
  'task.result_merge',
];

export const REST_TO_AI_TASKS: Record<string, AiTaskId[]> = {
  '/api/product/analyze': ['task.product_extract', 'task.market_research'],
  '/api/content/generate': ['task.content_write'],
  '/api/seo/optimize': ['task.seo_optimize'],
  '/api/social/generate': ['task.social_adapt'],
  '/api/result/merge': ['task.result_merge'],
  '/api/pipeline/run': AI_TASK_ORDER,
};

// ─── 多模型配置（AI 层，按 Task 绑定不同 LLM）────────────

export type LlmProviderId =
  | 'siliconflow'
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'dashscope'
  | 'zhipu'
  | 'volcengine'
  | 'google';

export const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1';

export interface AgentModelConfig {
  taskId: AiTaskId;
  provider: LlmProviderId;
  model: string;
  /** 对应环境变量中的 API Key 名 */
  apiKeyEnv: string;
  /** OpenAI 兼容端点，siliconflow 等 Provider 使用 */
  baseUrl?: string;
}

/** Task → 环境变量前缀，用于读取 AGENT_MODEL_* */
export const AI_TASK_ENV_PREFIX: Record<AiTaskId, string> = {
  'task.product_extract': 'AGENT_MODEL_PRODUCT_EXTRACT',
  'task.market_research': 'AGENT_MODEL_MARKET_RESEARCH',
  'task.content_write': 'AGENT_MODEL_CONTENT_WRITE',
  'task.seo_optimize': 'AGENT_MODEL_SEO_OPTIMIZE',
  'task.social_adapt': 'AGENT_MODEL_SOCIAL_ADAPT',
  'task.result_merge': 'AGENT_MODEL_RESULT_MERGE',
};

/** 硅基流动：一个 Key，6 个 Task（含 Vision 识图，已实测 2026-05-25） */
export const SILICONFLOW_AGENT_MODELS: AgentModelConfig[] = [
  {
    taskId: 'task.product_extract',
    provider: 'siliconflow',
    model: 'Qwen/Qwen3-VL-32B-Instruct',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    baseUrl: SILICONFLOW_BASE_URL,
  },
  {
    taskId: 'task.market_research',
    provider: 'siliconflow',
    model: 'deepseek-ai/DeepSeek-V3',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    baseUrl: SILICONFLOW_BASE_URL,
  },
  {
    taskId: 'task.content_write',
    provider: 'siliconflow',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    baseUrl: SILICONFLOW_BASE_URL,
  },
  {
    taskId: 'task.seo_optimize',
    provider: 'siliconflow',
    model: 'THUDM/GLM-4-32B-0414',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    baseUrl: SILICONFLOW_BASE_URL,
  },
  {
    taskId: 'task.social_adapt',
    provider: 'siliconflow',
    model: 'Qwen/Qwen2.5-32B-Instruct',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    baseUrl: SILICONFLOW_BASE_URL,
  },
  {
    taskId: 'task.result_merge',
    provider: 'siliconflow',
    model: 'deepseek-ai/DeepSeek-V3',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    baseUrl: SILICONFLOW_BASE_URL,
  },
];

/** 默认模型推荐 — 多厂商方案（可被 .env 覆盖） */
export const DEFAULT_AGENT_MODELS: AgentModelConfig[] = [
  {
    taskId: 'task.product_extract',
    provider: 'openai',
    model: 'gpt-4o',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  {
    taskId: 'task.market_research',
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
  {
    taskId: 'task.content_write',
    provider: 'dashscope',
    model: 'qwen-max',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
  },
  {
    taskId: 'task.seo_optimize',
    provider: 'zhipu',
    model: 'glm-4',
    apiKeyEnv: 'ZHIPU_API_KEY',
  },
  {
    taskId: 'task.social_adapt',
    provider: 'volcengine',
    model: 'doubao-pro-32k',
    apiKeyEnv: 'VOLCENGINE_API_KEY',
  },
  {
    taskId: 'task.result_merge',
    provider: 'openai',
    model: 'gpt-4o',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
];

export interface LlmDefaultConfig {
  provider: LlmProviderId;
  model: string;
  apiKeyEnv: string;
}

export const LLM_DEFAULT_CONFIG: LlmDefaultConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKeyEnv: 'OPENAI_API_KEY',
};
