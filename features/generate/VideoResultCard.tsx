'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Chip } from '@heroui/react';
import type { VideoGenerationResult } from '@/types';
import { useVideoStatus } from './useVideoStatus';

function StatusChip({ status, hasVideo }: { status?: string; hasVideo: boolean }) {
  const color = status === 'failed' ? 'danger' : hasVideo ? 'success' : 'warning';
  const label =
    status === 'submitted'
      ? '已提交'
      : status === 'processing'
        ? '生成中'
        : status === 'completed' || status === 'generated' || hasVideo
          ? '已完成'
          : status === 'failed'
            ? '失败'
            : status ?? '待处理';
  return (
    <Chip size="sm" variant="flat" color={color}>
      {label}
    </Chip>
  );
}

function ElapsedTimer({ running }: { running: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!running) return null;
  return <span className="text-xs text-cyan-200/60">已等待 {elapsed}s</span>;
}

/**
 * 视频结果卡片：拿到 pipeline 返回的 videoGeneration（含 requestId）后，
 * 通过 useVideoStatus 轮询状态接口，生成中显示进度，完成后渲染可播放视频。
 */
export function VideoResultCard({ data }: { data?: VideoGenerationResult }) {
  const video = useVideoStatus(data);
  if (!data) return null;

  const v = video ?? data;
  const hasVideo = Boolean(v.url);
  const isFailed = v.status === 'failed';
  const inProgress = !hasVideo && !isFailed;
  const copyLink = (link: string) => void navigator.clipboard.writeText(link);

  return (
    <div className="rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.07]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">视频生成</p>
        <StatusChip status={v.status} hasVideo={hasVideo} />
        <ElapsedTimer running={inProgress} />
        {v.requestId && (
          <Chip size="sm" variant="flat" color="secondary">
            request {v.requestId}
          </Chip>
        )}
      </div>

      {v.prompt && <p className="mb-2 text-xs text-zinc-400">提示词：{v.prompt}</p>}

      {hasVideo && (
        <div className="mt-1 space-y-3">
          <div className="overflow-hidden rounded-[18px] border border-cyan-400/14 bg-black/30">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={v.url} controls className="h-auto w-full max-h-[420px]">
              <track kind="captions" />
            </video>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="flat"
              color="secondary"
              onPress={() => copyLink(v.url!)}
              className="border border-cyan-400/18 bg-white/5 text-cyan-100"
            >
              复制链接
            </Button>
            <Button
              size="sm"
              variant="flat"
              as="a"
              href={v.url}
              download
              className="border border-cyan-400/18 bg-white/5 text-cyan-100"
            >
              下载视频
            </Button>
          </div>
        </div>
      )}

      {inProgress && (
        <div className="mt-1 flex items-center gap-3 rounded-[18px] border border-cyan-400/14 bg-cyan-500/8 p-3">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
          <p className="text-sm text-cyan-200/80">
            {v.status === 'submitted'
              ? '已提交生成任务，正在排队…（约 1–3 分钟，可继续查看其他结果）'
              : '正在生成视频…（约 1–3 分钟，完成后自动显示）'}
          </p>
        </div>
      )}

      {isFailed && (
        <div className="mt-1 rounded-[18px] border border-red-400/18 bg-red-500/8 p-3">
          <p className="text-sm text-red-300">视频生成失败{v.error ? `：${v.error}` : ''}</p>
        </div>
      )}

      {v.seed !== undefined && <p className="mt-2 text-xs text-zinc-500">Seed：{String(v.seed)}</p>}
    </div>
  );
}
