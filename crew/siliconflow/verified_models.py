"""硅基流动已实测模型白名单 — 唯一允许作为默认/production 绑定的来源。

与重构要求对齐：
- 单供应商 siliconflow + 单 Key
- 按 AiTaskId / Pipeline 步骤绑定不同模型（AGENT_MODEL_*）
- 仅收录 Gate 或专项探针实测通过的模型 ID
- 未实测能力不写入 bootstrap 必填项
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from config import AiTaskId

VerifiedBy = Literal["gate", "probe", "pipeline"]

Scope = Literal["pipeline", "auxiliary", "optional"]


@dataclass(frozen=True)
class VerifiedBinding:
    model_id: str
    env_var: str
    scope: Scope
    verified_by: VerifiedBy
    gate_or_probe: str
    notes: str = ""


# ─── 7 个 AI Task（与 types/index.ts AI_TASK_ORDER 一致）────────────
VERIFIED_TASK_MODELS: dict[AiTaskId, VerifiedBinding] = {
    "task.product_extract": VerifiedBinding(
        model_id="Qwen/Qwen3-VL-32B-Instruct",
        env_var="AGENT_MODEL_PRODUCT_EXTRACT_MODEL",
        scope="pipeline",
        verified_by="gate",
        gate_or_probe="Gate C · probe_modules --live",
        notes="Vision 识图；产品分析 / Pipeline 第 1 步",
    ),
    "task.market_research": VerifiedBinding(
        model_id="deepseek-ai/DeepSeek-V3",
        env_var="AGENT_MODEL_MARKET_RESEARCH_MODEL",
        scope="pipeline",
        verified_by="gate",
        gate_or_probe="Gate C · probe_modules --live",
        notes="市场与品牌策略",
    ),
    "task.content_write": VerifiedBinding(
        model_id="Qwen/Qwen2.5-72B-Instruct",
        env_var="AGENT_MODEL_CONTENT_WRITE_MODEL",
        scope="pipeline",
        verified_by="gate",
        gate_or_probe="2026-05-25 账号实测 · docs/api",
        notes="营销文案与物料 JSON",
    ),
    "task.seo_optimize": VerifiedBinding(
        model_id="THUDM/GLM-4-32B-0414",
        env_var="AGENT_MODEL_SEO_OPTIMIZE_MODEL",
        scope="pipeline",
        verified_by="gate",
        gate_or_probe="2026-05-25 账号实测 · docs/api",
        notes="SEO 结构化输出",
    ),
    "task.social_adapt": VerifiedBinding(
        model_id="Qwen/Qwen2.5-32B-Instruct",
        env_var="AGENT_MODEL_SOCIAL_ADAPT_MODEL",
        scope="pipeline",
        verified_by="gate",
        gate_or_probe="2026-05-25 账号实测 · docs/api",
        notes="社媒短文案",
    ),
    "task.result_merge": VerifiedBinding(
        model_id="deepseek-ai/DeepSeek-V3",
        env_var="AGENT_MODEL_RESULT_MERGE_MODEL",
        scope="pipeline",
        verified_by="gate",
        gate_or_probe="Gate F · probe_summary --live",
        notes="汇总评估（程序化 package + LLM summary）",
    ),
    "task.pdf_report": VerifiedBinding(
        model_id="deepseek-ai/DeepSeek-V3",
        env_var="AGENT_MODEL_PDF_REPORT_MODEL",
        scope="pipeline",
        verified_by="gate",
        gate_or_probe="Gate G · test_pdf_report_smoke",
        notes="独立 PDF 报告 Agent，与 merge 模型分离配置位",
    ),
}

# Pipeline 多模态生成（content 步骤内 generate_image / video jobs）
VERIFIED_GENERATION_MODELS: dict[str, VerifiedBinding] = {
    "image": VerifiedBinding(
        model_id="baidu/ERNIE-Image-Turbo",
        env_var="AGENT_IMAGE_MODEL",
        scope="pipeline",
        verified_by="gate",
        gate_or_probe="2025-05-25 项目默认 · config/generation",
        notes="Pipeline 海报/创意配图生成",
    ),
    "video": VerifiedBinding(
        model_id="Wan-AI/Wan2.2-T2V-A14B",
        env_var="AGENT_VIDEO_MODEL",
        scope="pipeline",
        verified_by="probe",
        gate_or_probe="2026-05-30 账号 /models text-to-video 唯一可用",
        notes="/api/video/jobs 提交",
    ),
}

# 辅助能力：已接 API，尚未接入主 Pipeline 链路
VERIFIED_AUXILIARY_MODELS: dict[str, VerifiedBinding] = {
    "embedding": VerifiedBinding(
        model_id="BAAI/bge-m3",
        env_var="SILICONFLOW_EMBEDDING_MODEL",
        scope="auxiliary",
        verified_by="probe",
        gate_or_probe="Gate H · probe_siliconflow --probe-call",
        notes="供后续 RAG/关键词扩展",
    ),
    "rerank": VerifiedBinding(
        model_id="BAAI/bge-reranker-v2-m3",
        env_var="SILICONFLOW_RERANK_MODEL",
        scope="auxiliary",
        verified_by="probe",
        gate_or_probe="Gate H · probe_siliconflow --probe-call",
        notes="供后续检索重排",
    ),
}

# 已接 REST、未进 Pipeline bootstrap 的可选能力
OPTIONAL_INTEGRATED_MODELS: dict[str, VerifiedBinding] = {
    "speech": VerifiedBinding(
        model_id="fnlp/MOSS-TTSD-v0.5",
        env_var="SILICONFLOW_SPEECH_MODEL",
        scope="optional",
        verified_by="probe",
        gate_or_probe="probe_all_models · /audio/speech",
        notes="TTS；需 voice=fnlp/MOSS-TTSD-v0.5:alex",
    ),
    "stt": VerifiedBinding(
        model_id="FunAudioLLM/SenseVoiceSmall",
        env_var="SILICONFLOW_STT_MODEL",
        scope="optional",
        verified_by="probe",
        gate_or_probe="probe_account_models · /audio/transcriptions",
        notes="STT；需上传音频",
    ),
}

VERIFIED_PROFILE_ID = "crewmarket-siliconflow-v1"
VERIFIED_AT = "2026-05-30"
LLM_DEFAULT_VERIFIED = "deepseek-ai/DeepSeek-V3"


def all_verified_env_vars(*, include_optional: bool = False) -> list[str]:
    items = [LLM_DEFAULT_VERIFIED]
    for binding in VERIFIED_TASK_MODELS.values():
        items.append(binding.env_var)
    for binding in VERIFIED_GENERATION_MODELS.values():
        items.append(binding.env_var)
    for binding in VERIFIED_AUXILIARY_MODELS.values():
        items.append(binding.env_var)
    if include_optional:
        pass
    return list(dict.fromkeys(items))


def task_default_model(task_id: AiTaskId) -> str:
    return VERIFIED_TASK_MODELS[task_id].model_id


def capability_default_model(cap_key: str) -> str | None:
    if cap_key in VERIFIED_GENERATION_MODELS:
        return VERIFIED_GENERATION_MODELS[cap_key].model_id
    if cap_key in VERIFIED_AUXILIARY_MODELS:
        return VERIFIED_AUXILIARY_MODELS[cap_key].model_id
    if cap_key in OPTIONAL_INTEGRATED_MODELS:
        return OPTIONAL_INTEGRATED_MODELS[cap_key].model_id
    if cap_key == "vision":
        return VERIFIED_TASK_MODELS["task.product_extract"].model_id
    if cap_key == "chat":
        return LLM_DEFAULT_VERIFIED
    if cap_key == "image_edit":
        return VERIFIED_GENERATION_MODELS["image"].model_id
    return None


def verified_model_ids() -> set[str]:
    ids: set[str] = {LLM_DEFAULT_VERIFIED}
    for group in (
        VERIFIED_TASK_MODELS,
        VERIFIED_GENERATION_MODELS,
        VERIFIED_AUXILIARY_MODELS,
        OPTIONAL_INTEGRATED_MODELS,
    ):
        for item in group.values():
            ids.add(item.model_id)
    return ids


def to_profile_dict() -> dict:
    """供 API / 模型配置页使用的结构化白名单。"""
    tasks = []
    for task_id, binding in VERIFIED_TASK_MODELS.items():
        tasks.append(
            {
                "taskId": task_id,
                "modelId": binding.model_id,
                "envVar": binding.env_var,
                "scope": binding.scope,
                "verifiedBy": binding.verified_by,
                "gateOrProbe": binding.gate_or_probe,
                "notes": binding.notes,
            }
        )
    generation = [
        {
            "capability": key,
            "modelId": b.model_id,
            "envVar": b.env_var,
            "scope": b.scope,
            "verifiedBy": b.verified_by,
            "gateOrProbe": b.gate_or_probe,
            "notes": b.notes,
        }
        for key, b in VERIFIED_GENERATION_MODELS.items()
    ]
    auxiliary = [
        {
            "capability": key,
            "modelId": b.model_id,
            "envVar": b.env_var,
            "scope": b.scope,
            "verifiedBy": b.verified_by,
            "gateOrProbe": b.gate_or_probe,
            "notes": b.notes,
        }
        for key, b in VERIFIED_AUXILIARY_MODELS.items()
    ]
    return {
        "profileId": VERIFIED_PROFILE_ID,
        "verifiedAt": VERIFIED_AT,
        "provider": "siliconflow",
        "policy": "仅白名单模型可作为默认；完整目录见 catalogMode=account",
        "llmDefaultModel": LLM_DEFAULT_VERIFIED,
        "tasks": tasks,
        "generation": generation,
        "auxiliary": auxiliary,
    }
