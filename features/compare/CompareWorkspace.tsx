'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, Chip, Select, SelectItem, Spinner, Textarea } from '@heroui/react';
import { ErrorState } from '@/components/ui/ErrorState';
import type { ApiResponse, AiTaskId, LlmProviderId, PipelineRunRequest, PipelineRunResponseData, PipelineSummaryOutput } from '@/types';
import type { AgentModelConfigResponse } from '@/types/agent-model-config';
import type { SiliconFlowCatalog, SiliconFlowModelItem } from '@/types/siliconflow';

interface CompareHistoryItem {
  id: string;
  createdAt: string;
  taskIds: AiTaskId[];
  candidateModels: string[];
  status: PipelineRunResponseData['status'];
  pipelineId: string;
  summary?: string;
  totalTokens?: number;
  durationMs?: number;
  roleEvaluation?: PipelineSummaryOutput['roleEvaluation'];
  moduleSummary?: PipelineSummaryOutput['moduleSummary'];
}

interface CompareResultItem {
  taskId: AiTaskId;
  modelId: string;
  status: PipelineRunResponseData['status'];
  pipelineId: string;
  finishedAt: string;
  durationMs?: number;
  totalTokens?: number;
  summary?: string;
}

const DEFAULT_DESCRIPTION = '请使用选定任务与候选模型执行一次最小可用的模型对比实验。';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 0 || json.data == null) throw new Error(json.message || '请求失败');
  return json.data;
}

function uniqueModels(config: AgentModelConfigResponse | null, catalog: SiliconFlowCatalog | null) {
  const options: SiliconFlowModelItem[] = [];
  const seen = new Set<string>();
  const push = (item?: SiliconFlowModelItem | null) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id);
    options.push(item);
  };

  config?.rows.forEach((row) => push({ id: row.currentModel, verified: row.verified } as SiliconFlowModelItem));
  Object.values(catalog?.capabilities ?? {}).forEach((cap) => cap.models.forEach(push));
  return options;
}

