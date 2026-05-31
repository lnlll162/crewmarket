"""硅基流动统一接入层（生产路径以 verified_models 白名单为准）。"""

from siliconflow.bootstrap import apply_siliconflow_env_defaults, assert_env_models_whitelisted
from siliconflow.catalog import fetch_account_catalog, fetch_verified_catalog
from siliconflow.embeddings import create_embeddings
from siliconflow.rerank import rerank_documents
from siliconflow.verified_models import to_profile_dict

__all__ = [
    "apply_siliconflow_env_defaults",
    "assert_env_models_whitelisted",
    "fetch_verified_catalog",
    "fetch_account_catalog",
    "to_profile_dict",
    "create_embeddings",
    "rerank_documents",
]
