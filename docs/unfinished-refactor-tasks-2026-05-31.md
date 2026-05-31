# CrewMarket 重构未完成任务总结（最新）

**更新日期：** 2026-05-31  
**依据文档：** [`docs/large-refactor-roadmap.md`](./large-refactor-roadmap.md)（重构需求与 Gate 记录）  
**对照文档：** `unfinished-refactor-tasks-2026-05-30.md`（上一版总结，位于 worktree，主仓库此前未落盘）  
**核查方式：** 阅读路线图 §3–§5、§9–§10，并对照当前 `app/`、`features/`、`crew/`、`types/`、`docs/api/` 源码与探针脚本  

**文档目的：** 在路线图「已完成」标记之外，区分 **已接通但未验收**、**已有探针但未产品化**、**仅有类型/字段但未贯通链路** 三类状态，给出可执行的未完成清单。

---

## 0. 对上一版总结（2026-05-30）的核查结论

上一版总结 **整体完整、方向正确**，与路线图 §3.1–§3.9 及 Sprint A–E 建议基本对齐。经本次代码核查，建议补充或修正如下：

| 类别 | 上一版情况 | 本次核查补充 |
|------|------------|--------------|
| **已覆盖** | 各章节未完成项、Gate G、模型配置页、持久化、探针产品化等 | 仍成立 |
| **遗漏：路线图 §5.4** | 未单独强调 | 路线图要求 **两个独立前端页面**（模块输出页、多模型对比页），当前仅在首页 Tab 内展示，**无独立路由** |
| **遗漏：主流程实现方式** | 未说明 | 前端 `usePipelineRun.ts` **已改为单次** `POST /api/pipeline/run`，与 `docs/api/README.md` 写的「首页串行 6 步 API」**不一致**（6 个分步 API 仍存在，但首页未用） |
| **遗漏：汇总字段展示** | 3.8 提到图表，未点明字段 | `summary.roleEvaluation`、`summary.moduleSummary` 后端有、前端 **评估报告 Tab 未展示** |
| **遗漏：非 Chat 埋点** | 3.2 有提 | `crew/generation.py` 文生图/视频 **未写入** `telemetry[]`；与 CrewAI `run_json_task` 路径分离 |
| **遗漏：技术债** | 无 | 存在 `lib/run-crew.ts` 与 `app/lib/run-crew.ts` 重复；根目录未跟踪 `types.ts` 与业务 `types/index.ts` 并存风险 |
| **表述可收紧** | 3.1「基本完成」 | `PROMPT_VERSIONS` 有版本号，但 **无变更记录机制**；`pdf_report`、`summary_eval` 与业务六步的契约映射文档化不足 |
| **Gate 状态** | G-live / G-前端待确认 | 路线图 §10.1 仍标记 🟡；**未见 Gate 验收落档文档**（仅路线图表格） |

**结论：** 上一版可作为 Sprint 规划基础；本文件在其上 **补全路线图章节映射、纠正文档/实现偏差、标注前端未展示字段**。

---

## 1. 当前真实进度概览

### 1.1 已具备且可验证的能力（≠ 产品闭环完成）

| 能力域 | 代码/验证依据 | 产品化程度 |
|--------|---------------|------------|
| 角色与提示词 | `crew/prompts.py` → `agents.py`；`app/lib/prompts.ts` | 高（缺版本治理） |
| LLM Telemetry | `crew/runner.py`、`telemetry_usage.py`；前端「运行统计」Tab | 中（覆盖不全、无持久化） |
| 模块过程记录 | `crew/module_records.py`；`modules[]` + 「过程记录」Tab | 中（单次运行、摘要级） |
| 汇总评估 | `crew/summary_eval.py`；`summary` 字段 + 评估报告 Tab 部分字段 | 中 |
| PDF 专业报告 | `crew/pdf_report.py`；`pdfReport` + 打印导出 | ✅ Gate G 已通过（2026-05-31） |
| 硅基流动基础设施 | `crew/siliconflow/*`、`app/api/siliconflow/*`、多探针 | 探针完整，**页面无** |
| 文生图/视频 | `generation.py`、Pipeline 内 `imageGeneration`；`/api/video/jobs` | 接入主链路，**telemetry/异步统一未完成** |
| 统一探针编排 | `crew/run_unified_tests.py`（Gate A–H） | 脚本有，**全量 `--all` 结果未归档** |

