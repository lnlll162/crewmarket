import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { transcribeSiliconFlowAudio } from '@/app/lib/siliconflow-server';

/** STT 实验接口：上传 base64 音频（未进 Pipeline 白名单默认） */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const audioBase64 = typeof body?.audioBase64 === 'string' ? body.audioBase64.trim() : '';
    const model = typeof body?.model === 'string' ? body.model.trim() : undefined;
    if (!audioBase64) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, 'audioBase64 不能为空'), 400);
    }
    const data = await transcribeSiliconFlowAudio(audioBase64, model);
    return jsonResponse(success({ ...data, provider: 'siliconflow' }, '语音转写成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
