"""Schema 校验冒烟测试 — 无需 API Key。"""

from schemas import (
    parse_json,
    validate_content,
    validate_market,
    validate_merge_review,
    validate_product,
    validate_seo,
    validate_social,
)


def test_parse_json_fence() -> None:
    assert parse_json('```json\n{"a": 1}\n```')["a"] == 1


def test_validate_product() -> None:
    product = validate_product(
        {
            "productName": {"value": "智能手环", "status": "confirmed"},
            "category": {"value": "穿戴设备", "status": "confirmed"},
            "attributes": {"value": ["黑色", "硅胶"], "status": "confirmed"},
            "sellingPoints": {"value": ["双表带", "轻薄"], "status": "confirmed"},
            "summary": "一款智能手环产品摘要，适合日常佩戴与运动场景使用，支持多种表带更换。",
        }
    )
    assert product["productName"]["value"] == "智能手环"


def test_validate_content() -> None:
    content = validate_content(
        {
            "title": "智能手环 - 双款表带随心换",
            "sellingPointCopy": ["织物表带 - 透气", "硅胶表带 - 防汗", "矩形屏 - 易读"],
            "detailPageContent": "x" * 120,
            "conversionDescription": "立即选购，体验双款表带随心切换的佩戴自由！",
        }
    )
    assert len(content["sellingPointCopy"]) == 3


def test_validate_social_platforms() -> None:
    social = validate_social(
        {
            "copies": [
                {"platform": "小红书", "content": "种草文案" * 10, "hashtags": ["时尚", "健康"]},
                {"platform": "weibo", "content": "微博文案" * 10, "hashtags": ["智能穿戴", "新品"]},
                {"platform": "douyin", "content": "抖音文案" * 10, "hashtags": ["好物推荐", "智能手环"]},
            ],
            "scriptSuggestion": "开场展示表带切换",
        }
    )
    assert [c["platform"] for c in social["copies"]] == ["xiaohongshu", "weibo", "douyin"]


if __name__ == "__main__":
    test_parse_json_fence()
    test_validate_product()
    test_validate_content()
    test_validate_social_platforms()
    validate_market(
        {
            "marketTrends": "趋势" * 20,
            "competitorStyle": "竞品" * 15,
            "userPersona": "用户" * 15,
            "marketingSuggestions": ["建议1", "建议2", "建议3"],
        }
    )
    validate_seo(
        {
            "keywords": ["a", "b", "c", "d", "e"],
            "optimizedTitle": "优化标题示例文字",
            "searchFriendlyCopy": "搜索友好文案",
        }
    )
    validate_merge_review(
        {
            "consistencyNotes": ["检查通过"],
            "pendingConfirmations": [],
        }
    )
    print("schemas OK")
