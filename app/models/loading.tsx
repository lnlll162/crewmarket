export default function ModelsLoading() {
  return (
    <div className="space-y-8 rounded-[28px] border border-violet-400/12 bg-[linear-gradient(180deg,rgba(16,16,24,0.94),rgba(9,9,14,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.32)]">
      <section className="rounded-[20px] border border-white/8 bg-white/[0.03] px-8 py-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-300">模型控制台</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">任务模型配置</h1>
        <p className="mt-2 text-sm text-zinc-400">正在加载配置与模型目录…</p>
      </section>
      <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-white/8 bg-black/20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    </div>
  );
}
