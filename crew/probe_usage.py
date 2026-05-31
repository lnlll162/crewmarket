"""最小化探测硅基流动原始 Claude-compatible 接口是否返回 usage。

不经过 CrewAI，直接 POST /chat/completions，用于确认 token 能否从原始响应拿到。

运行（项目根目录）:
  py crew/probe_usage.py

依赖 .env: SILICONFLOW_API_KEY；可选 SILICONFLOW_BASE_URL、LLM_DEFAULT_MODEL
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / '.env', override=True)

BASE_URL = os.getenv('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1').rstrip('/')
API_KEY = os.getenv('SILICONFLOW_API_KEY', '').strip()
MODEL = os.getenv('LLM_DEFAULT_MODEL', 'deepseek-ai/DeepSeek-V3').strip()
ENDPOINT = f'{BASE_URL}/chat/completions'
HEADER_KEYS = {'content-type', 'x-request-id', 'x-trace-id', 'x-ratelimit-remaining'}
BODY_PREVIEW_LEN = 4000

if not API_KEY:
    raise SystemExit('missing SILICONFLOW_API_KEY')

payload = {
    'model': MODEL,
    'messages': [
        {'role': 'system', 'content': 'You are a helpful assistant.'},
        {'role': 'user', 'content': 'Reply with exactly one short sentence.'},
    ],
    'temperature': 0,
    'stream': False,
}

print('endpoint=', ENDPOINT)
print('model=', MODEL)

with httpx.Client(timeout=60.0) as client:
    resp = client.post(
        ENDPOINT,
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
        },
        json=payload,
    )

print('status_code=', resp.status_code)
print(
    'headers=',
    json.dumps(
        {k: v for k, v in resp.headers.items() if k.lower() in HEADER_KEYS},
        ensure_ascii=False,
        indent=2,
    ),
)

try:
    data = resp.json()
except Exception:
    print('body_preview=', resp.text[:BODY_PREVIEW_LEN])
    raise

print('top_level_keys=', sorted(data.keys()))
print('has_usage=', 'usage' in data)
if 'usage' in data:
    print('usage=', json.dumps(data['usage'], ensure_ascii=False, indent=2))

body_text = json.dumps(data, ensure_ascii=False, indent=2)
print('body_preview=', body_text[:BODY_PREVIEW_LEN])