### 1.2 核心差距（路线图 §7 目标未达成部分）

1. **可评估**：有 telemetry/summary，缺多模型实验、人工评分、历史对比。  
2. **可对比**：有 catalog/探针，缺对比执行与对比 UI。  
3. **可审计**：有单次 `modules[]`，缺持久化、脱敏策略、过程导出。  
4. **可持续迭代**：有 `PROMPT_VERSIONS`，缺变更记录与回归测试。  

---

## 2. 按路线图章节：完成度与未完成任务

图例：**🟢** 主链路已接通 · **🟡** 部分完成/待验收 · **🔴** 未开始或仅基础设施  

### 2.1 §3.1 角色与提示词体系标准化 — 🟡

**已完成（代码可见）：**

- `ROLE_DEFINITIONS` + `agents.py` 读取；TS `app/lib/prompts.ts` 同步 7 业务角色 + pdfReport + telemetryTag。
- `module_records` 可带 `promptVersion`（来自 `PROMPT_VERSIONS`）。

**未完成：**

- [ ] 提示词 **版本变更记录**（changelog /  diff），而非仅字段 `version`。
- [ ] 各角色 `inputContract` / `outputContract` 与 `crew/schemas.py` 校验规则的 **对照表文档**。
- [ ] `pdf_report_agent`、`summary_eval`（走 `merge_coordinator_agent`）的 **独立版本治理** 与路线图 §9 表述对齐说明。
- [ ] 提示词 **回归测试**（fixture 输入 → 字段完整性 / 关键约束）。
- [ ] 过程记录 Tab 展示 **角色职责说明、版本、边界**（当前以 input/output 摘要为主）。

**优先级：** 中  

---

### 2.2 §3.2 模型调用前后埋点与统计 — 🟡

**已完成：**

- Gate A/B 已验证硅基流动 `usage`；`run_json_task` / vision 路径写入 `telemetry[]`。
- `pipeline.py` 汇总 `performanceReview`；前端 `TelemetrySummaryView` 表格展示。

**未完成：**

- [ ] **纳入统一 telemetry**：`run_pipeline_summary`、`run_pdf_report`（经 `run_json_task` 会记，但需在文档/验收中确认与 6 步合并统计口径）、**`generate_image` / 视频提交**（当前 **未** 写入 `telemetry`）。
- [ ] 区分 **模型失败** vs **业务 fallback 成功**（避免成功率误导）。
- [ ] 补齐 **HTTP 状态码、供应商错误码、timeout 类型**；前端失败行 **可展开**（重试、errorMessage、是否 fallback）。
- [ ] Token 口径：无 usage 时标 **`unknown`**，避免与 `0` 混淆（`runner` 在无 usage 时仍可能写 0）。
- [ ] Telemetry **持久化** 与历史查询。

**优先级：** 高  

---

### 2.3 §3.3 按模块与角色输出过程记录 — 🟡

**已完成：**

- 全 Pipeline `modules[]`（6 步 + 摘要）；Gate C 离线/live；前端 `ModuleProcessView` 按步骤排序展示。

**未完成：**

