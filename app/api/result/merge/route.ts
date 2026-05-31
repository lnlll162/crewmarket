import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/lib/api-response';
import { runCrewPipeline } from '@/lib/run-crew';
import type { MergeResult, ModuleRequestBase } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ModuleRequestBase;
    const required = ['product', 'market', 'content', 'seo', 'social'];
    if (!required.every((k) => body?.[k as keyof ModuleRequestBase])) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR), 400);
    }

    const result = await runCrewPipeline(body as never, 'merge');
    const data = result.data as MergeResult;
    return jsonResponse(success(data, '结果汇总成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
