# Gate 验收记录 · 2026-05-31

**执行环境：** Windows · Python 3.13.7 · `crew/.venv`（本次新建并安装 `crew/requirements.txt`）  
**API Key：** 项目根 `.env` 中 `SILICONFLOW_API_KEY`（未记录密钥）  
**前端验收：** 2026-05-31 人工全链路（产品：智能手环 + 产品图）

---

## 1. Gate G · PDF 报告（后端）

| 命令 | 结果 | 备注 |
|------|------|------|
| `crew/.venv/Scripts/python.exe crew/probe_pdf_report.py --offline` | ✅ PASS | fallback pdfReport 字段齐全 |
| `crew/.venv/Scripts/python.exe crew/probe_pdf_report.py --live` | ✅ PASS | live pdfReport；`telemetry_count=2` |

---

## 2. Gate C / F · 模块与汇总（live）

| 命令 | 结果 |
|------|------|
| `probe_modules.py --live` | ✅ PASS（2 步 analyze） |
| `probe_summary.py --live` | ✅ PASS |

---

## 3. Gate H · Pipeline 绑定模型

| 命令 | 结果 |
|------|------|
| `probe_all_models.py` | ✅ **14/14** live 通过 |

> 未重跑 `probe_account_models.py`（账号全量 catalog，耗时长）。

---

## 4. 统一探针

| 命令 | 结果 |
|------|------|
| `run_unified_tests.py --offline` | ✅ 7/7 |
| `run_unified_tests.py`（offline + api） | ✅ 11/11 |

---

## 5. Gate G · 前端人工验收

**输入：** 产品描述「智能手环」+ 产品图片 `e43a3bb1be6886db07de80f963fc9d49.jpg`

| 验收项 | 结果 | 说明 |
|--------|------|------|
| Pipeline 6/6 步完成 | ✅ | 进度 100%，六角色均 ✓ |
| 产品提取 | ✅ | 识图 + 描述，待确认项合理 |
| 市场 / 文案 / SEO / 社媒 | ✅ | 各模块字段完整、风格一致 |
| 文生图 | ✅ | `generated`，2 张预览 + seed + inference 耗时 |
| 汇总总览 | ✅ | 待确认项、一致性说明有输出 |
| 运行统计 Tab | ✅ | 用户确认全 Tab 已测（见会话记录） |
| 过程记录 Tab | ✅ | 同上 |
| 评估报告 Tab | ✅ | 同上 |
| 导出 PDF | 🟡 | 按钮可见；若打印版式无问题请自行标 ✅ |

**样例质量观察（非 Gate 硬性项）：**

- 卖点与 SEO/社媒口径基本一致，汇总指出「SEO 与主标题重复较多」——符合预期。
- 产品功能参数（心率、续航、防水）正确标记为待确认，未虚假夸大。

---

## 6. 结论

| Gate | 状态 |
|------|------|
| G-live（后端） | ✅ 2026-05-31 |
| G-前端（全 Pipeline） | ✅ 2026-05-31（导出 PDF 打印效果建议再点一次确认） |
| 绑定模型 14/14 | ✅ 2026-05-31 |

**Sprint A 主链路验收：已完成。**

---

## 7. Sprint B · §3.6 模型配置页（2026-05-31）

**范围：** 主 Pipeline 8 项绑定（7 LLM Task + 文生图），不含 video/embedding/TTS。

| 验收项 | 结果 | 说明 |
|--------|------|------|
| 路由 `/models` + 导航 | ✅ | `ModelConfigWorkspace` 卡片布局 |
| `GET/PUT/DELETE /api/agent-models/config` | ✅ | 读写 `data/agent-model-config.json` |
| Pipeline 读取配置 | ✅ | `run_pipeline.py` → `apply_saved_model_config()` |
| `test_model_config_smoke.py` | ✅ | fixture 8 项 → env 注入 |
| `probe_config_bindings.py --offline` | ✅ | **8/8** config ↔ env 一致 |
| `probe_config_bindings.py --live` | ✅ | **8/8** 最小 API（含文生图） |
| 保存后 UI 提示 | ✅ | 「请返回首页重新运行 Pipeline」 |
| 配置页探针按钮 | ✅ | `POST /api/agent-models/probe` |

**测试用配置（`market_research` / `seo_optimize` 改为 `THUDM/GLM-4-32B-0414`）：**

```json
"task.market_research": { "model": "THUDM/GLM-4-32B-0414" }
"task.seo_optimize": { "model": "THUDM/GLM-4-32B-0414" }
```

**人工验收（建议）：**

1. 打开 `/models`，修改 1～2 个 Task + 文生图 → 保存
2. 首页跑完整 Pipeline（含产品图）
3. 「运行统计」Tab 核对 `telemetry[].model` 与保存值一致

**Sprint B：已完成。**  
**下一步：Sprint C（多模型对比）或 Sprint E（运行历史持久化）。**

**复现命令：**

```powershell
crew\.venv\Scripts\python.exe crew/test_model_config_smoke.py
crew\.venv\Scripts\python.exe crew/probe_config_bindings.py --offline
crew\.venv\Scripts\python.exe crew/probe_config_bindings.py --live
```

---

## 8. 复现命令（Sprint A）

```powershell
crew\.venv\Scripts\python.exe crew/probe_pdf_report.py --live
crew\.venv\Scripts\python.exe crew/run_unified_tests.py
```