- [ ] **持久化** `modules[]`（runId / pipelineId 索引）。
- [ ] 每模块 **输入/输出快照**、schema 校验结果、失败字段诊断（非仅 220 字摘要）。
- [ ] 前端 **模块 / 角色 / 时间线** 视图切换（路线图 §5.4.1）。
- [ ] 导出 **完整过程清单**（JSON/Markdown），不仅 PDF 报告摘要。
- [ ] `raw` 字段 **脱敏与截断** 策略并落地。
- [ ] PDF 报告嵌入 **模块级统计表、角色表现表、失败/重试明细**（当前 pdf 以 section 文本 + telemetry 快照为主）。

**优先级：** 高  

---

### 2.4 §3.4 PDF 汇总升级为专业评估报告 — 🟡

**已完成：**

- `crew/pdf_report.py`、`pdfReport` 顶层字段；`PdfReportView` + 导出优先 `#pdf-report-print-area`。
- 离线 smoke：`test_pdf_report_smoke.py`、`probe_pdf_report.py --offline`。
- fallback 含 **disclaimer** 措辞。

**未完成（与路线图 §10.1 Gate G 一致）：**

- [ ] 执行并 **归档** `py crew/probe_pdf_report.py --live` 结果。
- [ ] **前端完整 Pipeline** 人工验收：「评估报告」Tab + 浏览器打印 PDF（分页、长文、多 section）。
- [ ] 运行 `py crew/run_unified_tests.py --all` 并 **记录通过/失败**（建议新增 `docs/gate-records/` 或写回路线图 §10）。
- [ ] PDF 导出 **文件命名**（产品名 + 时间 + pipelineId）。
- [ ] PDF 质量 **fixture**（字段为空不应显示为成功）。
- [ ] Live 成功路径的 disclaimer 与 **模块/角色表格化** 内容补强。

**优先级：** 高（最接近收尾）  

---

### 2.5 §3.5 引入多模型接入与对比能力 — 🟡 基础设施 / 🔴 对比产品

**已完成：**

- 白名单 `verified_models.py`、账号 catalog、`GET /api/siliconflow/models?mode=verified|account`。
- 探针：`probe_all_models.py`（14 绑定）、`probe_account_models.py`（账号全量）、`crew/reports` 输出。
- Pipeline 启动校验非白名单模型。

**未完成：**

- [ ] 同一任务 **多模型并行/串行对比** 执行器。
- [ ] 对比结果结构：质量、稳定性、耗时、token、错误率、**人工评分**。
- [ ] 探针报告 **前端可查询**（非仅 `crew/reports` 文件）。
- [ ] 按角色选候选模型并 **记录实验组合**。
- [ ] 对比 **历史库**（同输入不同模型横向比较）。
- [ ] 明确四类模型列表：账号可见 / 白名单 / Pipeline 绑定 / 推荐。
- [ ] 非文本模型边界文档（图生图参考图、TTS voice、视频异步等）— `docs/api/README.md` 有部分说明，需 **独立能力边界文档**。

**优先级：** 高（依赖 3.6 入口）  

---

### 2.6 §3.6 模型选择与任务配置页面 — 🟢

**已完成（2026-05-31 Sprint B 收尾）：**

- 路由 `/models` + 导航「模型配置」；`ModelConfigWorkspace` 卡片布局。
- API：`GET/PUT/DELETE /api/agent-models/config`；`POST /api/agent-models/probe?mode=offline|live`。
- 存储：`data/agent-model-config.json`（gitignore）；示例 `data/agent-model-config.example.json`。
- Python：`crew/model_config.py`；`run_pipeline.py` 启动时 `apply_saved_model_config()`。
- **仅主链路 8 项**：7 LLM Task + 文生图（不含 video/embedding/TTS 等探针项）。
- 探针：`probe_config_bindings.py`（offline 8/8 env 注入 + live 8/8 API）；`test_model_config_smoke.py`。
- UI：保存后提示重新跑 Pipeline；「校验配置注入」「最小 live 探针」按钮。

**未完成（非 Sprint B 范围）：**

