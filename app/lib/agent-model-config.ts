import fs from 'fs/promises';
import path from 'path';
import {
  AI_TASK_ENV_PREFIX,
  AI_TASK_ORDER,
  type AiTaskId,
  type LlmProviderId,
  SILICONFLOW_VERIFIED_GENERATION_MODELS,
  SILICONFLOW_VERIFIED_TASK_MODELS,
} from '@/types';
import type {
  AgentModelCapabilityRow,
  AgentModelConfigDocument,
  AgentModelConfigResponse,
  AgentModelConfigRow,
  AgentModelGenerationBinding,
  AgentModelTaskBinding,
  SaveAgentModelConfigRequest,
  SaveAgentModelConfigResult,
} from '@/types/agent-model-config';
import {
  configPageGenerationBindings,
  configPageModelIds,
  type ConfigPageBinding,
} from '@/app/lib/verified-bindings';

export const AGENT_MODEL_CONFIG_REL_PATH = path.join('data', 'agent-model-config.json');

export const AI_TASK_META: Record<
  AiTaskId,
  { roleId: string; roleName: string; moduleLabel: string; capabilityId: string }
> = {
  'task.product_extract': {
    roleId: 'productExtract',
    roleName: '产品提取角色',
    moduleLabel: '产品提取',
    capabilityId: 'vision',
  },
  'task.market_research': {
    roleId: 'marketResearch',
    roleName: '市场分析角色',
    moduleLabel: '市场分析',
    capabilityId: 'chat',
  },
  'task.content_write': {
    roleId: 'content',
    roleName: '文案生成角色',
    moduleLabel: '文案生成',
    capabilityId: 'chat',
  },
  'task.seo_optimize': {
    roleId: 'seo',
    roleName: 'SEO 优化角色',
    moduleLabel: 'SEO 优化',
    capabilityId: 'chat',
  },
  'task.social_adapt': {
    roleId: 'social',
    roleName: '社媒改写角色',
    moduleLabel: '社媒改写',
    capabilityId: 'chat',
  },
  'task.result_merge': {
    roleId: 'merged',
    roleName: '汇总评估角色',
    moduleLabel: '结果汇总',
    capabilityId: 'chat',
  },
  'task.pdf_report': {
    roleId: 'pdfReport',
    roleName: 'PDF 报告撰写角色',
    moduleLabel: 'PDF 报告',
    capabilityId: 'chat',
  },
};

function configFilePath() {
  return path.join(process.cwd(), AGENT_MODEL_CONFIG_REL_PATH);
}

function readEnvModel(taskId: AiTaskId): string | undefined {
  return process.env[`${AI_TASK_ENV_PREFIX[taskId]}_MODEL`]?.trim() || undefined;
}

function readEnvCapability(binding: ConfigPageBinding): string | undefined {
  return process.env[binding.envVar]?.trim() || undefined;
}

function getGenerationImage(doc: AgentModelConfigDocument): string | undefined {
  return doc.generation?.image?.trim();
}

export function buildDefaultConfigDocument(): AgentModelConfigDocument {
  const tasks = Object.fromEntries(
    AI_TASK_ORDER.map((taskId) => [
      taskId,
      { model: SILICONFLOW_VERIFIED_TASK_MODELS[taskId], provider: 'siliconflow' as LlmProviderId },
    ]),
  ) as Record<AiTaskId, AgentModelTaskBinding>;

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    provider: 'siliconflow',
    tasks,
    generation: { image: SILICONFLOW_VERIFIED_GENERATION_MODELS.image },
  };
}

function mergeEffectiveConfig(saved: AgentModelConfigDocument | null): AgentModelConfigDocument {
  const defaults = buildDefaultConfigDocument();
  const tasks = {} as Record<AiTaskId, AgentModelTaskBinding>;

  for (const taskId of AI_TASK_ORDER) {
    const savedBinding = saved?.tasks?.[taskId];
    const envModel = readEnvModel(taskId);
    const defaultBinding = defaults.tasks[taskId];
    if (savedBinding?.model) tasks[taskId] = savedBinding;
    else if (envModel) {
      tasks[taskId] = {
        model: envModel,
        provider: (process.env[`${AI_TASK_ENV_PREFIX[taskId]}_PROVIDER`] as LlmProviderId) || 'siliconflow',
      };
    } else {
      tasks[taskId] = defaultBinding ?? { model: SILICONFLOW_VERIFIED_TASK_MODELS[taskId], provider: 'siliconflow' };
    }
  }

  const imageBinding = configPageGenerationBindings()[0];
  const savedImage = getGenerationImage(saved ?? {});
  const envImage = imageBinding ? readEnvCapability(imageBinding) : undefined;
  const generation: AgentModelGenerationBinding = {
    image: savedImage || envImage || defaults.generation?.image,
  };

  return {
    version: 1,
    updatedAt: saved?.updatedAt ?? defaults.updatedAt,
    provider: 'siliconflow',
    tasks,
    generation,
  };
}

