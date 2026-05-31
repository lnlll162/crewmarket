import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { createSiliconFlowRerank } from '@/app/lib/siliconflow-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const documents = body?.documents;
    const model = typeof body?.model === 'string' ? body.model.trim() : undefined;
    const topN = typeof body?.topN === 'number' ? body.topN : undefined;

    if (!query) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, 'query 不能为空'), 400);
    }
    if (!Array.isArray(documents) || !documents.every((item: unknown) => typeof item === 'string')) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, 'documents 必须为字符串数组'), 400);
    }

    const data = await createSiliconFlowRerank(query, documents, { model, topN });
    return jsonResponse(success({ ...data, provider: 'siliconflow' }, 'Rerank 成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
