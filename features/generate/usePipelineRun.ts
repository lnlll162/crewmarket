'use client';

import { useCallback, useState } from 'react';
import type {
  AnalyzeResponseData,
  ApiResponse,
  ContentGenerateResult,
  MergeResult,
  PipelineRunRequest,
  PipelineRunResponseData,
  PipelineStepId,
  SeoOptimizeResult,
  SocialGenerateResult,
} from '../../types';
import type { StepStatus } from './constants';

async function postApi<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 0 || json.data == null) {
    throw new Error(json.message || '请求失败');
  }
  return json.data;
}

const INITIAL_STEP_STATUS: Record<PipelineStepId, StepStatus> = {
  productExtract: 'pending',
  marketResearch: 'pending',
  content: 'pending',
  seo: 'pending',
  social: 'pending',
  merged: 'pending',
};

export function usePipelineRun() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepStatus, setStepStatus] = useState<Record<PipelineStepId, StepStatus>>(
    INITIAL_STEP_STATUS,
  );
  const [currentStep, setCurrentStep] = useState<PipelineStepId | undefined>();
  const [result, setResult] = useState<PipelineRunResponseData | null>(null);
  const [steps, setSteps] = useState<PipelineRunResponseData['steps']>({});

  const setStep = useCallback((id: PipelineStepId, status: StepStatus) => {
    setStepStatus((prev) => ({ ...prev, [id]: status }));
    if (status === 'running') setCurrentStep(id);
  }, []);

  const reset = useCallback(() => {
    setStepStatus(INITIAL_STEP_STATUS);
    setCurrentStep(undefined);
    setError(null);
    setResult(null);
    setSteps({});
  }, []);

  const run = useCallback(
    async (payload: PipelineRunRequest) => {
      reset();
      setLoading(true);

      const nextSteps: PipelineRunResponseData['steps'] = {};
      const pipelineId = `pipe-${Date.now()}`;

      try {
        setStep('productExtract', 'running');
        setStep('marketResearch', 'running');

        const analyze = await postApi<AnalyzeResponseData>('/api/product/analyze', payload);
        nextSteps.productExtract = analyze.product;
        nextSteps.marketResearch = analyze.market;
        setSteps({ ...nextSteps });
        setStep('productExtract', 'completed');
        setStep('marketResearch', 'completed');

        setStep('content', 'running');
        const content = await postApi<ContentGenerateResult>('/api/content/generate', {
          product: analyze.product,
          market: analyze.market,
          options: payload.options,
        });
        nextSteps.content = content;
        setSteps({ ...nextSteps });
        setStep('content', 'completed');

        setStep('seo', 'running');
        const seo = await postApi<SeoOptimizeResult>('/api/seo/optimize', {
          content,
          category: analyze.product.category.value,
        });
        nextSteps.seo = seo;
        setSteps({ ...nextSteps });
        setStep('seo', 'completed');

        setStep('social', 'running');
        const sellingPoints = analyze.product.sellingPoints.value;
        const social = await postApi<SocialGenerateResult>('/api/social/generate', {
          content,
          sellingPoints: Array.isArray(sellingPoints) ? sellingPoints : [sellingPoints],
        });
        nextSteps.social = social;
        setSteps({ ...nextSteps });
        setStep('social', 'completed');

        setStep('merged', 'running');
        const merged = await postApi<MergeResult>('/api/result/merge', {
          product: analyze.product,
          market: analyze.market,
          content,
          seo,
          social,
        });
        nextSteps.merged = merged;
        setSteps({ ...nextSteps });
        setStep('merged', 'completed');
        setCurrentStep(undefined);

        setResult({
          pipelineId,
          status: 'completed',
          steps: nextSteps,
          result: merged,
          pendingConfirmations: merged.pendingConfirmations,
          generatedAt: new Date().toISOString(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : '生成失败';
        setError(message);
        setStepStatus((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next) as PipelineStepId[]) {
            if (next[key] === 'running') next[key] = 'failed';
          }
          return next;
        });
      } finally {
        setLoading(false);
      }
    },
    [reset, setStep],
  );

  return { loading, error, stepStatus, currentStep, steps, result, run, reset };
}
