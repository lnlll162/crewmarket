import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { getPipelineResult } from '@/app/lib/pipeline-store';
import { API_CODES } from '@/constants/errors';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pipelineId: string }> },
) {
  try {
    const { pipelineId } = await params;
    const result = await getPipelineResult(pipelineId);

    if (!result) {
      return jsonResponse(fail(API_CODES.NOT_FOUND, 'Pipeline 结果不存在或尚未完成'), 404);
    }

    return jsonResponse(success(result, '获取 Pipeline 结果成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    return jsonResponse(fail(API_CODES.SERVER_ERROR, message), 500);
  }
}
