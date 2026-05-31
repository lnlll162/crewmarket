import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { appendCompareHistory, readCompareHistory, type CompareHistoryRecord } from '@/app/lib/compare-history';

export async function GET() {
  try {
    const history = await readCompareHistory();
    return jsonResponse(success({ history }, '对比历史读取成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : '对比历史读取失败';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompareHistoryRecord;
    if (!body || typeof body !== 'object' || !body.id || !Array.isArray(body.taskIds) || !Array.isArray(body.candidateModels)) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, '历史记录参数不完整'), 400);
    }

    const history = await appendCompareHistory(body);
    return jsonResponse(success({ history }, '对比历史已保存'));
  } catch (err) {
    const message = err instanceof Error ? err.message : '对比历史保存失败';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
