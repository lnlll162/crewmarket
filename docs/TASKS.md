# CrewMarket 任务清单

> 项目任务跟踪文档。随开发进度更新状态，与 [README](../README.md) 路线图及 Cursor 规则保持一致。

**最后更新：** 2026-05-25（API 契约 v0.1）

---

## 状态说明

| 标记 | 含义 |
|------|------|
| `[x]` | 已完成 |
| `[ ]` | 待办 |
| `[~]` | 进行中 |

---

## 阶段 0：项目基线

- [x] 编写项目 README（简介、功能、技术栈、路线图）
- [x] 添加 MIT LICENSE
- [x] 配置 Cursor 规则（内容系统、智能体、API 契约、开发规范）
- [x] 初始化 Git 仓库并推送到 GitHub
- [x] 创建本任务清单文档

---

## 阶段 1：API 契约与类型定义

> 规则要求：**先定义接口与数据结构，再开始功能开发。**

- [x] 编写 API 设计文档（[`docs/api/README.md`](api/README.md)）
  - [x] 业务 REST API（6 个）与 AI Task 层（6 个）分层说明
  - [x] 统一返回结构 `{ code, message, data }`
  - [x] 错误码体系
  - [x] 请求/响应示例 JSON
- [x] 定义核心 TypeScript 类型（[`types/index.ts`](../types/index.ts)）
  - [x] 产品输入（图片、文字描述、可选补充信息）
  - [x] 产品理解结果（名称、品类、属性、卖点、摘要）
  - [x] 市场与品牌策略结果（市场分析、用户画像、调性建议）
  - [x] 营销内容生成结果（标题、详情页、SEO、社媒、视频脚本、海报文案）
  - [x] 营销物料扩展结果（海报布局、分镜、画面提示词）
  - [x] 汇总营销方案（最终 JSON 结构）
- [x] 确认接口路径约定
  - [x] `POST /api/pipeline/run` — **一键编排**（前端主入口）
  - [x] `POST /api/product/analyze` — 产品提取 + 市场分析（2 个 AI Task）
  - [x] `POST /api/content/generate` — 电商文案（1 个 AI Task）
  - [x] `POST /api/seo/optimize` — SEO 优化（1 个 AI Task）
  - [x] `POST /api/social/generate` — 社媒文案（1 个 AI Task）
  - [x] `POST /api/result/merge` — 汇总协调（1 个 AI Task）

---

## 阶段 2：Next.js 应用脚手架

- [ ] 初始化 Next.js + TypeScript 项目
- [ ] 集成 Tailwind CSS
- [ ] 集成 Hero UI 组件库
- [ ] 搭建推荐目录结构
  - [ ] `app/` — 页面与路由
  - [ ] `components/` — 通用组件
  - [ ] `features/` — 业务模块
  - [ ] `services/` 或 `api/` — 接口请求
  - [ ] `types/` — 类型定义
  - [ ] `utils/` — 工具函数
  - [ ] `constants/` — 常量配置
- [ ] 配置环境变量模板（`.env.example`）
- [ ] 实现基础布局（Header、主内容区、页脚）
- [ ] 实现全局加载态 / 空状态 / 错误态组件

---

## 阶段 3：后端 API 实现

- [ ] 实现统一响应封装（success / error helper）
- [ ] `POST /api/product/analyze` — 产品信息提取（可先 mock）
- [ ] `POST /api/content/generate` — 文案生成
- [ ] `POST /api/seo/optimize` — SEO 优化
- [ ] `POST /api/social/generate` — 社媒文案
- [ ] `POST /api/result/merge` — 汇总输出
- [ ] `POST /api/pipeline/run` — 一键编排（串行 6 个 AI Task）
- [ ] 编写接口 mock 数据，供前端联调
- [ ] 补充接口联调说明与 curl / fetch 示例

---

## 阶段 4：CrewAI 工作流集成

- [ ] 搭建 Python / CrewAI 运行环境（或确定与 Next.js 的集成方式）
- [ ] 实现智能体：产品提取 Agent
- [ ] 实现智能体：市场与品牌策略 Agent
- [ ] 实现智能体：营销内容 Agent
- [ ] 实现智能体：营销物料 Agent
- [ ] 实现智能体：汇总协调 Agent
- [ ] 编排完整工作流（产品理解 → 市场与品牌 → 内容生成 → 物料生成 → 汇总）
- [ ] 结构化提示词模板（可复用、可维护）
- [ ] 将 CrewAI 输出映射到 API 契约字段
- [ ] 处理信息不足时的「待确认」标记逻辑

---

## 阶段 5：前端功能与预览

- [ ] 产品输入页（文字描述 + 图片上传 + 可选补充信息）
- [ ] 生成流程触发与进度展示
- [ ] 结果预览面板
  - [ ] 产品分析
  - [ ] 电商文案（标题、卖点、详情页）
  - [ ] SEO 关键词与优化文案
  - [ ] 社媒文案（多平台 Tab）
- [ ] 复制 / 导出 JSON 功能
- [ ] 前后端联调，对接真实或 mock API
- [ ] 完善成功态、失败态、重试交互

---

## 阶段 6：质量与交付

- [ ] 关键路径手动测试清单
- [ ] 更新 README「快速开始」（安装、运行、环境变量）
- [ ] 同步更新 API 文档与类型定义
- [ ] 代码审查：类型严格、无随意 `any`、命名统一
- [ ] （可选）部署方案与生产环境配置说明

---

## 当前优先级（建议执行顺序）

1. **阶段 1** — API 契约与 TypeScript 类型（阻塞后续开发）
2. **阶段 2** — Next.js 脚手架（可并行准备目录与依赖）
3. **阶段 3** — 后端 API + mock 联调
4. **阶段 5** — 前端输入与预览（依赖阶段 2、3）
5. **阶段 4** — CrewAI 真实能力接入（替换 mock）
6. **阶段 6** — 文档、测试与交付

---

## 里程碑对照（README 路线图）

| README 路线图项 | 对应阶段 | 状态 |
|-----------------|----------|------|
| Next.js 应用脚手架 | 阶段 2 | 待办 |
| 产品分析与内容生成 API | 阶段 1 + 3 + 4 | 待办 |
| 前端内容预览与导出 | 阶段 5 | 待办 |
| CrewAI 工作流集成 | 阶段 4 | 待办 |

---

## 备注

- 开发过程中接口或字段变更，须同步更新 `docs/api/` 与 `types/`。
- **6 个 AI Task 各自绑定不同大模型**（与老师演示一致），通过 `AGENT_MODEL_*` 环境变量配置。
- 智能体输出须统一口径，由汇总 Agent 做去重与风格统一。
- 页面设计遵循「精致但克制」，优先保证可联调、可维护。
