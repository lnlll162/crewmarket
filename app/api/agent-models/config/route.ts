import { API_CODES } from '@/constants/errors';
import {
  deleteSavedConfig,
  getAgentModelConfigResponse,
  saveAgentModelConfig,
} from '@/app/lib/agent-model-config';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import type { SaveAgentModelConfigRequest } from '@/types/agent-model-config';
import { AI_TASK_ORDER, type AiTaskId } from '@/types';

function isSaveRequest(body: unknown): body is SaveAgentModelConfigRequest {
  if (!body || typeof body !== 'object') return false;
  const tasks = (body as SaveAgentModelConfigRequest).tasks;
  if (!tasks || typeof tasks !== 'object') return false;
  return AI_TASK_ORDER.every((taskId) => {
    const item = tasks[taskId as AiTaskId];
    return item && typeof item.model === 'string' && item.model.trim().length > 0;
  });
}

export async function GET() {
  try {
    const data = await getAgentModelConfigResponse();
    return jsonResponse(success(data, '模型配置读取成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : '模型配置读取失败';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!isSaveRequest(body)) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, 'tasks 参数不完整或缺少 model'), 400);
    }

    const result = await saveAgentModelConfig(body);
    const snapshot = await getAgentModelConfigResponse();

    return jsonResponse(
      success(
        {
          ...result,
          snapshot,
        },
        result.warnings.length ? '配置已保存（含警告）' : '模型配置保存成功',
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '模型配置保存失败';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}

export async function DELETE() {
  try {
    await deleteSavedConfig();
    const snapshot = await getAgentModelConfigResponse();
    return jsonResponse(success({ snapshot }, '已恢复为默认/环境变量配置'));
  } catch (err) {
    const message = err instanceof Error ? err.message : '重置配置失败';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
