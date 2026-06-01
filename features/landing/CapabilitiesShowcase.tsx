'use client';

import { motion } from 'framer-motion';

type Cap = {
  tag: string;
  title: string;
  desc: string;
  points: string[];
  icon: JSX.Element;
  className: string;
  glow: string;
};

const I = {
  scan: (
    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M3 12h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  ),
  chart: (
    <path d="M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  pen: (
    <path d="M4 20l4-1 9-9a2 2 0 00-3-3l-9 9-1 4zM13 6l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  search: (
    <path d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  merge: (
    <path d="M6 3v4a4 4 0 004 4h4a4 4 0 014 4v4M18 17l-4 4M18 17l4 4M6 7l-2 2M6 7l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  ),
};

const CAPS: Cap[] = [
  {
    tag: 'Agent 01',
    title: '产品理解智能体',
    desc: '从产品图或文字描述中识别品类、卖点与关键属性，构建结构化产品画像。',
    points: ['识图属性提取', '卖点总结', '品类判定'],
    icon: I.scan,
    className: 'lg:col-span-3',
    glow: 'from-violet-500/20',
  },
  {
    tag: 'Agent 02',
    title: '市场与品牌策略',
    desc: '归纳类目趋势、竞品风格与目标用户画像，给出可落地的调性建议。',
    points: ['趋势洞察', '用户画像', '调性建议'],
    icon: I.chart,
    className: 'lg:col-span-3',
    glow: 'from-fuchsia-500/20',
  },
  {
    tag: 'Agent 03',
    title: '营销内容创作',
    desc: '一次生成标题、卖点、详情页、社媒文案与视频脚本，风格统一可直接使用。',
    points: ['标题/详情页', '社媒文案', '视频脚本', '海报文案'],
    icon: I.pen,
    className: 'lg:col-span-2',
    glow: 'from-cyan-400/20',
  },
  {
    tag: 'Agent 04',
    title: 'SEO 与渠道适配',
    desc: '针对搜索与多渠道场景优化关键词与表达，提升曝光与转化效率。',
    points: ['关键词优化', '渠道适配'],
    icon: I.search,
    className: 'lg:col-span-2',
    glow: 'from-violet-500/20',
  },
  {
    tag: 'Agent 05',
    title: '汇总协调智能体',
    desc: '去重、统一风格并整合为完整营销方案，输出标准 JSON 便于前后端对接。',
    points: ['结果去重', '风格统一', 'JSON 收口'],
    icon: I.merge,
    className: 'lg:col-span-2',
    glow: 'from-fuchsia-500/20',
  },
];

export function CapabilitiesShowcase() {
  return (
    <section id="capabilities" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-violet-400">能力矩阵</p>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
          五个智能体，<span className="text-gradient">一条完整链路</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          每个智能体专注一段职责，协作完成从理解到产出的全流程，让营销内容生产像流水线一样高效。
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-6">
        {CAPS.map((cap, i) => (
          <motion.article
            key={cap.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`ring-glow group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition-colors ${cap.className}`}
          >
            <div className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${cap.glow} to-transparent blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-100`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-200">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">{cap.icon}</svg>
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">{cap.tag}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{cap.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{cap.desc}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {cap.points.map((p) => (
                  <span key={p} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] font-medium text-zinc-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
