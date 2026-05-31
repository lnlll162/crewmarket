import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/lib/api-response';
import { runCrewPipeline } from '@/lib/run-crew';
import type { ContentGenerateResult, ModuleRequestBase } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ModuleRequestBase;
    if (!body?.product || !body?.market) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR), 400);
    }

    const result = await runCrewPipeline(body as never, 'content');
    const data = result.data as ContentGenerateResult;
    return jsonResponse(success(data, '文案生成成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
