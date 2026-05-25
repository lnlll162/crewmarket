import { API_CODES, API_MESSAGES } from '@/constants/errors';
import type { ApiResponse } from '@/types';

export function success<T>(data: T, message = API_MESSAGES[API_CODES.SUCCESS]): ApiResponse<T> {
  return { code: API_CODES.SUCCESS, message, data };
}

export function fail(code: number, message?: string): ApiResponse<null> {
  return {
    code,
    message: message ?? API_MESSAGES[code] ?? '未知错误',
    data: null,
  };
}

export function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, { status });
}
