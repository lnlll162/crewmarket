"""验证 runner + LiteLLM 回调能否写入 usage（需 .env 中 SILICONFLOW_API_KEY）。"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

load_dotenv(ROOT / ".env", override=True)

from agents import market_research_agent  # noqa: E402
from prompts import market_research_prompt  # noqa: E402
from runner import run_json_task  # noqa: E402
from schemas import validate_market  # noqa: E402

telemetry: list[dict] = []
product = {
    "productName": {"value": "便携保温杯", "status": "confirmed"},
    "category": {"value": "水具", "status": "confirmed"},
    "attributes": {"value": ["304不锈钢", "500ml"], "status": "confirmed"},
    "sellingPoints": {"value": ["保冷12小时"], "status": "confirmed"},
    "summary": "轻便保温杯",
}

result = run_json_task(
    market_research_agent(),
    market_research_prompt(product, "无"),
    "合法 JSON，含 marketTrends competitorStyle userPersona brandTone visualStyle marketingSuggestions",
    validate_market,
    max_retries=1,
    timeout_seconds=180,
    telemetry=telemetry,
    role_id="market_research",
    role_name="市场分析",
    module_id="marketResearch",
    model=os.getenv("LLM_DEFAULT_MODEL", "deepseek-ai/DeepSeek-V3"),
)

print("task_usage=", json.dumps(result.get("usage"), ensure_ascii=False))
print("telemetry=", json.dumps(telemetry, ensure_ascii=False, indent=2))
