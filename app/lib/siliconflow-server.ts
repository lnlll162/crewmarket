import { spawn } from 'child_process';
import path from 'path';
import type { SiliconFlowCatalog } from '@/types/siliconflow';

const VISION_HINTS = ['VL', 'OCR', 'Vision', 'vision'];

function projectRoot() {
  return process.cwd();
}

function pythonExecutable() {
  return process.env.PYTHON_EXECUTABLE || 'python';
}

function siliconflowBaseUrl() {
  return (process.env.SILICONFLOW_BASE_URL ?? 'https://api.siliconflow.cn/v1').replace(/\/$/, '');
}

function siliconflowApiKey() {
  const key = process.env.SILICONFLOW_API_KEY?.trim();
  if (!key) {
    throw new Error('未配置 SILICONFLOW_API_KEY');
  }
  return key;
}

function authHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${siliconflowApiKey()}`,
  };
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function fetchSiliconFlowCatalog(mode: 'verified' | 'account' = 'verified'): Promise<SiliconFlowCatalog> {
  const script = path.join(projectRoot(), 'crew', 'export_siliconflow_catalog.py');
  const python = pythonExecutable();
  const modeArg = mode === 'account' ? '--mode' : '--mode';
  const modeValue = mode;

  return new Promise((resolve, reject) => {
    const child = spawn(python, [script, modeArg, modeValue], {
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
      if (code !== 0) {
        reject(new Error(stderr || `export_siliconflow_catalog exited ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as SiliconFlowCatalog);
      } catch (err) {
        reject(new Error(`目录 JSON 解析失败: ${(err as Error).message}`));
      }
    });
  });
}

export async function createSiliconFlowEmbeddings(input: string | string[], model?: string) {
  const res = await fetch(`${siliconflowBaseUrl()}/embeddings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: model ?? process.env.SILICONFLOW_EMBEDDING_MODEL ?? 'BAAI/bge-m3',
      input,
      encoding_format: 'float',
    }),
  });
  if (!res.ok) {
    throw new Error(`Embeddings 失败: ${res.status} ${(await res.text()).slice(0, 500)}`);
  }
  return res.json();
}

export async function createSiliconFlowRerank(
  query: string,
  documents: string[],
  options?: { model?: string; topN?: number; returnDocuments?: boolean },
) {
  const res = await fetch(`${siliconflowBaseUrl()}/rerank`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: options?.model ?? process.env.SILICONFLOW_RERANK_MODEL ?? 'BAAI/bge-reranker-v2-m3',
      query,
      documents,
      top_n: options?.topN,
      return_documents: options?.returnDocuments ?? true,
    }),
  });
  if (!res.ok) {
    throw new Error(`Rerank 失败: ${res.status} ${(await res.text()).slice(0, 500)}`);
  }
  return res.json();
}

export async function createSiliconFlowSpeech(
  text: string,
  options?: { model?: string; voice?: string; responseFormat?: string },
) {
  const model = options?.model ?? process.env.SILICONFLOW_SPEECH_MODEL ?? 'fnlp/MOSS-TTSD-v0.5';
  const voice =
    options?.voice ??
    (model.startsWith('fnlp/MOSS-TTSD') ? `${model}:alex` : undefined);
  const res = await fetch(`${siliconflowBaseUrl()}/audio/speech`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: options?.responseFormat ?? 'mp3',
      stream: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`TTS 失败: ${res.status} ${(await res.text()).slice(0, 500)}`);
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  const buffer = await res.arrayBuffer();
  const audioBase64 = Buffer.from(buffer).toString('base64');
  return { model, format: options?.responseFormat ?? 'mp3', audioBase64, byteLength: buffer.byteLength };
}

export async function transcribeSiliconFlowAudio(audioBase64: string, model?: string) {
  const script = path.join(projectRoot(), 'crew', 'probe_stt_once.py');
  const python = pythonExecutable();
  const tmpDir = path.join(projectRoot(), 'crew', '.probe_assets');
  const inputPath = path.join(tmpDir, 'upload.mp3');

  const fs = await import('fs/promises');
  await fs.mkdir(tmpDir, { recursive: true });
  const raw = Buffer.from(audioBase64.replace(/^data:audio\/[^;]+;base64,/, ''), 'base64');
  await fs.writeFile(inputPath, raw);

  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn(
      python,
      [script, '--file', inputPath, ...(model ? ['--model', model] : [])],
      {
        cwd: projectRoot(),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
      },
    );
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
        reject(new Error(stderr || `stt probe exited ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as Record<string, unknown>);
      } catch (err) {
        reject(new Error(`STT JSON 解析失败: ${(err as Error).message}`));
      }
    });
  });
}

export function filterVisionModels(models: { id: string }[]) {
  return models.filter((item) => VISION_HINTS.some((hint) => item.id.includes(hint)));
}
