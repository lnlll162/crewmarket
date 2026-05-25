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

    const data = (await runCrewPipeline(body, 'analyze')) as AnalyzeResponseData;
    return jsonResponse(success(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