- [ ] verified ↔ account catalog **切换**（当前仅 verified 下拉）。
- [ ] 成本/速度/上下文/多模态 **标签展示**。
- [ ] 保存时校验 **catalog 全量 verified**（当前白名单为 8 项默认 modelId）。
- [ ] 配置变更 **热更新**（需重启/重新 spawn Python 子进程，即重新跑 Pipeline）。

**验收记录：** `docs/gate-records-2026-05-31.md` §7

**优先级：** ~~最高~~ → **已完成**；下一步见 §5 Sprint C/E。

---

### 2.7 §3.7 多模态输入能力升级 — 🔴 主流程 / 🟡 类型预留

**已完成：**

- 单描述 + 单图上传；`ProductInput` / `PipelineSummaryInput.userInput.assets` **类型已定义**。
- `summary_eval.build_summary_input` 可组装简单 assets 数组。

**未完成：**

- [ ] 前端 **多段文本**（产品资料、竞品、评价、品牌要求分栏）。
- [ ] 前端 **多图** 上传、预览、排序、删除、类型标注（产品图/竞品/风格参考）。
- [ ] 后端 Pipeline 请求以 **`assets[]` 为主契约**，弱化单字段 `description` + `imageBase64` 硬编码路径。
- [ ] 各素材 **摘要** 进入 summary / pdfReport 可追溯。
- [ ] 大小/数量/base64 策略与错误提示。
- [ ] 多模态 **离线 fixture + live** 探针。

**优先级：** 中高（建议在 3.6 之后）  

---

### 2.8 §3.8 汇总分析增强：图表、风险、机会、建议 — 🟡 文本 / 🔴 图表与指标

**已完成：**

- `PipelineSummaryOutput`：`riskAssessment`、`opportunityAnalysis`、`recommendations`、`performanceReview`、`pdfHighlights` 等。
- 前端展示：executiveSummary、风险/机会/建议、置信度、missingInfo。

**未完成：**

- [ ] 关键 **指标体系**（完整度、卖点清晰度、渠道适配度、风险等级、执行优先级等）。
- [ ] **可视化图表**（模块耗时、token 占比、风险分布等）— 前端无 chart 组件。
- [ ] 展示 **`roleEvaluation`、`moduleSummary`**（后端 schema 要求，**前端评估 Tab 未渲染**）。
- [ ] Summary 输出 **更严 schema 校验** 与缺项告警。
- [ ] **人工编辑/确认** 风险与建议。
- [ ] PDF 内 **图表或统计表格**（非纯段落）。

**优先级：** 中  

---

### 2.9 §3.9 海报生成模块定义澄清 — 🟡 文案 / 🔴 产品化

**已完成：**

- `posterCopy`、`imageIdeas`、`imageGeneration` 在 content 步骤产出；文案 Tab 内展示海报三字段 + `GenerationStatusCard`（图片生成状态）。

**未完成：**

- [ ] UI **独立海报模块**（非混在「文案」Tab）。
- [ ] 业务定义文案：围绕定位与文案的 **宣传海报**（输入依据可见）。
- [ ] 风格参数：品牌调性、平台、画幅、人群。
- [ ] **多版方案** + prompt/model/seed/url 留存。
- [ ] 图片生成 **异步/轮询**，避免阻塞全 Pipeline。
- [ ] 失败分类提示（额度、审核、超时、模型不支持）。
- [ ] PDF 展示海报缩略图或设计说明。

**优先级：** 中  

---

### 2.10 路线图 §5.4 规划的两类前端页面 — 🔴（上一版未单列）

| 页面 | 路线图要求 | 当前状态 |
|------|------------|----------|
| **5.4.1 模块输出与汇总页** | 独立页：模块/角色/时间线/telemetry/风险机会 | 仅在 `GenerateWorkspace` **Tab**（总览、运行统计、过程记录、评估报告、分步结果） |
| **5.4.2 多模型接入与对比页** | 独立页：选模型、配置角色、对比效果、评测历史 | **不存在**；仅 `app/page.tsx` 单首页 |

