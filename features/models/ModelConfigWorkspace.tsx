'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Select, SelectItem, Spinner } from '@heroui/react';
import { ErrorState } from '@/components/ui/ErrorState';
import type { ApiResponse } from '@/types';
import type {
  AgentModelCapabilityRow,
  AgentModelConfigResponse,
  AgentModelConfigRow,
  SaveAgentModelConfigRequest,
} from '@/types/agent-model-config';
import type { ConfigBindingProbeReport } from '@/app/lib/agent-model-probe';
import type { AiTaskId, LlmProviderId } from '@/types';
import type { SiliconFlowCatalog, SiliconFlowModelItem } from '@/types/siliconflow';
import { AI_TASK_ORDER } from '@/types';

type DraftTasks = Record<AiTaskId, { model: string; provider: LlmProviderId }>;

interface DraftConfig {
  tasks: DraftTasks;
  generation: { image: string };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 0 || json.data == null) throw new Error(json.message || '请求失败');
  return json.data;
}

const SELECT_POPOVER_PROPS = {
  placement: 'bottom' as const,
  offset: 10,
  shouldBlockScroll: true,
  classNames: {
    content:
      'z-[9999] max-h-72 overflow-hidden border border-violet-400/20 bg-[#12121a] p-1 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl',
  },
};

const SELECT_CLASS_NAMES = {
  trigger: 'min-h-11 border border-white/10 bg-white/[0.04] data-[hover=true]:bg-white/[0.07]',
  value: 'text-sm text-zinc-100',
  label: 'text-zinc-400',
};

function verifiedOptions(catalog: SiliconFlowCatalog | null, capabilityId: string, fallback: string): SiliconFlowModelItem[] {
  const list = catalog?.capabilities[capabilityId]?.models?.filter((item) => item.verified) ?? [];
  if (list.some((item) => item.id === fallback)) return list;
  if (list.length > 0) return list;
  return [{ id: fallback, verified: true }];
}

function sourceLabel(source: 'saved' | 'env' | 'default') {
  if (source === 'saved') return '已保存';
  if (source === 'env') return '环境变量';
  return '默认白名单';
}

function draftFromConfig(data: AgentModelConfigResponse): DraftConfig {
  return {
    tasks: Object.fromEntries(
      AI_TASK_ORDER.map((taskId) => [
        taskId,
        {
          model: data.effective.tasks[taskId]?.model ?? '',
          provider: data.effective.tasks[taskId]?.provider ?? 'siliconflow',
        },
      ]),
    ) as DraftTasks,
    generation: {
      image: data.effective.generation?.image ?? '',
    },
  };
}

