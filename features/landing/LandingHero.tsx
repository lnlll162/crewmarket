'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const STATS = [
  { value: '5', label: '协作智能体' },
  { value: '7', label: 'AI 任务链路' },
  { value: '6+', label: '内容模块' },
  { value: '∞', label: '可扩展物料' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* 动态极光背景 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px] animate-aurora" />
        <div className="absolute right-[8%] top-10 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/20 blur-[110px] animate-aurora [animation-delay:-6s]" />
        <div className="absolute bottom-[-10rem] left-[5%] h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-[120px] animate-aurora [animation-delay:-12s]" />
      </div>

      {/* 网格底纹 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 40%, transparent 100%)',
        }}
      />

      <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-24 pt-20 text-center sm:pt-28">
        {/* Badge */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[12px] font-medium text-zinc-300 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            CrewAI 多智能体引擎 · 已接入硅基流动
          </span>
        </motion.div>

        {/* 主标题 */}
        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mt-7 text-balance text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-7xl"
        >
          让营销内容
          <br className="hidden sm:block" />
          <span className="text-gradient">由智能体一键生成</span>
        </motion.h1>

        {/* 副文案 */}
        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg"
        >
          从一张产品图或一段描述出发，五个专业智能体协作完成
          <span className="text-zinc-200"> 产品理解 · 市场策略 · 文案创作 · SEO 优化 · 社媒适配 · 物料扩展</span>
          ，输出结构统一、可直接上架的全链路营销方案。
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="#workbench"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-[length:200%_100%] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_40px_rgba(168,85,247,0.5)] transition-all duration-500 hover:bg-[position:100%_0] hover:shadow-[0_8px_50px_rgba(217,70,239,0.6)]"
          >
            立即体验生成
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="#capabilities"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/[0.07]"
          >
            了解能力矩阵
          </Link>
        </motion.div>

        {/* 数据指标 */}
        <motion.div
          variants={fadeUp}
          custom={4}
          initial="hidden"
          animate="show"
          className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-[#0a0a12]/60 px-6 py-7 backdrop-blur-md">
              <div className="text-4xl font-black tracking-tight text-white">{s.value}</div>
              <div className="mt-1 text-[12px] font-medium uppercase tracking-wider text-zinc-500">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 滚动提示 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1.5">
          <span className="h-1.5 w-1 rounded-full bg-white/70 animate-scroll-cue" />
        </div>
      </div>
    </section>
  );
}
