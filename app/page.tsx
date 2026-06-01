import Link from 'next/link';
import { Hero } from '@/components/marketing/Hero';
import { AgentShowcase } from '@/components/marketing/AgentShowcase';

export default function HomePage() {
  return (
    <div className="space-y-24">
      <Hero />

      <AgentShowcase />

      {/* 收尾行动召唤 */}
      <section className="relative overflow-hidden rounded-[32px] border border-violet-400/20 px-6 py-16 text-center sm:px-12 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(236,72,153,0.12))]" />
          <div className="absolute left-1/2 top-[-30%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.3),transparent_62%)]" />
          <div className="absolute inset-0 grid-overlay opacity-40" />
        </div>
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
          准备好把产品变成<span className="text-aurora">完整营销方案</span>了吗？
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-300/90 sm:text-base">
          进入生成工作台，上传产品图或填写描述，五个智能体将分步交付可直接上架的营销内容。
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/generate"
            className="sheen relative overflow-hidden rounded-full bg-[linear-gradient(110deg,rgb(var(--aurora-1)),rgb(var(--aurora-2)))] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_-12px_rgba(168,85,247,0.85)] ring-1 ring-white/20 transition-transform hover:-translate-y-0.5"
          >
            进入生成工作台 →
          </Link>
          <Link
            href="/models"
            className="rounded-full border border-white/12 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            配置模型
          </Link>
        </div>
      </section>
    </div>
  );
}
