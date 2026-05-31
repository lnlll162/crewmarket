import { getAgentModelConfigResponse } from '@/app/lib/agent-model-config';
import { ModelConfigWorkspace } from '@/features/models/ModelConfigWorkspace';

export default async function ModelsPage() {
  const initialConfig = await getAgentModelConfigResponse();

  return (
    <div className="space-y-8 rounded-[28px] border border-violet-400/12 bg-[linear-gradient(180deg,rgba(16,16,24,0.94),rgba(9,9,14,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
      <section className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,14,22,0.96),rgba(11,11,16,0.98))] px-8 py-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-300">模型控制台</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">任务模型配置</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          管理主 Pipeline 使用的 LLM 任务与文生图模型，保存后应用于后续一键生成。
        </p>
      </section>
      <ModelConfigWorkspace initialConfig={initialConfig} />
    </div>
  );
}
