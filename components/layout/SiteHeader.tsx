'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/', label: '首页' },
  { href: '/generate', label: '生成工作台' },
  { href: '/models', label: '模型配置' },
  { href: '/compare', label: '模型对比' },
  { href: '/compare/history', label: '对比历史' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-[#06060b]/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgb(var(--aurora-1)),rgb(var(--aurora-2)))] shadow-[0_8px_24px_-6px_rgba(168,85,247,0.7)] ring-1 ring-white/20">
            <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent_50%)]" />
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l2.2 5.4L20 9.6l-4.3 3.7L17 19l-5-3-5 3 1.3-5.7L4 9.6l5.8-1.2L12 3z" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Crew<span className="text-aurora">Market</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-200 ${
                  active ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/10" />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/generate"
            className="sheen relative hidden overflow-hidden rounded-full bg-[linear-gradient(110deg,rgb(var(--aurora-1)),rgb(var(--aurora-2)))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(168,85,247,0.8)] ring-1 ring-white/20 transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            开始生成
          </Link>
        </div>
      </div>

      {/* 移动端导航 */}
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition ${
                active ? 'bg-white/10 text-white ring-1 ring-inset ring-white/10' : 'text-zinc-400'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
