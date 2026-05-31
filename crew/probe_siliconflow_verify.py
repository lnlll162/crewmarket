"""Gate H：校验硅基流动白名单绑定（.env 合规 + 可选 live 最小调用）。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

from siliconflow.bootstrap import apply_siliconflow_env_defaults, assert_env_models_whitelisted
from siliconflow.catalog import fetch_verified_catalog
from siliconflow.verified_models import to_profile_dict
from siliconflow.verify import run_full_verify


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="对白名单模型做最小 chat/embedding/rerank 调用")
    args = parser.parse_args()

    apply_siliconflow_env_defaults()
    assert_env_models_whitelisted()

    profile = to_profile_dict()
    catalog = fetch_verified_catalog()
    print("profileId:", profile["profileId"])
    print("tasks:", len(profile["tasks"]), "generation:", len(profile["generation"]), "auxiliary:", len(profile["auxiliary"]))

    for cap_id, block in (catalog.get("capabilities") or {}).items():
        verified_count = sum(1 for m in block.get("models") or [] if m.get("verified"))
        print(f"  [{cap_id}] scope={block.get('scope')} default={block.get('defaultModel')} verified_in_list={verified_count}")

    if args.live:
        report = run_full_verify()
        print(json.dumps(report, ensure_ascii=False, indent=2))
        if not report.get("ok"):
            raise SystemExit(1)
        print("\n提示: 完整逐模型表格请运行 py crew/probe_all_models.py")

    print("\nprobe_siliconflow_verify: PASS")


if __name__ == "__main__":
    main()
