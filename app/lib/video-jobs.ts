import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import type { VideoGenerationResult } from '@/types';
import { runCrewPipeline } from './run-crew';

export type VideoJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface VideoJobRecord {
  jobId: string;
  status: VideoJobStatus;
  requestId?: string;
  prompt: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
  result?: VideoGenerationResult;
  error?: string;
}

interface VideoJobStoreData {
  jobs: VideoJobRecord[];
}

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'video-jobs.json');
const TIMERS = new Map<string, ReturnType<typeof setInterval>>();

function nowIso() {
  return new Date().toISOString();
}

function ensureStore() {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
  if (!existsSync(STORE_FILE)) writeFileSync(STORE_FILE, JSON.stringify({ jobs: [] }, null, 2), 'utf-8');
}

function readStore(): VideoJobStoreData {
  ensureStore();
  try {
    const raw = readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<VideoJobStoreData>;
    return { jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [] };
  } catch {
    return { jobs: [] };
  }
}

function writeStore(data: VideoJobStoreData) {
  ensureStore();
  writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function persist(job: VideoJobRecord) {
  const store = readStore();
  const idx = store.jobs.findIndex((item) => item.jobId === job.jobId);
  if (idx >= 0) store.jobs[idx] = job;
  else store.jobs.unshift(job);
  writeStore(store);
  return job;
}

function getJob(jobId: string) {
  return readStore().jobs.find((job) => job.jobId === jobId) ?? null;
}

function clearTimer(jobId: string) {
  const timer = TIMERS.get(jobId);
  if (timer) {
    clearInterval(timer);
    TIMERS.delete(jobId);
  }
}

async function pollJob(jobId: string) {
  const job = getJob(jobId);
  if (!job || !job.requestId || job.status === 'completed' || job.status === 'failed') return;

  job.status = 'running';
  job.updatedAt = nowIso();
  persist(job);

  try {
    const data = (await runCrewPipeline({ requestId: job.requestId }, 'merge')) as unknown as {
      status?: string;
      url?: string;
      raw?: Record<string, unknown>;
      seed?: number | string;
      timings?: Record<string, unknown>;
    };

    const status = String(data.status ?? '').toLowerCase();
    const hasResult = Boolean(data.url) || ['succeeded', 'success', 'completed', 'done', 'generated'].includes(status);

    job.result = {
      status: hasResult ? 'completed' : 'processing',
      requestId: job.requestId,
      provider: 'siliconflow',
      url: data.url,
      raw: data.raw,
      seed: data.seed,
      timings: data.timings,
    };

    job.updatedAt = nowIso();
    if (hasResult) {
      job.status = 'completed';
      job.finishedAt = nowIso();
      clearTimer(jobId);
    }
    persist(job);
  } catch (err) {
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : '视频任务轮询失败';
    job.updatedAt = nowIso();
    job.finishedAt = nowIso();
    clearTimer(jobId);
    persist(job);
  }
}

function startPolling(jobId: string) {
  if (TIMERS.has(jobId)) return;
  TIMERS.set(jobId, setInterval(() => void pollJob(jobId), 3000));
}

export async function createVideoJob(prompt: string, model?: string) {
  const jobId = `job_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const submission = (await runCrewPipeline({ description: prompt, options: {} } as never, 'content')) as {
    videoGeneration?: { requestId?: string; model?: string; raw?: Record<string, unknown> };
  };
  const requestId = submission.videoGeneration?.requestId;

  const job: VideoJobRecord = persist({
    jobId,
    status: requestId ? 'queued' : 'failed',
    requestId,
    prompt,
    model: model ?? submission.videoGeneration?.model,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    result: requestId
      ? {
          status: 'submitted',
          requestId,
          model: model ?? submission.videoGeneration?.model,
          provider: 'siliconflow',
        }
      : undefined,
    error: requestId ? undefined : '未能创建视频任务',
  });

  if (requestId) startPolling(jobId);
  return job;
}

export function getVideoJob(jobId: string) {
  return getJob(jobId);
}

export function listVideoJobs() {
  return readStore().jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
