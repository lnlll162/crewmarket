import type { PipelineStepId } from '@/types';

export interface PipelineStepMeta {
  id: PipelineStepId;
  label: string;
  description: string;
  agent: string;
}

export const PIPELINE_STEPS: PipelineStepMeta[] = [
  {
    id: 'productExtract',
    label: '产品信息提取',
    description: '识图与描述解析，提炼名称、品类与核心卖点',
    agent: 'Product Analyst',
  },
  {
    id: 'marketResearch',
    label: '市场竞品分析',
    description: '分析市场趋势、竞品风格与目标人群',
    agent: 'Market Researcher',
  },
  {
    id: 'content',
    label: '电商文案生成',
    description: '撰写标题、卖点描述与详情页转化文案',
    agent: 'Content Writer',
  },
  {
    id: 'seo',
    label: 'SEO 关键词优化',
    description: '优化搜索关键词与标题，提升曝光',
    agent: 'SEO Specialist',
  },
  {
    id: 'social',
    label: '社媒内容适配',
    description: '生成小红书、微博、抖音等平台文案',
    agent: 'Social Media Agent',
  },
  {
    id: 'merged',
    label: '汇总与风格统一',
    description: '去重整合，输出可直接落地的营销物料包',
    agent: 'Result Merger',
  },
];

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export const PLATFORM_LABELS: Record<string, string> = {
  xiaohongshu: '小红书',
  weibo: '微博',
  douyin: '抖音',
};
