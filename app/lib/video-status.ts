import { spawn } from 'child_process';
import path from 'path';
import type { VideoGenerationResult } from '@/types';

function projectRoot() {
  return process.cwd();
}

function pythonExecutable() {
  return process.env.PYTHON_EXECUTABLE || 'python';
}

function parseJsonOutput(stdout: string): Record<string, unknown> {
  const lines = stdout.trim().split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        continue;
      }
    }
  }
  const jsonMatch = stdout.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      throw new Error('stdout 中未找到有效 JSON');
    }
  }
  throw new Error('stdout 中未找到有效 JSON');
}

/** 调用 crew/poll_video.py 查询一次视频任务状态，返回归一化后的视频结果。 */
export function pollVideoStatusOnce(requestId: string): Promise<VideoGenerationResult> {
  const script = path.join(projectRoot(), 'crew', 'poll_video.py');
  const python = pythonExecutable();

  return new Promise((resolve, reject) => {
    const child = spawn(python, [script], {
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
        reject(new Error(stderr || `poll_video.py exited with code ${code}`));
        return;
      }
      try {
        resolve(parseJsonOutput(stdout) as unknown as VideoGenerationResult);
      } catch (err) {
        reject(new Error(`视频状态输出解析失败: ${(err as Error).message}\n${stdout}\n${stderr}`));
      }
    });

    child.stdin.write(JSON.stringify({ requestId }));
    child.stdin.end();
  });
}
