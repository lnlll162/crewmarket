import { GenerateWorkspace } from '@/features/generate/GenerateWorkspace';
import { LandingHero } from '@/features/landing/LandingHero';
import { ModelMarquee } from '@/features/landing/ModelMarquee';
import { CapabilitiesShowcase } from '@/features/landing/CapabilitiesShowcase';
import { ProcessFlow } from '@/features/landing/ProcessFlow';

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <ModelMarquee />
      <CapabilitiesShowcase />
      <ProcessFlow />

      {/* 生成工作台 */}
      <section id="workbench" className="relative scroll-mt-20 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-cyan-400">生成工作台</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              现在就<span className="text-gradient">开始创作</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              填写产品描述或上传产品图片，点击一键生成，几分钟内获得完整营销内容方案。
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
            <div className="relative">
              <GenerateWorkspace />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
