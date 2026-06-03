'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AgentCard {
  step: string;
  name: string;
  role: string;
  desc: string;
  accent: string;
  glow: string;
  icon: ReactNode;
}

const AGENTS: AgentCard[] = [
  {
    step: '01',
    name: '产品提取',
    role: 'Product Analyst',
    desc: '识图与描述解析，提炼产品名称、品类、关键属性与核心卖点。',
    accent: 'from-sky-400/80 to-cyan-400/80',
    glow: 'rgba(56,189,248,0.35)',
    icon: (
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7zm9-4v18M3 7l9 4 9-4" />
    ),
  },
  {
    step: '02',
    name: '市场与品牌策略',
    role: 'Market & Brand Strategist',
    desc: '归纳类目趋势、竞品风格、目标用户画像与品牌调性建议。',
    accent: 'from-orange-400/80 to-amber-400/80',
    glow: 'rgba(251,146,60,0.35)',
    icon: <path d="M3 3v18h18M7 14l3-4 3 3 5-7" />,
  },
  {
    step: '03',
    name: '营销内容',
    role: 'Marketing Content Writer',
    desc: '生成标题、卖点、详情页、SEO、社媒、视频脚本与海报文案。',
    accent: 'from-fuchsia-400/80 to-pink-400/80',
    glow: 'rgba(236,72,153,0.35)',
    icon: <path d="M4 5h16M4 12h10M4 19h7M15 16l5 5m0-5l-5 5" />,
  },
  {
    step: '04',
    name: '营销物料',
    role: 'Marketing Material Agent',
    desc: '海报布局、分镜、画面提示词与后续视频生成扩展。',
    accent: 'from-violet-400/80 to-purple-400/80',
    glow: 'rgba(168,85,247,0.35)',
    icon: <path d="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" />,
  },
  {
    step: '05',
    name: '汇总协调',
    role: 'Result Auditor',
    desc: '去重、统一风格，输出一致性建议与完整营销方案。',
    accent: 'from-emerald-400/80 to-teal-400/80',
    glow: 'rgba(16,185,129,0.35)',
    icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />,
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function AgentShowcase() {
  return (
    <section id="capabilities" className="relative scroll-mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">智能体分工</span>
        <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          五个智能体，<span className="text-aurora">一条生成流水线</span>
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          每个智能体专注一个环节，串行协作、逐步交付，最终汇总为结构统一的营销方案。
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent, i) => (
          <motion.article
            key={agent.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease, delay: i * 0.06 }}
            className="group relative overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(22,22,34,0.6),rgba(10,10,16,0.7))] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/16"
            style={{ ['--glow' as string]: agent.glow }}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: agent.glow }}
            />
            <div className="relative flex items-start justify-between">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.accent} shadow-lg ring-1 ring-white/20`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {agent.icon}
                </svg>
              </span>
              <span className="font-display text-3xl font-bold text-white/10 transition-colors group-hover:text-white/20">
                {agent.step}
              </span>
            </div>

            <h3 className="relative mt-5 text-lg font-semibold text-white">{agent.name}</h3>
            <p className="relative mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              {agent.role}
            </p>
            <p className="relative mt-3 text-sm leading-relaxed text-zinc-400">{agent.desc}</p>
          </motion.article>
        ))}

        {/* 收口卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease, delay: AGENTS.length * 0.06 }}
          className="relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-violet-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.16),rgba(236,72,153,0.1))] p-6 backdrop-blur-xl"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/90">最终交付</p>
            <h3 className="mt-3 font-display text-2xl font-bold leading-snug text-white">
              从一张产品图
              <br />
              到全链路爆款内容
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300/90">
              五个智能体串联完成洞察、策略、文案、物料与渠道适配，一次生成可直接用于详情页、社媒和视频脚本的整套营销资产。
            </p>
          </div>
          <Link
            href="/generate"
            className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/15"
          >
            进入工作台 →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
