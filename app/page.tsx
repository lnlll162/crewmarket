import { GenerateWorkspace } from '@/features/generate/GenerateWorkspace';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-white">电商营销内容生成</h1>
        <p className="mt-2 text-zinc-400">
          上传产品图与描述，6 个 AI 智能体协作生成文案、SEO 与社媒内容
        </p>
      </section>
      <GenerateWorkspace />
    </div>
  );
}