function resolveTaskSource(taskId: AiTaskId, saved: AgentModelConfigDocument | null): AgentModelConfigRow['source'] {
  if (saved?.tasks?.[taskId]?.model) return 'saved';
  if (readEnvModel(taskId)) return 'env';
  return 'default';
}

function resolveCapabilitySource(
  binding: ConfigPageBinding,
  saved: AgentModelConfigDocument | null,
): AgentModelCapabilityRow['source'] {
  if (binding.bindingId === 'generation.image' && getGenerationImage(saved ?? {})) return 'saved';
  if (readEnvCapability(binding)) return 'env';
  return 'default';
}

function assertVerifiedModel(model: string, label: string, allowed: Set<string>) {
  if (!allowed.has(model.trim())) {
    throw new Error(`${label} 所选模型「${model}」不在主链路白名单内，无法保存`);
  }
}

export async function readSavedConfig(): Promise<AgentModelConfigDocument | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(configFilePath(), 'utf-8')) as AgentModelConfigDocument;
    if (parsed.version !== 1 || !parsed.tasks) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeSavedConfig(doc: AgentModelConfigDocument): Promise<void> {
  const filePath = configFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(doc, null, 2)}\n`, 'utf-8');
}

export async function deleteSavedConfig(): Promise<void> {
  try {
    await fs.unlink(configFilePath());
  } catch {
    // ignore
  }
}

export async function getAgentModelConfigResponse(): Promise<AgentModelConfigResponse> {
  const saved = await readSavedConfig();
  const defaults = buildDefaultConfigDocument();
  const effective = mergeEffectiveConfig(saved);
  const verifiedIds = configPageModelIds();

  const rows: AgentModelConfigRow[] = AI_TASK_ORDER.map((taskId) => {
    const meta = AI_TASK_META[taskId];
    const binding = effective.tasks[taskId] ?? defaults.tasks[taskId]!;
    const defaultModel = defaults.tasks[taskId]?.model ?? binding.model;
    const source = resolveTaskSource(taskId, saved);
    return {
      taskId,
      roleId: meta.roleId,
      roleName: meta.roleName,
      moduleLabel: meta.moduleLabel,
      capabilityId: meta.capabilityId,
      envVar: `${AI_TASK_ENV_PREFIX[taskId]}_MODEL`,
      currentModel: binding.model,
      provider: binding.provider,
      defaultModel,
      verified: verifiedIds.has(binding.model),
      isOverridden: binding.model !== defaultModel || source === 'saved',
      source,
    };
  });

  const capabilityRows: AgentModelCapabilityRow[] = configPageGenerationBindings().map((binding) => {
    const currentModel = getGenerationImage(effective) ?? binding.defaultModel;
    const source = resolveCapabilitySource(binding, saved);
    return {
      bindingId: binding.bindingId,
      label: binding.label,
      description: binding.description,
      capabilityId: binding.capabilityId,
      envVar: binding.envVar,
      currentModel,
      defaultModel: binding.defaultModel,
      verified: verifiedIds.has(currentModel),
      isOverridden: currentModel !== binding.defaultModel || source === 'saved',
      source,
    };
  });

  return {
    saved,
    effective,
    defaults,
    rows,
    capabilityRows,
    verifiedModelIds: [...verifiedIds],
    configPath: AGENT_MODEL_CONFIG_REL_PATH,
  };
}

export async function saveAgentModelConfig(body: SaveAgentModelConfigRequest): Promise<SaveAgentModelConfigResult> {
  const allowed = configPageModelIds();

  for (const taskId of AI_TASK_ORDER) {
    const binding = body.tasks[taskId];
    if (!binding?.model?.trim()) throw new Error(`${taskId} 缺少 model`);
    assertVerifiedModel(binding.model, AI_TASK_META[taskId].moduleLabel, allowed);
  }

  const generation = body.generation ?? {};
  if (generation.image) assertVerifiedModel(generation.image, '文生图', allowed);

  const doc: AgentModelConfigDocument = {
    version: 1,
    updatedAt: new Date().toISOString(),
    provider: 'siliconflow',
    tasks: Object.fromEntries(
      AI_TASK_ORDER.map((taskId) => [
        taskId,
        { model: body.tasks[taskId].model.trim(), provider: body.tasks[taskId].provider || 'siliconflow' },
      ]),
    ) as Record<AiTaskId, AgentModelTaskBinding>,
    generation: generation.image ? { image: generation.image.trim() } : undefined,
  };

  await writeSavedConfig(doc);
  return { saved: doc, warnings: [] };
}
