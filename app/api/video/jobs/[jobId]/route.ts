import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { getVideoJob } from '@/app/lib/video-jobs';

export async function GET(_: Request, { params }: { params: { jobId: string } }) {
  const job = getVideoJob(params.jobId);
  if (!job) {
    return jsonResponse(fail(API_CODES.NOT_FOUND, '视频任务不存在'), 404);
  }
  return jsonResponse(success(job));
}
