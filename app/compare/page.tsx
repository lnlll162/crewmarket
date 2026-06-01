import { CompareWorkspace } from '@/features/compare/CompareWorkspace';

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="space-y-8 rounded-[28px] border border-violet-400/12 bg-[linear-gradient(180deg,rgba(16,16,24,0.94),rgba(9,9,14,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
        <section className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,14,22,0.96),rgba(11,11,16,0.98))] px-8 py-7 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-300">CrewAI · 模型实验</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">多模型对比与历史沉淀</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
              先把实验表单、对比执行和历史列表骨架搭起来，再逐步接入真实的模型评测结果。
            </p>
          </div>
        </section>
        <CompareWorkspace />
      </div>
    </div>
  );
}
