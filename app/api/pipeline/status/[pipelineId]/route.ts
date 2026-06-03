import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { getPipelineStatus, getPipelineResult, getPipelineInput } from '@/app/lib/pipeline-store';
import { API_CODES } from '@/constants/errors';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pipelineId: string }> },
) {
  try {
    const { pipelineId } = await params;
    const status = await getPipelineStatus(pipelineId);

    if (!status) {
      return jsonResponse(fail(API_CODES.NOT_FOUND, 'Pipeline 不存在'), 404);
    }

    const input = await getPipelineInput(pipelineId);

    // 如果已完成，附带完整结果
    if (status.status === 'completed') {
      const result = await getPipelineResult(pipelineId);
      return jsonResponse(
        success({ status: status.status, updatedAt: status.updatedAt, result, input }),
      );
    }

    return jsonResponse(
      success({ status: status.status, updatedAt: status.updatedAt, error: status.error, input }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    return jsonResponse(fail(API_CODES.SERVER_ERROR, message), 500);
  }
}
