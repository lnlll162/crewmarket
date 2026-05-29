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
    <div className="rounded-[28px] border border-violet-400/16 bg-[linear-gradient(180deg,rgba(26,20,44,0.92),rgba(12,12,18,0.96))] p-5 shadow-[0_26px_78px_rgba(0,0,0,0.36)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-violet-300/26 hover:shadow-[0_30px_86px_rgba(0,0,0,0.42)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">首页生成流程</h3>
          <p className="text-xs text-zinc-500">
            {isActive ? `${completedCount}/${PIPELINE_STEPS.length} 步已完成` : '按顺序执行产品提取、市场分析、内容生成、SEO 优化、社媒适配与汇总校验'}
          </p>
        </div>
        {isActive && (
          <Chip size="sm" variant="flat" color="secondary" className="bg-white/10 text-violet-100">
            {progress}%
          </Chip>
        )}
      </div>

      {isActive && (
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
            style={{ width: `${progress}%`, transition: 'width 0.4s ease-out' }}
          />
        </div>
      )}

      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {PIPELINE_STEPS.map((step) => {
          const status = stepStatus[step.id];
          const styles = STATUS_STYLES[status];
          const isCurrent = currentStep === step.id;
          const showDetail = !compact || status !== 'pending';

          if (compact && !showDetail) return null;

          return (
            <li
              key={step.id}
              className="rounded-[22px] border border-white/6 bg-white/[0.04] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/22 hover:bg-white/[0.06] hover:shadow-[0_14px_34px_rgba(0,0,0,0.2)]"
            >
              <div className="flex gap-3">
                <div
                  className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${styles.ring} ${styles.dot} text-white`}
                  style={isCurrent ? { animation: 'pulse 1.5s infinite' } : undefined}
                >
                  {styles.icon}
                </div>
                <div className="min-w-0 flex-1">
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
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{step.description}</p>
                  )}
                </div>
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
          className="rounded-[22px] border border-white/6 bg-white/[0.04] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/22 hover:bg-white/[0.06] hover:shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
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
