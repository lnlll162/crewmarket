/** 模型配置页仅收录主 Pipeline 实际使用的绑定（7 LLM Task + 文生图） */

import { SILICONFLOW_VERIFIED_GENERATION_MODELS, SILICONFLOW_VERIFIED_TASK_MODELS, type AiTaskId } from '@/types';

export type ConfigBindingGroup = 'task' | 'generation';

export interface ConfigPageBinding {
  bindingId: string;
  group: ConfigBindingGroup;
  label: string;
  description: string;
  capabilityId: string;
  envVar: string;
  defaultModel: string;
  taskId?: AiTaskId;
}

/** 配置页展示 + 可保存的绑定（与首页 Pipeline 一致） */
export const CONFIG_PAGE_BINDINGS: ConfigPageBinding[] = [
  {
    bindingId: 'task.product_extract',
    group: 'task',
    taskId: 'task.product_extract',
    label: '产品提取',
    description: 'Vision 识图 + 产品结构化提取',
    capabilityId: 'vision',
    envVar: 'AGENT_MODEL_PRODUCT_EXTRACT_MODEL',
    defaultModel: SILICONFLOW_VERIFIED_TASK_MODELS['task.product_extract'],
  },
  {
    bindingId: 'task.market_research',
    group: 'task',
    taskId: 'task.market_research',
    label: '市场分析',
    description: '市场趋势、竞品与用户画像',
    capabilityId: 'chat',
    envVar: 'AGENT_MODEL_MARKET_RESEARCH_MODEL',
    defaultModel: SILICONFLOW_VERIFIED_TASK_MODELS['task.market_research'],
  },
  {
    bindingId: 'task.content_write',
    group: 'task',
    taskId: 'task.content_write',
    label: '文案生成',
    description: '营销文案与物料 JSON',
    capabilityId: 'chat',
    envVar: 'AGENT_MODEL_CONTENT_WRITE_MODEL',
    defaultModel: SILICONFLOW_VERIFIED_TASK_MODELS['task.content_write'],
  },
  {
    bindingId: 'task.seo_optimize',
    group: 'task',
    taskId: 'task.seo_optimize',
    label: 'SEO 优化',
    description: '关键词与渠道适配',
    capabilityId: 'chat',
    envVar: 'AGENT_MODEL_SEO_OPTIMIZE_MODEL',
    defaultModel: SILICONFLOW_VERIFIED_TASK_MODELS['task.seo_optimize'],
  },
  {
    bindingId: 'task.social_adapt',
    group: 'task',
    taskId: 'task.social_adapt',
    label: '社媒改写',
    description: '小红书 / 微博 / 抖音文案',
    capabilityId: 'chat',
    envVar: 'AGENT_MODEL_SOCIAL_ADAPT_MODEL',
    defaultModel: SILICONFLOW_VERIFIED_TASK_MODELS['task.social_adapt'],
  },
  {
    bindingId: 'task.result_merge',
    group: 'task',
    taskId: 'task.result_merge',
    label: '结果汇总',
    description: '汇总评估与 summary',
    capabilityId: 'chat',
    envVar: 'AGENT_MODEL_RESULT_MERGE_MODEL',
    defaultModel: SILICONFLOW_VERIFIED_TASK_MODELS['task.result_merge'],
  },
  {
    bindingId: 'task.pdf_report',
    group: 'task',
    taskId: 'task.pdf_report',
    label: 'PDF 报告',
    description: '独立 PDF 专业报告 Agent',
    capabilityId: 'chat',
    envVar: 'AGENT_MODEL_PDF_REPORT_MODEL',
    defaultModel: SILICONFLOW_VERIFIED_TASK_MODELS['task.pdf_report'],
  },
  {
    bindingId: 'generation.image',
    group: 'generation',
    label: '文生图',
    description: 'Pipeline 内容步骤海报/配图生成',
    capabilityId: 'image',
    envVar: 'AGENT_IMAGE_MODEL',
    defaultModel: SILICONFLOW_VERIFIED_GENERATION_MODELS.image,
  },
];

export function configPageModelIds(): Set<string> {
  return new Set(CONFIG_PAGE_BINDINGS.map((item) => item.defaultModel));
}

export function configPageGenerationBindings(): ConfigPageBinding[] {
  return CONFIG_PAGE_BINDINGS.filter((item) => item.group === 'generation');
}
