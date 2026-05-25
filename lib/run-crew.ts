import { spawn } from 'child_process';
import path from 'path';
import type { PipelineRunRequest, PipelineRunResponseData } from '@/types';

function getPythonPath(): string {
  const venvPython = path.join(process.cwd(), 'crew', '.venv', 'Scripts', 'python.exe');
  return venvPython;
}

export async function runCrewPipeline(
  input: unknown,
  step: 'full' | 'analyze' | 'content' | 'seo' | 'social' | 'merge' = 'full',
): Promise<unknown> {
  const python = getPythonPath();
  const script = path.join(process.cwd(), 'crew', 'run_pipeline.py');
  const args = [script, '--step', step];

  return new Promise((resolve, reject) => {
    const     proc = spawn(python, args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8');
    });
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8');
    });

    proc.on('error', (err) => {
      reject(new Error(`无法启动 Python/CrewAI：${err.message}。请先运行 npm run crew:setup`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `CrewAI 进程退出码 ${code}`));
        return;
      }
      try {
        const line = stdout.trim().split('\n').filter(Boolean).pop() ?? '{}';
        resolve(JSON.parse(line));
      } catch {
        reject(new Error(`解析 CrewAI 输出失败：${stdout.slice(0, 500)}`));
      }
    });

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

export function validateProductInput(body: unknown): body is PipelineRunRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return typeof b.description === 'string' && b.description.trim().length > 0;
}