function BindingCard({
  title,
  subtitle,
  bindingId,
  capabilityId,
  envVar,
  source,
  currentModel,
  selected,
  changed,
  options,
  disabled,
  onChange,
}: {
  title: string;
  subtitle: string;
  bindingId: string;
  capabilityId: string;
  envVar: string;
  source: 'saved' | 'env' | 'default';
  currentModel: string;
  selected: string;
  changed: boolean;
  options: SiliconFlowModelItem[];
  disabled?: boolean;
  onChange: (model: string) => void;
}) {
  return (
    <article className="relative rounded-[20px] border border-white/8 bg-white/[0.03] p-5 transition hover:border-violet-400/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <Chip size="sm" variant="flat" color="secondary">
              {capabilityId}
            </Chip>
            <Chip size="sm" variant="flat" color="primary">
              主链路
            </Chip>
            <Chip size="sm" variant="flat" color={source === 'saved' ? 'success' : 'warning'}>
              {sourceLabel(source)}
            </Chip>
          </div>
          <p className="text-sm text-zinc-400">{subtitle}</p>
          <p className="font-mono text-xs text-zinc-500">{bindingId}</p>
        </div>
        {changed ? (
          <Chip size="sm" color="secondary" variant="flat">
            未保存
          </Chip>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-2 rounded-xl border border-white/6 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">当前生效</p>
          <p className="break-all text-sm text-zinc-100">{currentModel}</p>
          <p className="text-xs text-zinc-500">{envVar}</p>
        </div>
        <Select
          label="选择模型"
          labelPlacement="outside"
          aria-label={`${title} 模型`}
          selectedKeys={[selected]}
          isDisabled={disabled}
          onSelectionChange={(keys) => {
            const model = Array.from(keys)[0];
            if (model) onChange(String(model));
          }}
          popoverProps={SELECT_POPOVER_PROPS}
          classNames={{ ...SELECT_CLASS_NAMES, base: 'space-y-2' }}
          listboxProps={{ className: 'max-h-60 overflow-y-auto' }}
        >
          {options.map((item) => (
            <SelectItem key={item.id} textValue={item.id} className="text-zinc-100">
              <span className="truncate text-sm">{item.id}</span>
            </SelectItem>
          ))}
        </Select>
      </div>
    </article>
  );
}

export function ModelConfigWorkspace({ initialConfig }: { initialConfig?: AgentModelConfigResponse }) {
  const [loading, setLoading] = useState(!initialConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<AgentModelConfigResponse | null>(initialConfig ?? null);
  const [catalog, setCatalog] = useState<SiliconFlowCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [draft, setDraft] = useState<DraftConfig | null>(initialConfig ? draftFromConfig(initialConfig) : null);
  const [probing, setProbing] = useState(false);
  const [probeReport, setProbeReport] = useState<ConfigBindingProbeReport | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<AgentModelConfigResponse>('/api/agent-models/config');
      setConfig(data);
      setDraft(draftFromConfig(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      setCatalog(await fetchJson<SiliconFlowCatalog>('/api/siliconflow/models?mode=verified'));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载模型目录失败');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialConfig) void loadConfig();
  }, [initialConfig, loadConfig]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const dirty = useMemo(() => {
    if (!config || !draft) return false;
    const taskDirty = AI_TASK_ORDER.some((id) => draft.tasks[id].model !== config.effective.tasks[id]?.model);
    const genDirty = draft.generation.image !== (config.effective.generation?.image ?? '');
    return taskDirty || genDirty;
  }, [config, draft]);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const body: SaveAgentModelConfigRequest = {
        tasks: draft.tasks,
        generation: draft.generation,
      };
      const result = await fetchJson<{ snapshot: AgentModelConfigResponse }>('/api/agent-models/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setConfig(result.snapshot);
      setDraft(draftFromConfig(result.snapshot));
      setMessage('配置已保存。请返回首页重新运行 Pipeline 后生效（进行中的任务不受影响）。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await fetchJson<{ snapshot: AgentModelConfigResponse }>('/api/agent-models/config', {
        method: 'DELETE',
      });
      setConfig(result.snapshot);
      setDraft(draftFromConfig(result.snapshot));
      setMessage('已删除本地覆盖，恢复为环境变量或白名单默认');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleProbe = async (mode: 'offline' | 'live') => {
    setProbing(true);
    setError(null);
    setProbeReport(null);
    try {
      const report = await fetchJson<ConfigBindingProbeReport>(`/api/agent-models/probe?mode=${mode}`, {
        method: 'POST',
      });
      setProbeReport(report);
      if (report.ok) {
        setMessage(mode === 'live' ? '8 项绑定 live 探针全部通过' : '配置文件与环境变量一致');
      } else {
        setError(mode === 'live' ? '部分绑定 live 探针失败，请查看下方结果' : '配置文件未正确注入环境变量');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '探针执行失败');
    } finally {
      setProbing(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (!config) return;
    setDraft({
      tasks: Object.fromEntries(
        AI_TASK_ORDER.map((taskId) => [
          taskId,
          { model: config.defaults.tasks[taskId]?.model ?? '', provider: 'siliconflow' as LlmProviderId },
        ]),
      ) as DraftTasks,
      generation: {
        image: config.defaults.generation?.image ?? '',
      },
    });
    setMessage('已填入默认白名单，点击「保存配置」后写入文件');
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner color="secondary" label="加载模型配置…" />
      </div>
    );
  }

  if (error && !config) return <ErrorState message={error} onRetry={() => void loadConfig()} />;
  if (!config || !draft) return <ErrorState message="配置数据为空" onRetry={() => void loadConfig()} />;

  const renderTask = (row: AgentModelConfigRow) => (
    <BindingCard
      key={row.taskId}
      title={row.moduleLabel}
      subtitle={row.roleName}
      bindingId={row.taskId}
      capabilityId={row.capabilityId}
      envVar={row.envVar}
      source={row.source}
      currentModel={row.currentModel}
      selected={draft.tasks[row.taskId].model}
      changed={draft.tasks[row.taskId].model !== config.effective.tasks[row.taskId]?.model}
      options={verifiedOptions(catalog, row.capabilityId, row.defaultModel)}
      disabled={catalogLoading && !catalog}
      onChange={(model) =>
        setDraft((prev) => (prev ? { ...prev, tasks: { ...prev.tasks, [row.taskId]: { ...prev.tasks[row.taskId], model } } } : prev))
      }
    />
  );

  const renderCapability = (row: AgentModelCapabilityRow, selected: string, onChange: (model: string) => void) => (
    <BindingCard
      key={row.bindingId}
      title={row.label}
      subtitle={row.description}
      bindingId={row.bindingId}
      capabilityId={row.capabilityId}
      envVar={row.envVar}
      source={row.source}
      currentModel={row.currentModel}
      selected={selected}
      changed={selected !== row.currentModel}
      options={verifiedOptions(catalog, row.capabilityId, row.defaultModel)}
      disabled={catalogLoading && !catalog}
      onChange={onChange}
    />
  );

  const bindingCount = config.rows.length + config.capabilityRows.length;

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-violet-400/12 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/90">主 Pipeline 模型</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">任务与文生图配置</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              仅包含首页一键 Pipeline 实际使用的 {bindingCount} 项绑定（7 个 LLM Task + 文生图）。
              保存后写入 <code className="text-violet-200">{config.configPath}</code>，下次运行 Pipeline 生效。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="flat"
              className="border border-white/10 bg-white/5"
              onPress={() => void handleProbe('offline')}
              isLoading={probing}
              isDisabled={saving}
            >
              校验配置注入
            </Button>
            <Button
              variant="flat"
              className="border border-violet-400/20 bg-violet-500/10"
              onPress={() => void handleProbe('live')}
              isLoading={probing}
              isDisabled={saving}
            >
              最小 live 探针
            </Button>
            <Button variant="flat" className="border border-white/10 bg-white/5" onPress={handleRestoreDefaults} isDisabled={saving || probing}>
              恢复默认
            </Button>
            <Button variant="flat" className="border border-white/10 bg-white/5" onPress={() => void handleReset()} isDisabled={saving || probing}>
              删除本地覆盖
            </Button>
            <Button color="secondary" onPress={() => void handleSave()} isLoading={saving} isDisabled={(!dirty && !saving) || probing}>
              保存配置
            </Button>
          </div>
        </div>
        {message ? <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
        {probeReport ? (
          <div className="mt-4 space-y-3 rounded-xl border border-white/8 bg-black/20 p-4">
            <p className="text-sm font-medium text-zinc-200">探针结果</p>
            {(probeReport.offline?.results ?? probeReport.live?.results ?? []).map((row) => (
              <div key={row.bindingId} className="flex flex-wrap items-center gap-2 text-xs">
                <Chip size="sm" variant="flat" color={row.ok ? 'success' : 'danger'}>
                  {row.ok ? 'OK' : 'FAIL'}
                </Chip>
                <span className="font-mono text-zinc-300">{row.bindingId}</span>
                <span className="text-zinc-500">{row.modelId ?? row.actualModelId ?? row.expectedModelId}</span>
                {row.error ? <span className="text-rose-300">{row.error}</span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {catalogLoading ? (
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Spinner size="sm" color="secondary" />
          加载模型目录…
        </div>
      ) : null}

      <section className="space-y-4 overflow-visible">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-200/80">LLM 任务（7）</h3>
        {config.rows.map(renderTask)}
      </section>

      <section className="space-y-4 overflow-visible">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-200/80">文生图（1）</h3>
        {config.capabilityRows.map((row) =>
          renderCapability(row, draft.generation.image, (model) =>
            setDraft((prev) => (prev ? { ...prev, generation: { image: model } } : prev)),
          ),
        )}
      </section>
    </div>
  );
}
