const MODELS = [
  'DeepSeek-V3',
  'Qwen3-VL-32B',
  'Qwen2.5-72B',
  'GLM-4-32B',
  'ERNIE-Image-Turbo',
  'Wan2.2-T2V',
  'BAAI / bge-m3',
  'SenseVoice',
];

export function ModelMarquee() {
  const items = [...MODELS, ...MODELS];
  return (
    <section className="relative border-y border-white/5 py-7">
      <div className="mx-auto mb-5 max-w-7xl px-5 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-600">
        驱动引擎 · 已实测模型矩阵
      </div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex w-max gap-4 animate-marquee">
          {items.map((m, i) => (
            <span
              key={`${m}-${i}`}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-medium text-zinc-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
