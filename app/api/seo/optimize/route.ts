import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/lib/api-response';
import { runCrewPipeline } from '@/lib/run-crew';
import type { SeoOptimizeResult } from '@/types';

type ModuleRequestBase = {
  content?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ModuleRequestBase;
    if (!body?.content) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR), 400);
    }

    const result = (await runCrewPipeline(body as never, 'seo')) as { data: SeoOptimizeResult };
    const data = result.data;
    return jsonResponse(success(data, 'SEO 优化成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
