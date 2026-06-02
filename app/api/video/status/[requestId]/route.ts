import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { pollVideoStatusOnce } from '@/app/lib/video-status';

export async function GET(_: Request, { params }: { params: { requestId: string } }) {
  const requestId = (params.requestId || '').trim();
  if (!requestId) {
    return jsonResponse(fail(API_CODES.PARAM_ERROR, '缺少 requestId'), 400);
  }

  try {
    const data = await pollVideoStatusOnce(requestId);
    return jsonResponse(success(data, '视频状态查询成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : '视频状态查询失败';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
