import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { getLatestPipelineInfo, getPipelineInput } from '@/app/lib/pipeline-store';
import { API_CODES } from '@/constants/errors';

export async function GET() {
  try {
    const info = await getLatestPipelineInfo();

    if (!info || info.status === 'not_found') {
      return jsonResponse(fail(API_CODES.NOT_FOUND, '暂无历史 Pipeline 记录'), 404);
    }

    const input = await getPipelineInput(info.pipelineId);

    if (info.status === 'running') {
      return jsonResponse(
        success(
          { pipelineId: info.pipelineId, status: 'running' as const, input },
          'Pipeline 正在运行中',
        ),
      );
    }

    if (info.status === 'failed') {
      return jsonResponse(
        success(
          { pipelineId: info.pipelineId, status: 'failed' as const, error: info.error, input },
          'Pipeline 执行失败',
        ),
      );
    }

    return jsonResponse(
      success({ ...info.result!, input }, '获取最新 Pipeline 结果成功'),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    return jsonResponse(fail(API_CODES.SERVER_ERROR, message), 500);
  }
}
