import type { Metadata } from 'next';
import { GenerateWorkspace } from '@/features/generate/GenerateWorkspace';

export const metadata: Metadata = {
  title: '生成工作台 — CrewMarket',
  description: '上传产品图或填写描述，多智能体分步生成完整电商营销方案。',
};

export default function GeneratePage() {
  return (
    <div id="workspace" className="scroll-mt-24">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="eyebrow">生成工作台</span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          输入产品信息，<span className="text-aurora">一键生成方案</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          上传产品图或填写描述，智能体将分步执行并实时展示每个环节的产出。
        </p>
      </div>
      <GenerateWorkspace />
    </div>
  );
}
