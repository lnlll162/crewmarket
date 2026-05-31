import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { createVideoJob, listVideoJobs } from '@/app/lib/video-jobs';

export async function GET() {
  return jsonResponse(success({ jobs: listVideoJobs() }, '视频任务列表获取成功'));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const model = typeof body?.model === 'string' ? body.model.trim() : undefined;
    if (!prompt) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR), 400);
    }

    const job = await createVideoJob(prompt, model);
    return jsonResponse(success(job, '视频任务创建成功'), 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
