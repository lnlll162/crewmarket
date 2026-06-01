import { spawn } from 'child_process';
import path from 'path';

export interface ConfigBindingProbeRow {
  bindingId: string;
  envVar?: string;
  modelId?: string;
  probeKind?: string;
  expectedModelId?: string;
  actualModelId?: string;
  ok: boolean;
  error?: string;
  detail?: Record<string, unknown>;
}

export interface ConfigBindingProbeReport {
  ok: boolean;
  offline?: {
    ok: boolean;
    skipped?: boolean;
    message?: string;
    configPath?: string;
    failures?: string[];
    results?: ConfigBindingProbeRow[];
  };
  live?: {
    ok: boolean;
    mode: 'live';
    totalBindings: number;
    passedBindings: number;
    failures: string[];
    results: ConfigBindingProbeRow[];
  };
}

function projectRoot() {
  return process.cwd();
}

function pythonExecutable() {
  return process.env.PYTHON_EXECUTABLE || 'python';
}

export async function probeConfigBindings(mode: 'offline' | 'live'): Promise<ConfigBindingProbeReport> {
  const script = path.join(projectRoot(), 'crew', 'probe_config_bindings.py');
  const python = pythonExecutable();
  const args = mode === 'live' ? ['--live', '--json'] : ['--offline', '--json'];

  return new Promise((resolve, reject) => {
    const child = spawn(python, [script, ...args], {
      cwd: projectRoot(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
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
      try {
        const report = JSON.parse(stdout) as ConfigBindingProbeReport;
        if (code !== 0 && report.ok !== false) {
          reject(new Error(stderr || `probe_config_bindings exited ${code}`));
          return;
        }
        resolve(report);
      } catch {
        reject(new Error(stderr || stdout || `探针输出解析失败 (code ${code})`));
      }
    });
  });
}
