import type { PipelineSummaryInput, PipelineSummaryOutput } from '@/types';

export const SUMMARY_INPUT_CONTRACT: PipelineSummaryInput['constraints'] = {
  allowInference: false,
  reportTone: 'professional',
  includeRiskForecast: true,
  includeOpportunityAnalysis: true,
};

export const SUMMARY_OUTPUT_CONTRACT: Array<keyof PipelineSummaryOutput> = [
  'executiveSummary',
  'moduleSummary',
  'roleEvaluation',
  'performanceReview',
  'riskAssessment',
  'opportunityAnalysis',
  'recommendations',
  'pdfHighlights',
  'confidence',
  'missingInfo',
];