**未完成：**

- [ ] 路由与导航（如 `/runs`、`/models`、`/compare` 等，命名待定）。
- [ ] 与现有 Tab 能力 **迁移或复用** 组件，避免双份逻辑分叉。

**优先级：** 高（与 3.6、3.5 绑定）  

---

### 2.11 路线图 §9 结构汇总评估模型 — 🟢 接入 / 🟡 产品展示

**已完成：**

- `summary_eval.py` 独立提示词 `pipeline_summary_prompt`；full/merge/pipeline 路径调用；失败 `fallback_pipeline_summary`。

**未完成：**

- [ ] 前端完整展示 §9.4 输出字段（尤其 `roleEvaluation`、`moduleSummary`）。
- [ ] 与 `task.result_merge` / 独立 `AGENT_MODEL_*` 的 **配置文档化**（当前复用 merge coordinator agent）。
- [ ] 汇总模型 **替换/对比** 实验（属 3.5 范畴）。

**优先级：** 中  

---

### 2.12 路线图 §4 技术拆分 — 分项状态

| 子项 | 状态 | 主要缺口 |
|------|------|----------|
| 4.1 后端抽象层 | 🟡 | 统一 telemetry 未覆盖 generation；无 run 存储 |
| 4.2 前端工作台 | 🟡 | 缺模型配置页、对比页、运行历史、多输入区 |
| 4.3 报告系统 | 🟡 | PDF/summary 有；图表、过程导出无 |
| 4.4 数据记录层 | 🔴 | 无 DB/文件 run 索引；视频 job 有本地 persist，Pipeline 无 |

---

## 3. 跨模块未完成事项（汇总）

### 3.1 前端产品化缺口

- [x] 模型配置页（§3.6）— `/models`，2026-05-31
- [ ] 多模型对比页（§3.5 + §5.4.2）
- [ ] 运行历史页
- [ ] 过程记录高级筛选、失败诊断展开
- [ ] 多素材输入区（§3.7）
- [ ] 探针报告可视化
- [ ] 人工评分 / 确认 / 修订交互
- [ ] `summary.roleEvaluation` / `moduleSummary` 展示
- [ ] 独立模块汇总页（§5.4.1）

### 3.2 后端与数据层缺口

- [ ] Pipeline run **持久化**（modules、telemetry、summary、pdfReport、steps）
- [ ] `GET /runs` 或等价 **历史查询 API**
- [x] 模型配置 **读写 API** — `GET/PUT/DELETE /api/agent-models/config` + `POST /api/agent-models/probe`
- [ ] 模型实验记录格式与存储
- [ ] Prompt / raw / base64 **脱敏**
- [ ] **统一异步任务**框架（视频 job 已独立；图生图、PDF、多模型评测未统一）

### 3.3 测试与验收缺口

- [ ] `py crew/run_unified_tests.py --all` **执行并归档**
- [ ] Gate G：`probe_pdf_report.py --live` + 前端导出 **书面验收**
- [ ] Next.js API ↔ Python **字段映射** 自动化测试
- [ ] 前端关键路径测试（上传、Tab、导出 PDF、失败重试）
- [ ] 探针 **需 Key / 可离线** 清单（写入 `docs/api/env.example` 或 gate 文档）

### 3.4 文档与契约缺口

- [ ] `docs/TASKS.md` 停留在 **2026-05-25**，与现状严重脱节 → 更新或标为历史
- [ ] `docs/api/README.md`：**版本日期 v0.3 / 2026-05-25**；前端主流程描述需改为 **pipeline/run 一键**；补充 `telemetry`、`modules`、`summary`、`pdfReport` 响应字段
- [ ] `docs/api/env.example` 与当前 `AGENT_MODEL_*`、`SILICONFLOW_*` 全量对齐
- [ ] 新增 **Gate 验收记录**（避免仅路线图表格口头状态）
- [ ] 新增 **模型能力边界** 文档
- [ ] 消除 **`lib/` 与 `app/lib/`** 双份 `run-crew` 维护歧义（记入技术债任务）

