import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { runCrewPipeline, validateProductInput } from '@/app/lib/run-crew';
import {
  generatePipelineId,
  savePipelineInput,
  savePipelineResult,
  savePipelineStatus,
  setLatestPointer,
} from '@/app/lib/pipeline-store';
import { pollVideoStatusOnce } from '@/app/lib/video-status';
import type { PipelineRunResponseData } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!validateProductInput(body)) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, '参数错误'), 400);
    }

    const pipelineId = generatePipelineId();
    await savePipelineInput(pipelineId, body);
    await savePipelineStatus(pipelineId, 'running');
    setLatestPointer(pipelineId);

    // 后台异步执行，不阻塞 HTTP 响应
    runCrewPipeline(body, 'full')
      .then(async (data: PipelineRunResponseData) => {
        data.pipelineId = data.pipelineId || pipelineId;

        if (data.status === 'completed') {
          // 保存前查询视频是否已生成完成，避免恢复时重复轮询
          const videoGen = data.steps?.content?.videoGeneration;
          if (videoGen?.requestId && !videoGen.url) {
            try {
              const videoResult = await pollVideoStatusOnce(videoGen.requestId);
              if (videoResult.url || videoResult.status === 'completed' || videoResult.status === 'generated') {
                data.steps!.content!.videoGeneration = {
                  ...videoGen,
                  ...videoResult,
                  status: 'completed',
                };
              }
            } catch {
              // 视频状态查询失败不影响主流程
            }
          }

          await savePipelineResult(pipelineId, data);
          await savePipelineStatus(pipelineId, 'completed', {
            stepsCompleted: Object.keys(data.steps ?? {}),
          });
        } else {
          await savePipelineStatus(pipelineId, 'failed', {
            error: data.error?.message ?? 'Pipeline 执行失败',
          });
        }
      })
      .catch(async (err: unknown) => {
        const message = err instanceof Error ? err.message : 'AI 服务异常';
        await savePipelineStatus(pipelineId, 'failed', { error: message });
      });

    return jsonResponse(
      success({ pipelineId, status: 'running' }, 'Pipeline 已启动'),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
