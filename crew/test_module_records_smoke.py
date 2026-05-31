"""modules[] 过程记录 smoke test — 不调用 LLM。"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from module_records import (
    MODULE_META,
    build_full_pipeline_modules,
    build_module_record,
    build_partial_modules_from_steps,
    summarize_product_input,
    summarize_product_output,
)
from prompts import PROMPT_VERSIONS

REQUIRED_MODULE_FIELDS = {
    "moduleId",
    "moduleName",
    "roleId",
    "roleName",
    "status",
    "inputSummary",
    "outputSummary",
    "promptVersion",
    "raw",
}


def _fixture_product() -> dict:
    return {
        "productName": {"value": "便携保温杯", "status": "confirmed"},
        "category": {"value": "水具", "status": "confirmed"},
        "attributes": {"value": ["304不锈钢", "500ml"], "status": "confirmed"},
        "sellingPoints": {"value": ["保冷12小时", "轻量便携"], "status": "confirmed"},
        "summary": "适合通勤的轻便保温杯。",
    }


def _fixture_market() -> dict:
    return {
        "marketTrends": "轻量通勤杯需求稳定。",
        "competitorStyle": "强调材质与保温时长。",
        "userPersona": "通勤白领。",
        "brandTone": "实用克制。",
        "visualStyle": "极简白底。",
        "marketingSuggestions": ["突出通勤场景", "对比保温时长", "强调轻量"],
    }


def _fixture_content() -> dict:
    return {
        "title": "通勤必备轻量保温杯",
        "sellingPointCopy": ["304不锈钢 - 安心材质", "500ml - 刚好一杯"],
        "detailPageContent": "通勤路上也能喝到合适温度的水。",
        "conversionDescription": "现在下单，通勤更省心。",
        "videoScript": "镜头1：打开杯盖。",
        "posterCopy": {"headline": "通勤一杯刚好", "subheadline": "轻量保温", "slogan": "路上也有好温度"},
        "imageIdeas": [{"title": "主图", "description": "白底产品", "usage": "主图"}],
        "videoMaterial": {"hook": "早上赶时间？", "scenes": ["场景1"], "voiceover": "口播", "caption": "封面"},
    }


def _fixture_seo() -> dict:
    return {
        "keywords": ["保温杯", "通勤杯", "不锈钢杯"],
        "optimizedTitle": "304不锈钢通勤保温杯 500ml",
        "searchFriendlyCopy": "适合通勤的轻量保温杯，304不锈钢内胆。",
        "channelAdaptation": {"xiaohongshu": "小红书文案", "weibo": "微博文案", "douyin": "抖音文案"},
    }


def _fixture_social() -> dict:
    return {
        "copies": [
            {"platform": "xiaohongshu", "content": "种草文案", "hashtags": ["通勤好物"]},
            {"platform": "weibo", "content": "微博文案", "hashtags": ["保温杯"]},
        ],
        "scriptSuggestion": "15秒脚本建议",
    }


def _fixture_merged() -> dict:
    return {
        "package": {},
        "consistencyNotes": ["各模块字段完整，已通过程序化一致性检查"],
        "pendingConfirmations": [],
    }


def _fixture_telemetry() -> list[dict]:
    rows = []
    for module_id, model in [
        ("productExtract", "baidu/ERNIE-Image-Turbo"),
        ("marketResearch", "deepseek-ai/DeepSeek-V3"),
        ("content", "deepseek-ai/DeepSeek-V3"),
        ("seo", "deepseek-ai/DeepSeek-V3"),
        ("social", "deepseek-ai/DeepSeek-V3"),
        ("merged", "deepseek-ai/DeepSeek-V3"),
    ]:
        rows.append(
            {
                "moduleId": module_id,
                "model": model,
                "provider": "siliconflow",
                "roleId": MODULE_META[module_id][0],
                "roleName": MODULE_META[module_id][1],
                "startedAt": "2026-05-30T00:00:00Z",
                "finishedAt": "2026-05-30T00:00:10Z",
                "durationMs": 10000,
                "inputTokens": 100,
                "outputTokens": 50,
                "totalTokens": 150,
                "status": "success",
            }
        )
    return rows


def test_prompt_versions_cover_all_modules() -> None:
    for module_id in MODULE_META:
        assert module_id in PROMPT_VERSIONS, f"missing PROMPT_VERSIONS[{module_id}]"
        assert PROMPT_VERSIONS[module_id].startswith("v"), module_id


def test_summarize_product_input_output() -> None:
    product = _fixture_product()
    input_summary = summarize_product_input("一款轻便保温杯", options={"productName": "测试杯"})
    output_summary = summarize_product_output(product)
    assert "文字描述" in input_summary
    assert "便携保温杯" in output_summary
    assert len(output_summary) <= 220


def test_build_module_record_required_fields() -> None:
    telemetry = _fixture_telemetry()
    record = build_module_record(
        "marketResearch",
        telemetry=telemetry,
        raw=_fixture_market(),
        input_summary="输入摘要",
        output_summary="输出摘要",
    )
    missing = REQUIRED_MODULE_FIELDS - set(record.keys())
    assert not missing, f"missing fields: {missing}"
    assert record["promptVersion"] == "v1.0.0"
    assert record["inputTokens"] == 100
    assert record["moduleName"] == "市场分析"


def test_build_full_pipeline_modules_six_steps() -> None:
    product = _fixture_product()
    market = _fixture_market()
    content = _fixture_content()
    seo = _fixture_seo()
    social = _fixture_social()
    merged = _fixture_merged()
    telemetry = _fixture_telemetry()

    modules = build_full_pipeline_modules(
        telemetry=telemetry,
        product=product,
        market_research=market,
        content=content,
        seo=seo,
        social=social,
        merged=merged,
        description="一款轻便保温杯",
        image_url=None,
        image_base64=None,
        options={"category": "水具"},
        options_text='{"category": "水具"}',
        category="水具",
        pending=[],
    )

    assert len(modules) == 6
    ids = [item["moduleId"] for item in modules]
    assert ids == [
        "productExtract",
        "marketResearch",
        "content",
        "seo",
        "social",
        "merged",
    ]
    for item in modules:
        missing = REQUIRED_MODULE_FIELDS - set(item.keys())
        assert not missing, f"{item['moduleId']} missing {missing}"
        assert item["inputSummary"]
        assert item["outputSummary"]


def test_build_partial_modules_from_steps() -> None:
    product = _fixture_product()
    market = _fixture_market()
    steps = {"productExtract": product, "marketResearch": market}
    modules = build_partial_modules_from_steps(
        steps,
        _fixture_telemetry()[:2],
        description="一款轻便保温杯",
        options_text="无",
    )
    assert len(modules) == 2
    assert modules[0]["moduleId"] == "productExtract"
    assert modules[1]["outputSummary"]


def main() -> None:
    test_prompt_versions_cover_all_modules()
    test_summarize_product_input_output()
    test_build_module_record_required_fields()
    test_build_full_pipeline_modules_six_steps()
    test_build_partial_modules_from_steps()
    print("test_module_records_smoke: OK")


if __name__ == "__main__":
    main()
