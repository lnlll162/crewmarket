'use client';

import { motion } from 'framer-motion';

const STEPS = [
  { n: '01', t: '产品识图', d: '图片 / 文字输入解析' },
  { n: '02', t: '市场分析', d: '趋势与用户洞察' },
  { n: '03', t: '内容生成', d: '标题 · 详情 · 卖点' },
  { n: '04', t: 'SEO 优化', d: '关键词与表达' },
  { n: '05', t: '社媒适配', d: '多渠道文案' },
  { n: '06', t: '物料扩展', d: '海报 · 分镜 · 提示词' },
  { n: '07', t: '汇总输出', d: '统一 JSON 方案' },
];

export function ProcessFlow() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[120px]" />
      </div>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-fuchsia-400">运行流程</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            七步串行，<span className="text-gradient">自动编排</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            前端分步串行调用各能力 API，每一步独立可观测，结果逐层汇聚为完整方案。
          </p>
        </div>

        <div className="relative mt-16">
          {/* 连接线 */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 lg:grid-cols-7">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="relative flex flex-col items-center text-center"
              >
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#0c0c14] text-sm font-black text-white shadow-[0_0_24px_rgba(139,92,246,0.25)]">
                  <span className="text-gradient">{s.n}</span>
                </span>
                <h3 className="mt-4 text-sm font-bold text-white">{s.t}</h3>
                <p className="mt-1 text-[12px] leading-snug text-zinc-500">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
