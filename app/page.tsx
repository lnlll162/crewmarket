import { GenerateWorkspace } from '@/features/generate/GenerateWorkspace';

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-transparent to-fuchsia-950/30 px-8 py-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-violet-400">
            CrewAI · 多智能体
          </p>
          <h1 className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-4xl font-bold text-transparent">
            电商营销内容生成
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            上传产品图与描述，6 个 AI 智能体按流水线协作：识图分析 → 市场调研 → 文案撰写 →
            SEO 优化 → 社媒适配 → 汇总输出。生成过程实时可见，结果以可读卡片展示，无需查看 JSON。
          </p>
        </div>
      </section>
      <GenerateWorkspace />
    </div>
  );
}
