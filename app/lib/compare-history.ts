import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { AiTaskId, PipelineStatus } from '@/types';

export interface CompareHistoryRecord {
  id: string;
  createdAt: string;
  taskIds: AiTaskId[];
  candidateModels: string[];
  status: PipelineStatus;
  pipelineId: string;
  summary?: string;
  totalTokens?: number;
  durationMs?: number;
  roleEvaluation?: Array<{ roleId: string; roleName: string; evaluation: string; score?: number }>;
  moduleSummary?: Array<Record<string, unknown>>;
  telemetry?: Array<Record<string, unknown>>;
  modules?: Array<Record<string, unknown>>;
}

const STORAGE_PATH = path.join(process.cwd(), 'data', 'compare-history.json');

async function ensureDir() {
  await mkdir(path.dirname(STORAGE_PATH), { recursive: true });
}

export async function readCompareHistory(): Promise<CompareHistoryRecord[]> {
  try {
    const raw = await readFile(STORAGE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as CompareHistoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendCompareHistory(record: CompareHistoryRecord): Promise<CompareHistoryRecord[]> {
  await ensureDir();
  const history = await readCompareHistory();
  const next = [record, ...history].slice(0, 100);
  await writeFile(STORAGE_PATH, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export async function replaceCompareHistory(records: CompareHistoryRecord[]): Promise<CompareHistoryRecord[]> {
  await ensureDir();
  const next = records.slice(0, 100);
  await writeFile(STORAGE_PATH, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
