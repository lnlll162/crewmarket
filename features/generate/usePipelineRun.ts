'use client';

import { useCallback, useState } from 'react';
import type { ApiResponse, PipelineRunRequest, PipelineRunResponseData, PipelineStepId } from '@/types';
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
  const [stepStatus, setStepStatus] = useState<Record<PipelineStepId, StepStatus>>(INITIAL_STEP_STATUS);
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

  const run = useCallback(async (payload: PipelineRunRequest) => {
    reset();
    setLoading(true);

    try {
      setStep('productExtract', 'running');
      setStep('marketResearch', 'running');
      setStep('content', 'running');
      setStep('seo', 'running');
      setStep('social', 'running');
      setStep('merged', 'running');

      const data = await postApi<PipelineRunResponseData>('/api/pipeline/run', payload);
      setSteps(data.steps ?? {});
      setResult(data);

      if (data.steps?.productExtract) setStep('productExtract', 'completed');
      if (data.steps?.marketResearch) setStep('marketResearch', 'completed');
      if (data.steps?.content) setStep('content', 'completed');
      if (data.steps?.seo) setStep('seo', 'completed');
      if (data.steps?.social) setStep('social', 'completed');
      if (data.steps?.merged) setStep('merged', 'completed');
      setCurrentStep(undefined);

      if (data.status === 'failed') {
        throw new Error(data.error?.message || 'Pipeline 执行失败');
      }
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
  }, [reset, setStep]);

  return { loading, error, stepStatus, currentStep, steps, result, run, reset };
}
