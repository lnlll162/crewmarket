'use client';

import { Chip } from '@heroui/react';
import { PIPELINE_STEPS, type StepStatus } from './constants';
import type { PipelineStepId } from '@/types';

const STATUS_STYLES: Record<
  StepStatus,
  { dot: string; ring: string; label: string; icon: string }
> = {
  pending: {
    dot: 'bg-zinc-600',
    ring: 'border-zinc-700',
    label: 'text-zinc-500',
    icon: '○',
  },
  running: {
    dot: 'bg-violet-500 animate-pulse',
    ring: 'border-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.4)]',
    label: 'text-violet-300',
    icon: '◉',
  },
  completed: {
    dot: 'bg-emerald-500',
    ring: 'border-emerald-500/40',
    label: 'text-emerald-300',
    icon: '✓',
  },
  failed: {
    dot: 'bg-red-500',
    ring: 'border-red-500/40',
    label: 'text-red-300',
    icon: '✕',
  },
};

interface PipelineProgressProps {
  stepStatus: Record<PipelineStepId, StepStatus>;
  currentStep?: PipelineStepId;
  compact?: boolean;
}

export function PipelineProgress({ stepStatus, currentStep, compact }: PipelineProgressProps) {
  const completedCount = PIPELINE_STEPS.filter((s) => stepStatus[s.id] === 'completed').length;
  const progress = Math.round((completedCount / PIPELINE_STEPS.length) * 100);
  const isActive = PIPELINE_STEPS.some(
    (s) => stepStatus[s.id] === 'running' || stepStatus[s.id] === 'completed',
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">智能体协作流程</h3>
          <p className="text-xs text-zinc-500">
            {isActive ? `${completedCount}/${PIPELINE_STEPS.length} 步已完成` : '6 个 Agent 依次协作'}
          </p>
        </div>
        {isActive && (
          <Chip size="sm" variant="flat" color="secondary">
            {progress}%
          </Chip>
        )}
      </div>

      {isActive && (
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            style={{ width: `${progress}%`, transition: 'width 0.4s ease-out' }}
          />
        </div>
      )}

      <ol className="space-y-0">
        {PIPELINE_STEPS.map((step, index) => {
          const status = stepStatus[step.id];
          const styles = STATUS_STYLES[status];
          const isCurrent = currentStep === step.id;
          const showDetail = !compact || status !== 'pending';

          if (compact && !showDetail) return null;

          return (
            <li key={step.id} className="relative flex gap-3">
              {index < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`absolute left-[11px] top-7 h-[calc(100%-4px)] w-0.5 ${
                    status === 'completed' ? 'bg-emerald-500/40' : 'bg-zinc-800'
                  }`}
                />
              )}
              <div
                className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${styles.ring} ${styles.dot} text-white`}
                style={isCurrent ? { animation: 'pulse 1.5s infinite' } : undefined}
              >
                {styles.icon}
              </div>
              <div className={`pb-5 ${compact ? 'pb-3' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-medium ${styles.label}`}>{step.label}</span>
                  <span className="text-[10px] text-zinc-600">{step.agent}</span>
                  {status === 'running' && (
                    <Chip size="sm" color="secondary" variant="dot" className="h-5">
                      进行中
                    </Chip>
                  )}
                </div>
                {!compact && (
                  <p className="mt-0.5 text-xs text-zinc-500">{step.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function PipelineOverview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {PIPELINE_STEPS.map((step, i) => (
        <div
          key={step.id}
          className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
              {i + 1}
            </span>
            <span className="text-sm font-medium text-zinc-200">{step.label}</span>
          </div>
          <p className="text-xs text-zinc-500">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
