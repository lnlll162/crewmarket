# CrewMarket 项目现状与升级总方案

> 记录当前项目真实结构、已实现能力、已确认问题，以及后续统一升级方案。
>
> 本文档用于统一产品定位、后端任务边界、前端展示口径与后续演进方向。

**版本：** v0.1  
**最后更新：** 2026-05-26

---

## 1. 项目当前定位

### 当前定位
CrewMarket 当前是一个 **多智能体电商营销内容生成系统**，以“产品理解 → 市场分析 → 营销内容 → SEO → 社媒 → 汇总”为主链路。

### 当前已明确的范围
- 支持产品图片与文字描述输入
- 支持产品识图
- 支持结构化营销内容生成
- 支持 SEO 与社媒文案生成
- 支持结果汇总与一致性校验
- 前端采用分步串行调用，不默认依赖 `/api/pipeline/run`
- 后端以硅基流动为唯一模型供应方，通过不同任务绑定不同模型

### 当前不应误解的范围
- 现阶段**不是**“已完成真实生图 + 真实视频生成”的系统
- `posterCopy`、`imageIdeas`、`videoScript`、`videoMaterial` 目前属于内容生成/创意输出的一部分
- 这些字段**不是**独立的图片生成或视频生成任务链路

---

## 2. 当前项目结构

### 2.1 前端结构

- `features/generate/GenerateWorkspace.tsx` — 首页生成工作台
- `features/generate/usePipelineRun.ts` — 前端分步串行调用编排
- `features/generate/PipelineProgress.tsx` — 流程进度展示
- `features/generate/ResultDisplay.tsx` — 结果展示区
- `features/generate/constants.ts` — 流程步骤元数据
- `components/ui/EmptyState.tsx` — 空状态
- `components/ui/ErrorState.tsx` — 错误状态

### 2.2 后端结构

- `crew/pipeline.py` — 工作流编排入口
- `crew/agents.py` — CrewAI Agent 定义
- `crew/prompts.py` — 提示词模板
- `crew/schemas.py` — 输出校验与归一化
- `crew/runner.py` — JSON 任务执行与重试
- `crew/vision.py` — 产品识图任务
- `crew/llm.py` — 硅基流动模型绑定
- `crew/config.py` — Task ID 与模型前缀配置

### 2.3 类型与契约

- `types/index.ts` — 请求、响应、任务 ID、模型配置、结果类型
- `docs/api/README.md` — API 契约、AI Task 映射、模型配置说明
- `.cursor/rules/*.mdc` — 项目规则、接口规则、开发规范

---

## 3. 当前已实现的能力

### 3.1 前端主流程
当前首页主流程采用分步串行调用：
1. `/api/product/analyze`
2. `/api/content/generate`
3. `/api/seo/optimize`
4. `/api/social/generate`
5. `/api/result/merge`

`/api/pipeline/run` 保留为后端一键编排入口、调试入口和未来批处理入口。

### 3.2 后端 AI Task
当前后端共 6 个核心任务：
- `task.product_extract`
- `task.market_research`
- `task.content_write`
- `task.seo_optimize`
- `task.social_adapt`
- `task.result_merge`

### 3.3 现有内容字段
`content_write` 任务要求并返回以下内容字段：
- `title`
- `sellingPointCopy`
- `detailPageContent`
- `conversionDescription`
- `videoScript`
- `posterCopy`
- `imageIdeas`
- `videoMaterial`

这些字段目前用于：
- 前端结果页展示
- 为后续真实图片/视频生成保留内容基础
- 作为营销物料的一部分，而不是独立生成任务

---

## 4. 目前已确认的问题

### 4.1 依赖问题
- `crew/requirements.txt` 原本缺少 `botocore`
- 当前 Python 环境未安装 `botocore`
- 运行日志里出现过与 LiteLLM 相关的 `botocore` 缺失错误

### 4.2 schema 兜底问题
之前 `crew/schemas.py` 对以下字段存在自动兜底：
- `posterCopy`
- `imageIdeas`
- `videoMaterial`

这会掩盖模型未真实返回字段的问题。当前已调整为：
- 这些字段必须由模型真实返回
- 否则直接报错

