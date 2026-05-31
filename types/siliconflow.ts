/** 硅基流动已实测白名单（与 crew/siliconflow/verified_models.py 对齐） */

export const SILICONFLOW_VERIFIED_PROFILE_ID = 'crewmarket-siliconflow-v1';
export const SILICONFLOW_VERIFIED_AT = '2026-05-30';

export type SiliconFlowScope = 'pipeline' | 'auxiliary';

export type SiliconFlowCapabilityId =
  | 'chat'
  | 'vision'
  | 'embedding'
  | 'rerank'
  | 'image'
  | 'video';

export interface SiliconFlowVerifiedTaskBinding {
  taskId: string;
  modelId: string;
  envVar: string;
  scope: SiliconFlowScope;
  verifiedBy: 'gate' | 'probe' | 'pipeline';
  gateOrProbe: string;
  notes?: string;
}

export interface SiliconFlowVerifiedProfile {
  profileId: string;
  verifiedAt: string;
  provider: 'siliconflow';
  policy: string;
  llmDefaultModel: string;
  tasks: SiliconFlowVerifiedTaskBinding[];
  generation: Array<{
    capability: string;
    modelId: string;
    envVar: string;
    scope: SiliconFlowScope;
    verifiedBy: string;
    gateOrProbe: string;
    notes?: string;
  }>;
  auxiliary: Array<{
    capability: string;
    modelId: string;
    envVar: string;
    scope: SiliconFlowScope;
    verifiedBy: string;
    gateOrProbe: string;
    notes?: string;
  }>;
}

/** 生产默认：7 Task + 生图 + 视频 + 汇总/PDF 所用模型 */
export const SILICONFLOW_VERIFIED_TASK_MODELS: Record<string, string> = {
  'task.product_extract': 'Qwen/Qwen3-VL-32B-Instruct',
  'task.market_research': 'deepseek-ai/DeepSeek-V3',
  'task.content_write': 'Qwen/Qwen2.5-72B-Instruct',
  'task.seo_optimize': 'THUDM/GLM-4-32B-0414',
  'task.social_adapt': 'Qwen/Qwen2.5-32B-Instruct',
  'task.result_merge': 'deepseek-ai/DeepSeek-V3',
  'task.pdf_report': 'deepseek-ai/DeepSeek-V3',
};

export const SILICONFLOW_VERIFIED_GENERATION_MODELS = {
  image: 'baidu/ERNIE-Image-Turbo',
  video: 'Wan-AI/Wan2.2-T2V-A14B',
} as const;

export const SILICONFLOW_VERIFIED_AUXILIARY_MODELS = {
  embedding: 'BAAI/bge-m3',
  rerank: 'BAAI/bge-reranker-v2-m3',
} as const;

export const SILICONFLOW_VERIFIED_OPTIONAL_MODELS = {
  speech: 'fnlp/MOSS-TTSD-v0.5',
  stt: 'FunAudioLLM/SenseVoiceSmall',
} as const;

export interface SiliconFlowModelItem {
  id: string;
  object?: string;
  ownedBy?: string;
  verified?: boolean;
}

export interface SiliconFlowCapabilityCatalog {
  label: string;
  path: string;
  scope?: SiliconFlowScope;
  defaultModel: string;
  envModel: string;
  models: SiliconFlowModelItem[];
}

export interface SiliconFlowCatalog {
  provider: 'siliconflow';
  catalogMode: 'verified' | 'account';
  profile?: SiliconFlowVerifiedProfile;
  capabilities: Record<string, SiliconFlowCapabilityCatalog>;
}
