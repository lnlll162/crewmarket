import type { PipelineStepId } from '../../types';

export interface PipelineStepMeta {
  id: PipelineStepId;
  label: string;
  description: string;
  agent: string;
}

export const PIPELINE_STEPS: PipelineStepMeta[] = [
  {
    id: 'productExtract',
    label: '产品提取',
    description: '识图与描述解析，提炼名称、品类与核心卖点',
    agent: 'Product Analyst',
  },
  {
    id: 'marketResearch',
    label: '市场分析',
    description: '分析市场趋势、竞品风格、用户画像与品牌调性',
    agent: 'Market & Brand Strategist',
  },
  {
    id: 'content',
    label: '内容生成',
    description: '生成标题、卖点、详情页、脚本、海报文案、图片创意与视频素材',
    agent: 'Marketing Content Writer',
  },
  {
    id: 'seo',
    label: 'SEO 优化',
    description: '优化关键词并生成多平台适配文案',
    agent: 'Channel Adaptation Specialist',
  },
  {
    id: 'social',
    label: '社媒适配',
    description: '生成社媒与短视频传播所需物料',
    agent: 'Marketing Material Agent',
  },
  {
    id: 'merged',
    label: '汇总校验',
    description: '去重整合，输出一致性建议与待确认项',
    agent: 'Result Auditor',
  },
];

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export const PLATFORM_LABELS: Record<string, string> = {
  xiaohongshu: '小红书',
  weibo: '微博',
  douyin: '抖音',
};
