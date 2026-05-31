import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { createSiliconFlowEmbeddings } from '@/app/lib/siliconflow-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = body?.input;
    const model = typeof body?.model === 'string' ? body.model.trim() : undefined;

    if (typeof input !== 'string' && !Array.isArray(input)) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, 'input 必须为字符串或字符串数组'), 400);
    }
    if (Array.isArray(input) && !input.every((item) => typeof item === 'string')) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, 'input 数组元素必须为字符串'), 400);
    }

    const data = await createSiliconFlowEmbeddings(input, model);
    return jsonResponse(success({ ...data, provider: 'siliconflow' }, 'Embeddings 成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
