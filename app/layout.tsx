import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'CrewMarket — 多智能体电商营销内容生成',
  description: '基于 CrewAI 多智能体的电商营销内容一站式生成：从产品图到市场策略、营销文案、物料扩展、视频生成与结果整合。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-[#06060b] font-sans text-zinc-100 antialiased">
        {/* 全局电影感氛围背景 */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(38,24,64,0.9),transparent_60%)]" />
          <div className="aurora-blob -left-32 -top-24 h-[34rem] w-[34rem] bg-[rgb(var(--aurora-1))]/30" />
          <div
            className="aurora-blob right-[-12rem] top-24 h-[30rem] w-[30rem] bg-[rgb(var(--aurora-2))]/24"
            style={{ animationDelay: '-7s' }}
          />
          <div
            className="aurora-blob bottom-[-14rem] left-1/3 h-[32rem] w-[32rem] bg-[rgb(var(--aurora-3))]/18"
            style={{ animationDelay: '-13s' }}
          />
          <div className="absolute inset-0 grid-overlay opacity-60" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(6,6,11,0.6)_70%,#06060b)]" />
        </div>

        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-8 sm:px-6">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
