import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/lib/api-response';
import { runCrewPipeline, validateProductInput } from '@/lib/run-crew';
import type { AnalyzeResponseData } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!validateProductInput(body)) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR), 400);
    }

    const result = (await runCrewPipeline(body, 'analyze')) as { data: AnalyzeResponseData };
    const data = result.data;
    return jsonResponse(success(data, '产品分析成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
