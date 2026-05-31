'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, Chip, Spinner } from '@heroui/react';
import { ErrorState } from '@/components/ui/ErrorState';
import type { ApiResponse, AiTaskId, PipelineSummaryOutput } from '@/types';

type CompareHistoryItem = {
  id: string;
  createdAt: string;
  taskIds: AiTaskId[];
  candidateModels: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  pipelineId: string;
  summary?: string;
  totalTokens?: number;
  durationMs?: number;
  roleEvaluation?: PipelineSummaryOutput['roleEvaluation'];
  moduleSummary?: PipelineSummaryOutput['moduleSummary'];
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 0 || json.data == null) throw new Error(json.message || '请求失败');
  return json.data;
}

export function CompareHistoryWorkspace() {
  const [history, setHistory] = useState<CompareHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<{ history: CompareHistoryItem[] }>('/api/compare/history');
      setHistory(data.history);
      setActiveId((prev) => prev ?? data.history[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取对比历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const active = useMemo(() => history.find((item) => item.id === activeId) ?? history[0] ?? null, [history, activeId]);

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Spinner color="secondary" label="加载对比历史…" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-violet-400/12 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/90">CrewAI · 历史沉淀</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">对比历史列表</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              独立页面用于查看每次模型对比实验记录，后续可继续扩展筛选、搜索、导出和人工评分。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip variant="flat" color="secondary">记录 {history.length}</Chip>
            <Button size="sm" variant="flat" className="border border-white/10 bg-white/5" onPress={() => void load()}>
              刷新
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-[24px] border border-white/8 bg-white/[0.03] shadow-none">
          <CardBody className="space-y-3 p-5">
            <h3 className="text-xl font-semibold text-white">历史列表</h3>
            {history.length > 0 ? history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${active?.id === item.id ? 'border-violet-400/40 bg-violet-500/15' : 'border-white/8 bg-black/20 hover:border-white/20'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item.id}</p>
                    <p className="mt-1 text-xs text-zinc-400">{item.createdAt}</p>
                  </div>
                  <Chip size="sm" variant="flat" color={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'danger' : 'secondary'}>
                    {item.status}
                  </Chip>
                </div>
                <p className="mt-3 text-xs text-zinc-400">任务 {item.taskIds.length} · 模型 {item.candidateModels.length}</p>
              </button>
            )) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                暂无对比历史记录。
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="rounded-[24px] border border-white/8 bg-white/[0.03] shadow-none">
          <CardBody className="space-y-4 p-5">
            <h3 className="text-xl font-semibold text-white">历史详情</h3>
            {active ? (
              <div className="space-y-4 text-sm text-zinc-300">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-xs text-zinc-500">Pipeline ID</p><p className="mt-1 break-all text-zinc-100">{active.pipelineId}</p></div>
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-xs text-zinc-500">创建时间</p><p className="mt-1 text-zinc-100">{active.createdAt}</p></div>
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-xs text-zinc-500">耗时</p><p className="mt-1 text-zinc-100">{active.durationMs ?? 0} ms</p></div>
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3"><p className="text-xs text-zinc-500">Tokens</p><p className="mt-1 text-zinc-100">{active.totalTokens ?? 'unknown'}</p></div>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">任务与模型</p>
                  <p className="mt-2 text-zinc-100">任务：{active.taskIds.join('、')}</p>
                  <p className="mt-1 text-zinc-100">模型：{active.candidateModels.join('、')}</p>
                </div>

                {active.summary ? (
                  <div className="rounded-xl border border-violet-400/12 bg-violet-500/8 p-4">
                    <p className="text-xs uppercase tracking-wide text-violet-200/80">摘要</p>
                    <p className="mt-2 leading-relaxed text-zinc-100">{active.summary}</p>
                  </div>
                ) : null}

                {active.roleEvaluation?.length ? (
                  <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">roleEvaluation</p>
                    <div className="mt-3 space-y-3">
                      {active.roleEvaluation.map((role) => (
                        <div key={`${active.id}-${role.roleId}`} className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium text-white">{role.roleName}</p>
                            {typeof role.score === 'number' ? <Chip size="sm" variant="flat" color="secondary">{role.score}</Chip> : null}
                          </div>
                          <p className="mt-2 text-zinc-300">{role.evaluation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {active.moduleSummary?.length ? (
                  <div className="rounded-xl border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">moduleSummary</p>
                    <div className="mt-3 space-y-3">
                      {active.moduleSummary.map((module, index) => {
                        const record = module as Record<string, unknown>;
                        const title = String(record.title ?? record.moduleName ?? record.moduleId ?? `模块 ${index + 1}`);
                        const detail = String(record.detail ?? record.summary ?? record.content ?? '暂无说明');
                        return (
                          <div key={`${active.id}-module-${index}`} className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                            <p className="font-medium text-white">{title}</p>
                            <p className="mt-1 text-zinc-300">{detail}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">请选择一条历史记录查看详情。</div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
