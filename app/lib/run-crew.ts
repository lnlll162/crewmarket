import { spawn } from 'child_process';
import path from 'path';
import type { PipelineRunRequest } from '@/types';

function projectRoot() {
  return process.cwd();
}

function pythonExecutable() {
  const venvPython = path.join(projectRoot(), 'crew', '.venv', 'Scripts', 'python.exe');
  return venvPython;
}

function runPythonPipeline(step: string, payload: unknown): Promise<unknown> {
  const script = path.join(projectRoot(), 'crew', 'run_pipeline.py');
  const python = pythonExecutable();
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
      if (code !== 0) {
        reject(new Error(stderr || `Python exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
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
