import { ApiError } from './problem';

type Result<T> = { data?: T; error?: unknown; response: Response };

export async function request<T>(
  call: Promise<Result<T>>,
): Promise<{ data: T; response: Response }> {
  const { data, error, response } = await call;
  if (!response.ok) throw new ApiError(response, error);
  return { data: data as T, response };
}
