'use client';

import { useEffect, useState } from 'react';
import type { ApiResponse, VideoGenerationResult } from '@/types';

const TERMINAL_STATUS = new Set(['completed', 'generated', 'failed']);

const POLL_INTERVAL_MS = 6000;
const POLL_MAX_MS = 10 * 60 * 1000; // 10 分钟兜底，超时停止轮询

/**
 * 视频异步轮询：pipeline 仅提交视频任务并返回 requestId（status=submitted）。
 * 本 hook 拿到 requestId 后轮询 /api/video/status/<requestId>，拿到 url 或终态即停止。
 */
export function useVideoStatus(initial?: VideoGenerationResult): VideoGenerationResult | undefined {
  const [video, setVideo] = useState<VideoGenerationResult | undefined>(initial);

  // 新一次生成结果进来时，重置为最新初始值
  useEffect(() => {
    setVideo(initial);
  }, [initial]);

  const requestId = initial?.requestId;
  const alreadyDone = Boolean(initial?.url) || (initial ? TERMINAL_STATUS.has(initial.status) : false);

  useEffect(() => {
    if (!requestId || alreadyDone) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/video/status/${encodeURIComponent(requestId)}`);
        const json = (await res.json()) as ApiResponse<VideoGenerationResult>;
        if (cancelled) return;
        if (json.code === 0 && json.data) {
          const next = json.data;
          setVideo((prev) => ({ ...prev, ...next }));
          if (next.url || TERMINAL_STATUS.has(next.status)) return; // 终态：不再调度
        }
      } catch {
        // 单次轮询失败忽略，继续下一轮
      }
      if (cancelled || Date.now() - startedAt > POLL_MAX_MS) return;
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [requestId, alreadyDone]);

  return video;
}