### 4.3 任务边界问题
当前项目里“图片创意”和“视频脚本”已经有，但并不等于：
- 真正的生图模型接入
- 真正的视频生成模型接入

这部分能力如果要做，必须作为新的项目升级项明确设计，不能混在现有文案输出里误认为已经完成。

---

## 5. 当前统一结论

### 现在的项目本质
当前项目本质是：

**营销内容生成系统 + 产品识图 + SEO + 社媒 + 汇总**

### 当前不应误判为

**营销内容生成系统 + 真实生图 + 真实视频生成系统**

### 因此当前升级边界
后续如果要扩展生图 / 视频能力，应当作为明确的新模块来设计，而不是把现有 `posterCopy`、`imageIdeas`、`videoMaterial` 直接视为已完成的生图/视频任务。

---

## 6. 后续升级总方案

### 方案 A 当前保持不变
如果项目定位保持为“营销内容生成系统”，则只需：
- 保持现有 6 个 AI Task
- 继续强化提示词、schema、前端展示与后端稳定性
- 不新增独立生图/视频生成链路

适用场景：
- 项目目标是内容策划、营销文案、内容物料输出
- 不追求直接产出图片或视频文件

### 方案 B 向“内容 + 生图 + 视频生成”升级
如果项目要升级为更完整的生成系统，则需要：

#### B1. 新增能力边界
- 文案生成：保持现有内容链路
- 生图生成：新增独立图片生成任务
- 视频生成：新增独立视频生成任务

#### B2. 新增任务设计
建议拆分为：
- `task.product_extract` — 产品识图
- `task.market_research` — 市场分析
- `task.content_write` — 营销内容生成
- `task.image_generate` — 图片/海报生成
- `task.video_generate` — 视频生成或视频素材生成
- `task.seo_optimize` — SEO 优化
- `task.social_adapt` — 社媒适配
- `task.result_merge` — 汇总校验

#### B3. 新增类型
需要补充：
- 图片生成请求/响应结构
- 视频生成请求/响应结构
- 资源状态结构
- 任务状态结构

#### B4. 新增接口
可考虑新增：
- `/api/image/generate`
- `/api/video/generate`

也可以按业务继续拆分，但必须明确接口职责，不与内容生成混淆。

#### B5. 新增前端展示
结果页需新增：
- 图片生成结果区
- 视频生成结果区
- 生成状态与失败重试
- 资源下载 / 预览 / 导出

---

## 7. 统一实现原则

1. **先定定位，再改代码**
   - 不要一边查一边打补丁
   - 先确认项目到底是什么，再统一所有层

2. **任务边界必须清晰**
   - 文案、图片、视频不能混成一个模糊能力

3. **schema 不能掩盖模型缺失**
   - 关键字段应由模型真实返回
   - 兜底只能用于非核心字段或明确约定的 fallback 场景

4. **模型配置必须统一**
   - 当前只允许硅基流动单路由
   - 不引入多 Provider 路由混用
   - 只通过不同任务绑定不同硅基流动模型

5. **文档、类型、实现必须一致**
   - README
   - API 文档
   - 任务清单
   - Cursor rules
   - types
   - crew prompts / pipeline / schemas
   - 前端展示
   必须同口径

---

## 8. 建议执行顺序

### 第一阶段
- 确认最终项目定位
- 确认是否要真实接入生图和视频生成
- 不再修改实现，先统一文档口径

### 第二阶段
- 如果不扩展生图/视频：
  - 继续稳住当前 6 Task 内容链路
  - 强化提示词与 schema
  - 修复依赖和运行稳定性

### 第三阶段
- 如果要扩展生图/视频：
  - 拆任务
  - 补类型
  - 补接口
  - 补前端展示
  - 补模型映射

---

## 9. 当前推荐决策

### 推荐当前先采用
**方案 A：保持项目为“营销内容生成系统”**

理由：
- 当前代码和文档已经形成一套完整的营销内容链路
- 生图和视频真正生成需要新增任务和新接口，不适合在现阶段继续打补丁
- 先把当前链路稳定，后续再按明确方案升级，会更稳妥

### 若你确认要升级
下一步再启动**方案 B**，并按阶段重构。
