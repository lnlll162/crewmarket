import { spawn } from 'child_process';
import path from 'path';
import type { PipelineRunRequest, PipelineRunResponseData, PipelineStepId, TelemetryRecord } from '@/types';

function projectRoot() {
  return process.cwd();
}

function pythonExecutable() {
  const venvPython = path.join(projectRoot(), 'crew', '.venv', 'Scripts', 'python.exe');
  return venvPython;
}

interface PythonPipelineEnvelope {
  status: string;
  data?: {
    pipelineId: string;
    steps: PipelineRunResponseData['steps'];
    result?: PipelineRunResponseData['result'];
    pendingConfirmations: string[];
    generatedAt: string;
  };
  telemetry?: TelemetryRecord[];
  modules?: PipelineRunResponseData['modules'];
  summary?: PipelineRunResponseData['summary'];
  pdfReport?: PipelineRunResponseData['pdfReport'];
  error?: { step: PipelineStepId; message: string };
  generatedAt?: string;
}

function mapPipelineEnvelope(parsed: PythonPipelineEnvelope): PipelineRunResponseData {
  const fallbackStep: PipelineStepId = 'productExtract';
  if (!parsed.data) {
    return {
      pipelineId: '',
      status: 'failed',
      steps: {},
      pendingConfirmations: [],
      generatedAt: parsed.generatedAt ?? new Date().toISOString(),
      telemetry: parsed.telemetry,
      modules: parsed.modules,
      summary: parsed.summary,
      pdfReport: parsed.pdfReport,
      error: parsed.error ?? { step: fallbackStep, message: 'Pipeline 执行失败' },
    };
  }

  return {
    ...parsed.data,
    status: parsed.status === 'completed' ? 'completed' : 'failed',
    telemetry: parsed.telemetry,
    modules: parsed.modules,
    summary: parsed.summary,
    pdfReport: parsed.pdfReport,
    error: parsed.error,
  };
}

function parseJsonOutput(stdout: string) {
  return JSON.parse(stdout) as PythonPipelineEnvelope;
}

function runPythonPipeline(step: string, payload: unknown): Promise<PipelineRunResponseData> {
  const script = path.join(projectRoot(), 'crew', 'run_pipeline.py');
  const python = pythonExecutable();
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn(python, [script, '--step', step], {
      cwd: projectRoot(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      const finishedAt = Date.now();
      if (code !== 0) {
        reject(new Error(stderr || `Python exited with code ${code}`));
        return;
      }
      try {
        const parsed = parseJsonOutput(stdout);
        const mapped = mapPipelineEnvelope(parsed);
        if (mapped.telemetry?.length) {
          mapped.telemetry = mapped.telemetry.map((item) => ({
            ...item,
            durationMs: item.durationMs ?? Math.max(0, finishedAt - startedAt),
          }));
        }
        resolve(mapped);
      } catch (err) {
        reject(new Error(`Python 输出解析失败: ${(err as Error).message}\n${stdout}\n${stderr}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

export function validateProductInput(body: unknown): body is PipelineRunRequest {
  return !!body && typeof body === 'object' && typeof (body as { description?: unknown }).description === 'string';
}

export async function runCrewPipeline(body: PipelineRunRequest, step: 'full' | 'content' | 'analyze' | 'seo' | 'social' | 'merge') {
  return runPythonPipeline(step, body);
}
