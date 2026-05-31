import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { createSiliconFlowSpeech } from '@/app/lib/siliconflow-server';

/**
 * 硅基流动 TTS（/audio/speech）。
 * 注意：尚未纳入 verified_models 白名单，不用于 Pipeline 默认链路；联调/实验用。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const model = typeof body?.model === 'string' ? body.model.trim() : undefined;
    const voice = typeof body?.voice === 'string' ? body.voice.trim() : undefined;
    const responseFormat = typeof body?.responseFormat === 'string' ? body.responseFormat.trim() : undefined;

    if (!text) {
      return jsonResponse(fail(API_CODES.PARAM_ERROR, 'text 不能为空'), 400);
    }

    const data = await createSiliconFlowSpeech(text, { model, voice, responseFormat });
    return jsonResponse(success({ ...data, provider: 'siliconflow' }, '语音合成成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
