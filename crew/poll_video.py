#!/usr/bin/env python3
"""单次查询硅基流动视频任务状态 — 从 stdin 读 {"requestId": "..."}，向 stdout 输出归一化 JSON。

供 Next.js `/api/video/status/<requestId>` 轮询调用。刻意保持轻量：只加载 .env 与 generation，
不触发 run_pipeline 的整套 LLM 模型校验（查视频状态只需要 SILICONFLOW_API_KEY）。
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from dotenv import load_dotenv

# 加载项目根目录 .env，强制覆盖，确保拿到 SILICONFLOW_API_KEY
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from generation import poll_video_status  # noqa: E402


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    request_id = (payload.get("requestId") or "").strip() if isinstance(payload, dict) else ""

    if not request_id:
        print(json.dumps({"status": "failed", "error": "缺少 requestId"}, ensure_ascii=False))
        return

    try:
        result = poll_video_status(request_id)
    except Exception as exc:  # noqa: BLE001 — 任何异常都回传为 failed，便于前端停止轮询
        result = {
            "status": "failed",
            "requestId": request_id,
            "provider": "siliconflow",
            "error": str(exc),
        }

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
