'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const STATS = [
  { value: '5', label: '协作智能体' },
  { value: '6', label: '生成步骤' },
  { value: '3+', label: '渠道适配' },
  { value: '1', label: '一站式收口' },
];

const PILLS = ['产品理解', '市场策略', '品牌调性', '营销文案', 'SEO 优化', '社媒适配', '海报物料', '结果整合'];

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 px-6 py-16 sm:px-12 sm:py-24">
      {/* 局部极光氛围 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-20%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.28),transparent_62%)]" />
        <div className="absolute right-[-10%] top-1/3 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.2),transparent_60%)]" />
        <div className="absolute inset-0 grid-overlay opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,14,0.2),rgba(8,8,14,0.85))]" />
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="eyebrow"
        >
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" style={{ animation: 'pulse-glow 2s infinite' }} />
          CrewAI · 多智能体编排
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.08 }}
          className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tightest text-white sm:text-6xl lg:text-7xl"
        >
          从一张产品图
          <br className="hidden sm:block" />
          到 <span className="text-aurora">全链路营销方案</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.16 }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg"
        >
          五个专业智能体协同作业，自动完成产品理解、市场分析、文案生成、渠道适配与物料扩展，
          输出结构统一、可直接用于上架的电商营销方案。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.24 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            href="/generate"
            className="sheen relative overflow-hidden rounded-full bg-[linear-gradient(110deg,rgb(var(--aurora-1)),rgb(var(--aurora-2)))] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_-12px_rgba(168,85,247,0.85)] ring-1 ring-white/20 transition-transform hover:-translate-y-0.5"
          >
            立即开始生成 →
          </Link>
          <a
            href="#capabilities"
            className="rounded-full border border-white/12 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            了解智能体分工
          </a>
        </motion.div>

        {/* 能力胶囊 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.36 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-1.5 text-xs text-zinc-300 transition hover:border-violet-400/30 hover:text-violet-200"
            >
              {pill}
            </span>
          ))}
        </motion.div>
      </div>

      {/* 数据指标 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.44 }}
        className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] sm:grid-cols-4"
      >
        {STATS.map((s) => (
          <div key={s.label} className="bg-white/[0.015] px-4 py-6 text-center backdrop-blur-sm">
            <p className="font-display text-3xl font-bold text-white sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
