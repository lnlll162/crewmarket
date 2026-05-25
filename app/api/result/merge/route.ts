import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/lib/api-response';
import { runCrewPipeline } from '@/lib/run-crew';
import type { MergeResult } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ['product', 'market', 'content', 'seo', 'social'];
    if (!required.every((k) => body?.[k])) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR), 400);
    }

    const data = (await runCrewPipeline(body, 'merge')) as MergeResult;
    return jsonResponse(success(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
