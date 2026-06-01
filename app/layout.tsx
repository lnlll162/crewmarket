import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'CrewMarket — 多智能体电商营销内容引擎',
  description: '基于 CrewAI 多智能体协作，从产品图文到市场策略、营销文案、SEO、社媒与物料的一站式生成引擎。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-[#07070b] text-zinc-100 antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
