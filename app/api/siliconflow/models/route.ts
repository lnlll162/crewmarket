import { API_CODES } from '@/constants/errors';
import { fail, jsonResponse, success } from '@/app/lib/api-response';
import { fetchSiliconFlowCatalog } from '@/app/lib/siliconflow-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') === 'account' ? 'account' : 'verified';
    const catalog = await fetchSiliconFlowCatalog(mode);
    return jsonResponse(success(catalog, '硅基流动模型目录获取成功'));
  } catch (err) {
    const message = err instanceof Error ? err.message : '硅基流动服务异常';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
