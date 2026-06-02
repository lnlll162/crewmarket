import type { AiTaskId, LlmProviderId } from './index';

export interface AgentModelTaskBinding {
  model: string;
  provider: LlmProviderId;
}

export interface AgentModelGenerationBinding {
  image?: string;
  video?: string;
}

export interface AgentModelConfigDocument {
  version: 1;
  updatedAt: string;
  provider: LlmProviderId;
  tasks: Partial<Record<AiTaskId, AgentModelTaskBinding>>;
  generation?: AgentModelGenerationBinding;
}

export interface AgentModelConfigRow {
  taskId: AiTaskId;
  roleId: string;
  roleName: string;
  moduleLabel: string;
  capabilityId: string;
  envVar: string;
  currentModel: string;
  provider: LlmProviderId;
  defaultModel: string;
  verified: boolean;
  isOverridden: boolean;
  source: 'saved' | 'env' | 'default';
}

export interface AgentModelCapabilityRow {
  bindingId: string;
  label: string;
  description: string;
  capabilityId: string;
  envVar: string;
  currentModel: string;
  defaultModel: string;
  verified: boolean;
  isOverridden: boolean;
  source: 'saved' | 'env' | 'default';
}

export interface AgentModelConfigResponse {
  saved: AgentModelConfigDocument | null;
  effective: AgentModelConfigDocument;
  defaults: AgentModelConfigDocument;
  rows: AgentModelConfigRow[];
  capabilityRows: AgentModelCapabilityRow[];
  verifiedModelIds: string[];
  configPath: string;
}

export interface SaveAgentModelConfigRequest {
  tasks: Record<AiTaskId, AgentModelTaskBinding>;
  generation?: AgentModelGenerationBinding;
}

export interface SaveAgentModelConfigResult {
  saved: AgentModelConfigDocument;
  warnings: string[];
}