export function CompareWorkspace() {
  const [config, setConfig] = useState<AgentModelConfigResponse | null>(null);
  const [catalog, setCatalog] = useState<SiliconFlowCatalog | null>(null);
  const [history, setHistory] = useState<CompareHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<AiTaskId[]>(['task.content_write']);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<CompareResultItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [configData, catalogData, historyData] = await Promise.all([
          fetchJson<AgentModelConfigResponse>('/api/agent-models/config'),
          fetchJson<SiliconFlowCatalog>('/api/siliconflow/models?mode=verified'),
          fetchJson<{ history: CompareHistoryItem[] }>('/api/compare/history'),
        ]);
        if (cancelled) return;
        setConfig(configData);
        setCatalog(catalogData);
        setHistory(historyData.history);
        setSelectedModels(configData.rows.slice(0, 2).map((row) => row.currentModel).filter(Boolean));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载对比页失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const modelOptions = useMemo(() => uniqueModels(config, catalog), [config, catalog]);
  const activeHistory = history.find((item) => item.id === activeHistoryId) ?? history[0] ?? null;

  const tasks = useMemo(
    () => [
      { id: 'task.product_extract' as const, label: '产品提取' },
      { id: 'task.market_research' as const, label: '市场分析' },
      { id: 'task.content_write' as const, label: '文案生成' },
      { id: 'task.seo_optimize' as const, label: 'SEO 优化' },
      { id: 'task.social_adapt' as const, label: '社媒适配' },
      { id: 'task.result_merge' as const, label: '结果汇总' },
    ],
    [],
  );

  const toggleTask = (taskId: AiTaskId) => {
    setSelectedTasks((prev) => (prev.includes(taskId) ? prev.filter((item) => item !== taskId) : [...prev, taskId]));
  };

  const persistHistory = async (record: CompareHistoryItem) => {
    const res = await fetchJson<{ history: CompareHistoryItem[] }>('/api/compare/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    setHistory(res.history);
  };

  const executeComparison = async () => {
    if (running || !selectedTasks.length || !selectedModels.length || !config) return;
    setRunning(true);
    setError(null);
    setResults([]);

    const baseline = config;
    const collected: CompareResultItem[] = [];
    const historyId = `compare-${Date.now()}`;

    try {
      for (const taskId of selectedTasks) {
        for (const modelId of selectedModels) {
          await fetchJson('/api/agent-models/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tasks: {
                ...baseline.effective.tasks,
                [taskId]: { model: modelId, provider: 'siliconflow' as LlmProviderId },
              },
              generation: { image: baseline.effective.generation?.image ?? '', video: baseline.effective.generation?.video ?? '' },
            }),
          });

          const response = await fetchJson<PipelineRunResponseData>('/api/pipeline/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: description.trim(),
              options: {
                productName: productName || undefined,
                category: category || undefined,
              },
            } satisfies PipelineRunRequest),
          });

          collected.push({
            taskId,
            modelId,
            status: response.status,
            pipelineId: response.pipelineId,
            finishedAt: response.generatedAt,
            durationMs: response.telemetry?.reduce((sum, item) => sum + (item.durationMs ?? 0), 0),
            totalTokens: response.telemetry?.reduce((sum, item) => sum + (item.totalTokens ?? 0), 0),
            summary: response.summary?.executiveSummary,
          });
        }
      }

      await fetchJson('/api/agent-models/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: baseline.effective.tasks, generation: baseline.effective.generation ?? {} }),
      });

      setResults(collected);
      await persistHistory({
        id: historyId,
        createdAt: new Date().toISOString(),
        taskIds: selectedTasks,
        candidateModels: selectedModels,
        status: collected.some((item) => item.status === 'failed') ? 'failed' : 'completed',
        pipelineId: collected[0]?.pipelineId ?? historyId,
        summary: collected[0]?.summary,
        totalTokens: collected.reduce((sum, item) => sum + (item.totalTokens ?? 0), 0),
        durationMs: collected.reduce((sum, item) => sum + (item.durationMs ?? 0), 0),
      });
      setActiveHistoryId(historyId);
    } catch (err) {
      try {
        await fetchJson('/api/agent-models/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks: baseline.effective.tasks, generation: baseline.effective.generation ?? {} }),
        });
      } catch {
        // ignore rollback failure
      }
      setError(err instanceof Error ? err.message : '对比执行失败');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Spinner color="secondary" label="加载对比页…" />
      </div>
    );
  }

  if (error && !config) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!config) return <ErrorState message="对比页数据不可用" onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-[24px] border border-white/8 bg-white/[0.03] shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-violet-200/80">实验输入</p>
              <h2 className="mt-2 text-xl font-semibold text-white">选择任务与候选模型</h2>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {tasks.map((task) => {
                const active = selectedTasks.includes(task.id);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${active ? 'border-violet-400/40 bg-violet-500/15' : 'border-white/10 bg-white/[0.03]'}`}
                  >
                    <p className="text-sm font-medium text-white">{task.label}</p>
                    <p className="mt-1 font-mono text-[11px] text-zinc-500">{task.id}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">候选模型（可多选）</label>
              <Select
                aria-label="候选模型"
                selectionMode="multiple"
                selectedKeys={selectedModels}
                onSelectionChange={(keys) => setSelectedModels(Array.from(keys).map(String))}
                listboxProps={{ className: 'max-h-60 overflow-y-auto' }}
              >
                {modelOptions.map((item) => (
                  <SelectItem key={item.id} textValue={item.id} className="text-zinc-100">
                    {item.id}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">任务数</p>
                <p className="mt-2 text-sm text-zinc-100">{selectedTasks.length}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">模型数</p>
                <p className="mt-2 text-sm text-zinc-100">{selectedModels.length}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">历史记录</p>
                <p className="mt-2 text-sm text-zinc-100">{history.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-[24px] border border-white/8 bg-white/[0.03] shadow-none">
          <CardBody className="space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-violet-200/80">实验描述</p>
              <h2 className="mt-2 text-xl font-semibold text-white">填写本次对比说明</h2>
            </div>
            <Textarea value={description} onValueChange={setDescription} minRows={5} label="实验说明" labelPlacement="outside" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="产品名称（可选）"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-zinc-500"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="品类（可选）"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-zinc-500"
              />
            </div>
            <Button color="secondary" isLoading={running} onPress={executeComparison} isDisabled={!selectedTasks.length || !selectedModels.length}>
              执行对比
            </Button>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-200/80">结果</p>
            <h3 className="mt-2 text-xl font-semibold text-white">任务 × 模型执行记录</h3>
          </div>
          <Chip variant="flat" color="secondary">{results.length ? `${results.length} 条` : '等待执行'}</Chip>
        </div>
        <div className="grid gap-3">
          {results.length > 0 ? results.map((item) => (
            <article key={`${item.taskId}-${item.modelId}-${item.pipelineId}`} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{tasks.find((task) => task.id === item.taskId)?.label ?? item.taskId}</p>
                  <p className="mt-1 break-all text-sm text-zinc-400">{item.modelId}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">{item.pipelineId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="flat" color={item.status === 'completed' ? 'success' : 'danger'}>{item.status}</Chip>
                  <Chip variant="flat" color="secondary">{item.totalTokens ?? 'unknown'} tokens</Chip>
                  <Chip variant="flat" color="primary">{item.durationMs ?? 0} ms</Chip>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{item.summary ?? '暂无摘要'}</p>
            </article>
          )) : (
            <div className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] p-8 text-sm text-zinc-500">
              先选择任务和模型，然后执行对比。
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-[24px] border border-white/8 bg-white/[0.03] shadow-none">
          <CardBody className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">历史</h3>
              <Button size="sm" variant="flat" className="border border-white/10 bg-white/5" onPress={() => void window.location.reload()}>
                刷新
              </Button>
            </div>
            {history.length > 0 ? history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveHistoryId(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${activeHistory?.id === item.id ? 'border-violet-400/40 bg-violet-500/15' : 'border-white/8 bg-black/20'}`}
              >
                <p className="text-sm font-medium text-white">{item.id}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.createdAt}</p>
                <p className="mt-2 text-xs text-zinc-500">任务 {item.taskIds.length} · 模型 {item.candidateModels.length}</p>
              </button>
            )) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">暂无历史记录。</div>
            )}
          </CardBody>
        </Card>

        <Card className="rounded-[24px] border border-white/8 bg-white/[0.03] shadow-none">
          <CardBody className="space-y-4 p-5">
            <h3 className="text-xl font-semibold text-white">历史详情</h3>
            {activeHistory ? (
              <div className="space-y-3 text-sm text-zinc-300">
                <p><span className="text-zinc-500">实验 ID：</span>{activeHistory.id}</p>
                <p><span className="text-zinc-500">Pipeline：</span>{activeHistory.pipelineId}</p>
                <p><span className="text-zinc-500">任务：</span>{activeHistory.taskIds.join('、')}</p>
                <p><span className="text-zinc-500">模型：</span>{activeHistory.candidateModels.join('、')}</p>
                <p><span className="text-zinc-500">耗时：</span>{activeHistory.durationMs ?? 0} ms</p>
                <p><span className="text-zinc-500">Tokens：</span>{activeHistory.totalTokens ?? 'unknown'}</p>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4 text-zinc-100">{activeHistory.summary ?? '暂无摘要'}</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">选择一条历史记录查看详情。</div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
