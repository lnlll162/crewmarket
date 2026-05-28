export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T | null;
}

export function success<T>(data: T, message = 'OK'): ApiEnvelope<T> {
  return { code: 0, message, data };
}

export function fail(code: number, message: string): ApiEnvelope<null> {
  return { code, message, data: null };
}

export function jsonResponse<T>(body: ApiEnvelope<T>, status = 200) {
  return Response.json(body, { status });
}
