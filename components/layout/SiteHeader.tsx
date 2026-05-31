'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: '生成工作台' },
  { href: '/models', label: '模型配置' },
  { href: '/compare', label: '模型对比' },
  { href: '/compare/history', label: '对比历史' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Crew<span className="text-violet-400">Market</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'font-medium text-violet-200' : 'text-zinc-400 transition hover:text-white'}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
