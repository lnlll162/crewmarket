import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import type { PipelineRunResponseData } from '@/types';

const RESULTS_DIR = path.join(process.cwd(), 'data', 'pipeline-results');

function ensureDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

/**
 * latest 指针存在 globalThis 上：
 * - 同一进程内 HMR / 模块重加载不会丢失
 * - 服务器重启（进程退出）自动清空
 */
const _g = globalThis as typeof globalThis & {
  __crewMarketLatestPipelineId?: string;
};

function readLatestPipelineId(): string | null {
  return _g.__crewMarketLatestPipelineId ?? null;
}

function writeLatestPipelineId(pipelineId: string): void {
  _g.__crewMarketLatestPipelineId = pipelineId;
}

/** 状态快照 */
interface PipelineStatusSnapshot {
  pipelineId: string;
  status: 'running' | 'completed' | 'failed';
  updatedAt: string;
  error?: string;
  stepsCompleted?: string[];
}

/** 保存完整 pipeline 结果 */
export async function savePipelineResult(
  pipelineId: string,
  result: PipelineRunResponseData,
): Promise<void> {
  ensureDir();
  const filePath = path.join(RESULTS_DIR, `${pipelineId}.json`);
  await fsPromises.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
  writeLatestPipelineId(pipelineId);
}

/** 读取完整 pipeline 结果 */
export async function getPipelineResult(
  pipelineId: string,
): Promise<PipelineRunResponseData | null> {
  const filePath = path.join(RESULTS_DIR, `${pipelineId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const content = await fsPromises.readFile(filePath, 'utf-8');
  return JSON.parse(content) as PipelineRunResponseData;
}

/** 设置最新 pipeline 指针（在启动新 pipeline 时调用） */
export function setLatestPointer(pipelineId: string): void {
  writeLatestPipelineId(pipelineId);
}

/** 获取最新 pipeline 信息（含运行中状态） */
export async function getLatestPipelineInfo(): Promise<{
  pipelineId: string;
  status: 'running' | 'completed' | 'failed' | 'not_found';
  result?: PipelineRunResponseData;
  error?: string;
} | null> {
  const latestId = readLatestPipelineId();
  if (!latestId) return null;

  // 先检查是否有完整结果（completed）
  const result = await getPipelineResult(latestId);
  if (result) {
    return { pipelineId: latestId, status: 'completed', result };
  }

  // 检查状态文件（running / failed）
  const status = await getPipelineStatus(latestId);
  if (status) {
    return {
      pipelineId: latestId,
      status: status.status,
      error: status.error,
    };
  }

  return { pipelineId: latestId, status: 'not_found' };
}

/** 保存/更新 pipeline 运行状态 */
export async function savePipelineStatus(
  pipelineId: string,
  status: PipelineStatusSnapshot['status'],
  extra?: { error?: string; stepsCompleted?: string[] },
): Promise<void> {
  ensureDir();
  const snapshot: PipelineStatusSnapshot = {
    pipelineId,
    status,
    updatedAt: new Date().toISOString(),
    ...extra,
  };
  await fsPromises.writeFile(
    path.join(RESULTS_DIR, `${pipelineId}-status.json`),
    JSON.stringify(snapshot, null, 2),
    'utf-8',
  );
}

/** 读取 pipeline 运行状态 */
export async function getPipelineStatus(
  pipelineId: string,
): Promise<PipelineStatusSnapshot | null> {
  const filePath = path.join(RESULTS_DIR, `${pipelineId}-status.json`);
  if (!fs.existsSync(filePath)) return null;
  const content = await fsPromises.readFile(filePath, 'utf-8');
  return JSON.parse(content) as PipelineStatusSnapshot;
}

/** 保存 pipeline 原始输入 */
export async function savePipelineInput(
  pipelineId: string,
  input: unknown,
): Promise<void> {
  ensureDir();
  await fsPromises.writeFile(
    path.join(RESULTS_DIR, `${pipelineId}-input.json`),
    JSON.stringify(input, null, 2),
    'utf-8',
  );
}

/** 读取 pipeline 原始输入 */
export async function getPipelineInput(
  pipelineId: string,
): Promise<unknown | null> {
  const filePath = path.join(RESULTS_DIR, `${pipelineId}-input.json`);
  if (!fs.existsSync(filePath)) return null;
  const content = await fsPromises.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/** 生成唯一 pipelineId */
export function generatePipelineId(): string {
  return `pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
