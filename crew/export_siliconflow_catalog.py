#!/usr/bin/env python3
"""向 stdout 输出硅基流动模型目录 JSON。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from siliconflow.account_catalog import fetch_complete_account_catalog
from siliconflow.bootstrap import apply_siliconflow_env_defaults
from siliconflow.catalog import fetch_verified_catalog

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["verified", "account"], default="verified")
    args = parser.parse_args()

    apply_siliconflow_env_defaults()
    payload = fetch_complete_account_catalog() if args.mode == "account" else fetch_verified_catalog()
    print(json.dumps(payload, ensure_ascii=False))
