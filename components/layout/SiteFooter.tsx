import Link from 'next/link';

const COLUMNS = [
  {
    title: '产品',
    links: [
      { label: '首页', href: '/' },
      { label: '生成工作台', href: '/generate' },
      { label: '模型配置', href: '/models' },
      { label: '模型对比', href: '/compare' },
      { label: '对比历史', href: '/compare/history' },
    ],
  },
  {
    title: '智能体',
    links: [
      { label: '产品提取', href: '/#capabilities' },
      { label: '市场与品牌策略', href: '/#capabilities' },
      { label: '营销内容', href: '/#capabilities' },
      { label: '汇总协调', href: '/#capabilities' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-10 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgb(var(--aurora-1)),rgb(var(--aurora-2)))] ring-1 ring-white/20">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l2.2 5.4L20 9.6l-4.3 3.7L17 19l-5-3-5 3 1.3-5.7L4 9.6l5.8-1.2L12 3z" />
                </svg>
              </span>
              <span className="font-display text-base font-bold text-white">
                Crew<span className="text-aurora">Market</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
              基于 CrewAI 的多智能体电商营销全链路生成系统 —— 从产品图与描述，到市场策略、营销内容、物料扩展与结果整合的一站式生成。
            </p>
            <a
              href="https://github.com/lnlll162/crewmarket"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-violet-300"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
              </svg>
              github.com/lnlll162/crewmarket
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link, i) => (
                  <li key={`${link.label}-${i}`}>
                    <Link href={link.href} className="text-sm text-zinc-400 transition hover:text-violet-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-zinc-600 sm:flex-row">
          <p>© {new Date().getFullYear()} CrewMarket · 多智能体营销生成系统</p>
          <p className="flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Powered by CrewAI · Next.js · llln162
          </p>
        </div>
      </div>
    </footer>
  );
}
