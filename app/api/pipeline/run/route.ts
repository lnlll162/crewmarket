import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { runCrewPipeline, validateProductInput } from '@/app/lib/run-crew';
import type { PipelineRunResponseData } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!validateProductInput(body)) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, '参数错误'), 400);
    }

    const data = (await runCrewPipeline(body, 'full')) as PipelineRunResponseData;


    if (data.status === 'failed') {
      return jsonResponse(
        fail(API_CODES.AI_SERVICE_ERROR, data.error?.message ?? 'Pipeline 执行失败'),
        500,
      );
    }

    return jsonResponse(success(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