---

## 4. Gate 与验收状态（摘自路线图 §10.1，2026-05-31 仍有效）

| Gate | 内容 | 状态 |
|------|------|------|
| A | `probe_usage.py` | ✅ |
| B | `probe_runner_usage.py` | ✅ |
| C | modules 离线 + live | ✅ |
| D | 前端运行统计 Tab | ✅（需随全 Pipeline 定期复核） |
| E | 前端过程记录 Tab | ✅ |
| F | summary smoke + live | ✅ |
| G smoke | pdf smoke + offline | ✅ |
| **G live** | `probe_pdf_report.py --live` | ✅ **2026-05-31**（`docs/gate-records-2026-05-31.md`） |
| **G 前端** | Pipeline + 评估报告 + 导出 PDF | ✅ **2026-05-31**（智能手环全链路） |
| H | siliconflow verify / catalog / bindings / account | ✅（探针层；绑定 14/14 已于 2026-05-31 复验） |
| 统一编排 | `run_unified_tests.py` offline+api | ✅ **11/11**（2026-05-31）；`--live` 全量含 account 未重跑 |

---

## 5. 建议执行顺序（与路线图 §10.3、§5.2 一致）

### Sprint A：Gate G 与主链路验收（1–2 天）

1. `py crew/probe_pdf_report.py --live`
2. `py crew/run_unified_tests.py --all`（或分 `--offline` / `--live` 记录）
3. 前端完整 Pipeline：运行统计 / 过程记录（6 模块）/ 评估报告 / 导出 PDF
4. 将结果写入 **Gate 记录**（更新路线图 §10 或 `docs/gate-records-2026-05-31.md`）

### Sprint B：§3.6 模型配置页 — ✅ 2026-05-31 已完成

- 页面 `/models` + 8 项绑定 + 保存/重置/探针
- `probe_config_bindings.py --offline` 8/8 env 注入
- `probe_config_bindings.py --live` 8/8 API 通过
- 详见 `docs/gate-records-2026-05-31.md` §7

### Sprint C：§3.5 + §5.4.2 多模型对比与实验（5–7 天）

- 实验数据结构 → 对比执行 → 历史与人工评分

### Sprint D：§3.7 多模态输入（4–6 天）

- `assets[]` 前后端贯通 + summary/pdf 可追溯

### Sprint E：§3.3 / §4.4 审计持久化（5–8 天）

- 存储方案 → 运行历史页 → 筛选与 PDF 再导出

### Sprint F：§5.4.1 独立模块汇总页 + §3.8 图表增强（可并行，中优先级）

---

## 6. 当前最重要结论

1. 项目 **不是「没做重构」**：角色、telemetry、modules、summary、pdfReport、硅基流动探针与 API 均已落地，且多数 Gate 在探针层已通过。  
2. 真正未完成的是 **产品化闭环**：验收落档、配置与对比页面、持久化与审计、多模态输入、图表与人工环节。  
3. **合理下一步**：先 **Sprint A（Gate G + 统一测试归档）**，再 **Sprint B（3.6 模型配置页）**；不宜在未验收主链路前继续扩散新 API。  
4. 上一版 2026-05-30 总结 **可继续使用**；本文件为其 **2026-05-31 勘误增补版**，并已落入主仓库 `docs/`。

---

## 7. 维护说明

- 每完成一个 Gate 或 Sprint，请同步更新：  
  - 本文件对应 checkbox  
  - `docs/large-refactor-roadmap.md` §10.1 表格  
  - 必要时 `docs/api/README.md` 契约  
- 判定「已完成」的最低标准：**代码 + 探针或人工验收记录 + 前端可演示** 三者至少满足两项，且第三项有明确排期。
