'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

async function getApi<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    const json = (await res.json()) as ApiResponse<T>;
    if (json.code !== 0 || json.data == null) return null;
    return json.data;
  } catch {
    return null;
  }
}

const INITIAL_STEP_STATUS: Record<PipelineStepId, StepStatus> = {
  productExtract: 'pending',
  marketResearch: 'pending',
  content: 'pending',
  seo: 'pending',
  social: 'pending',
  merged: 'pending',
};

const ALL_STEPS: PipelineStepId[] = [
  'productExtract',
  'marketResearch',
  'content',
  'seo',
  'social',
  'merged',
];

interface PipelineStatusData {
  status: string;
  updatedAt?: string;
  result?: PipelineRunResponseData;
  error?: string;
  input?: PipelineRunRequest;
}

export function usePipelineRun() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepStatus, setStepStatus] = useState<Record<PipelineStepId, StepStatus>>(INITIAL_STEP_STATUS);
  const [currentStep, setCurrentStep] = useState<PipelineStepId | undefined>();
  const [result, setResult] = useState<PipelineRunResponseData | null>(null);
  const [steps, setSteps] = useState<PipelineRunResponseData['steps']>({});
  const [recovering, setRecovering] = useState(true);
  const [recoveredInput, setRecoveredInput] = useState<PipelineRunRequest | null>(null);

  /** 标记用户是否已主动发起过生成，防止 recover 覆盖新结果 */
  const hasRunRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipelineIdRef = useRef<string | null>(null);

  const setStep = useCallback((id: PipelineStepId, status: StepStatus) => {
    setStepStatus((prev) => ({ ...prev, [id]: status }));
    if (status === 'running') setCurrentStep(id);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /** 将后端返回的完整结果写入 state */
  const applyResult = useCallback((data: PipelineRunResponseData) => {
    setSteps(data.steps ?? {});
    setResult(data);
    setStepStatus((prev) => {
      const next = { ...prev };
      for (const step of ALL_STEPS) {
        if (data.steps?.[step]) next[step] = 'completed';
      }
      return next;
    });
    setCurrentStep(undefined);
    setError(null);
  }, []);

  /** 开始轮询指定 pipelineId 的状态 */
  const startPolling = useCallback((pipelineId: string) => {
    stopPolling();
    pipelineIdRef.current = pipelineId;

    const poll = async () => {
      const data = await getApi<PipelineStatusData>(`/api/pipeline/status/${pipelineId}`);
      if (!data || pipelineIdRef.current !== pipelineId) return;

      if (data.status === 'completed' && data.result) {
        stopPolling();
        applyResult(data.result);
        if (data.input) setRecoveredInput(data.input);
        setLoading(false);
      } else if (data.status === 'failed') {
        stopPolling();
        setError(data.error || 'Pipeline 执行失败');
        setLoading(false);
        setStepStatus((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next) as PipelineStepId[]) {
            if (next[key] === 'running') next[key] = 'failed';
          }
          return next;
        });
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 2000);
  }, [stopPolling, applyResult]);

  const reset = useCallback(() => {
    stopPolling();
    setStepStatus(INITIAL_STEP_STATUS);
    setCurrentStep(undefined);
    setError(null);
    setResult(null);
    setSteps({});
  }, [stopPolling]);

  const run = useCallback(async (payload: PipelineRunRequest) => {
    hasRunRef.current = true;
    reset();
    setLoading(true);

    try {
      for (const step of ALL_STEPS) {
        setStep(step, 'running');
      }

      const data = await postApi<{ pipelineId: string; status: string }>(
        '/api/pipeline/run',
        payload,
      );
      startPolling(data.pipelineId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败';
      setError(message);
      setLoading(false);
      setStepStatus((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next) as PipelineStepId[]) {
          if (next[key] === 'running') next[key] = 'failed';
        }
        return next;
      });
    }
  }, [reset, setStep, startPolling]);

  // 组件挂载时自动从后端恢复最近一次 pipeline
  useEffect(() => {
    let cancelled = false;

    async function doRecover() {
      interface LatestData {
        pipelineId?: string;
        status?: string;
        steps?: PipelineRunResponseData['steps'];
        modules?: unknown;
        summary?: unknown;
        telemetry?: unknown;
        error?: string;
        input?: PipelineRunRequest;
        [key: string]: unknown;
      }

      const data = await getApi<LatestData>('/api/pipeline/latest');
      if (cancelled || hasRunRef.current) return;

      if (!data) {
        setRecovering(false);
        return;
      }

      if (data.status === 'running' && data.pipelineId) {
        if (data.input) setRecoveredInput(data.input);
        // 上一次 pipeline 仍在运行中，继续轮询
        setLoading(true);
        for (const step of ALL_STEPS) {
          setStepStatus((prev) => ({ ...prev, [step]: 'running' }));
        }
        startPolling(data.pipelineId);
        setRecovering(false);
      } else if (data.status === 'completed' && data.steps) {
        applyResult(data as unknown as PipelineRunResponseData);
        if (data.input) setRecoveredInput(data.input);
        setRecovering(false);
      } else if (data.status === 'failed') {
        setError(data.error || 'Pipeline 执行失败');
        if (data.input) setRecoveredInput(data.input);
        setRecovering(false);
      } else {
        setRecovering(false);
      }
    }

    doRecover();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [stopPolling, startPolling, applyResult, setStep]);

  return { loading, error, stepStatus, currentStep, steps, result, run, reset, recovering, recoveredInput };
}
