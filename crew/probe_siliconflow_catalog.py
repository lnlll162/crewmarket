"""探测硅基流动模型目录。

默认输出 **已实测白名单**（与重构一致）；加 --account 才 dump 账号全部模型。
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from siliconflow.bootstrap import apply_siliconflow_env_defaults, assert_env_models_whitelisted
from siliconflow.catalog import fetch_account_catalog, fetch_verified_catalog
from siliconflow.embeddings import create_embeddings
from siliconflow.rerank import rerank_documents


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--account", action="store_true", help="输出账号全部模型（非生产默认）")
    parser.add_argument("--probe-call", action="store_true", help="对 embedding/rerank 做最小调用")
    args = parser.parse_args()

    apply_siliconflow_env_defaults()
    assert_env_models_whitelisted()

    catalog = fetch_account_catalog() if args.account else fetch_verified_catalog()
    print(json.dumps(catalog, ensure_ascii=False, indent=2))

    caps = catalog.get("capabilities") or {}
    for cap_id, block in caps.items():
        count = len(block.get("models") or [])
        print(f"[{cap_id}] {block.get('label')} models={count} default={block.get('defaultModel')}")

    if args.probe_call:
        emb = create_embeddings("CrewMarket 探针测试")
        print("embedding OK dims=", len((emb.get("data") or [{}])[0].get("embedding") or []))
        rr = rerank_documents("保温杯", ["苹果", "不锈钢保温杯", "香蕉"], top_n=2)
        print("rerank OK results=", len(rr.get("results") or []))

    print("\nprobe_siliconflow_catalog: PASS")


if __name__ == "__main__":
    main()
