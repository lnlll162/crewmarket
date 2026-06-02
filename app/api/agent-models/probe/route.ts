import { API_CODES } from '@/constants/errors';
import { probeConfigBindings } from '@/app/lib/agent-model-probe';
import { fail, jsonResponse, success } from '@/app/lib/api-response';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') === 'live' ? 'live' : 'offline';
    const report = await probeConfigBindings(mode);
    const message =
      mode === 'live'
        ? report.ok
          ? `全部绑定 live 探针通过 (${report.live?.passedBindings}/${report.live?.totalBindings})`
          : '部分绑定 live 探针失败'
        : report.offline?.skipped
          ? '无本地配置文件，当前使用默认/环境变量'
          : report.ok
            ? '配置文件已成功注入环境变量'
            : '配置文件与环境变量不一致';

    return jsonResponse(
      success(report, message),
      report.ok ? 200 : 502,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '绑定探针失败';
    return jsonResponse(fail(API_CODES.AI_SERVICE_ERROR, message), 500);
  }
}
