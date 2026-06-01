import Link from 'next/link';

const COLS = [
  {
    title: '产品',
    links: [
      { label: '生成工作台', href: '/' },
      { label: '模型配置', href: '/models' },
      { label: '模型对比', href: '/compare' },
      { label: '对比历史', href: '/compare/history' },
    ],
  },
  {
    title: '能力',
    links: [
      { label: '产品理解', href: '/#capabilities' },
      { label: '市场策略', href: '/#capabilities' },
      { label: '内容创作', href: '/#capabilities' },
      { label: 'SEO 优化', href: '/#capabilities' },
    ],
  },
  {
    title: '资源',
    links: [
      { label: 'GitHub 仓库', href: 'https://github.com/lnlll162/crewmarket' },
      { label: 'CrewAI', href: 'https://www.crewai.com/' },
      { label: '硅基流动', href: 'https://siliconflow.cn/' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-10 border-t border-white/10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center">
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400" />
                <span className="absolute inset-[1.5px] rounded-[10px] bg-[#0b0b12]" />
                <span className="relative text-[15px] font-black text-white">C</span>
              </span>
              <span className="text-[17px] font-bold tracking-tight text-white">
                Crew<span className="text-gradient">Market</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              基于 CrewAI 多智能体协作的电商营销内容生成引擎，从产品图文到完整营销方案。
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-zinc-400 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-zinc-600 sm:flex-row">
          <span>© {new Date().getFullYear()} CrewMarket · 多智能体营销内容引擎</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Powered by CrewAI × 硅基流动
          </span>
        </div>
      </div>
    </footer>
  );
}
