#!/usr/bin/env python3
"""单次 STT 探针 — 供 Next.js /api/siliconflow/stt 调用。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from siliconflow.bootstrap import apply_siliconflow_env_defaults
from siliconflow.stt import transcribe_audio

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    parser.add_argument("--model", default="")
    args = parser.parse_args()
    apply_siliconflow_env_defaults()
    result = transcribe_audio(args.file, model=args.model or None)
    print(json.dumps(result, ensure_ascii=False))
