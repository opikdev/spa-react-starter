import { z } from 'zod/mini';

export const problemTypes = {
  validationFailed: 'urn:problem:validation-failed',
  invalidCredentials: 'urn:problem:invalid-credentials',
  unauthorized: 'urn:problem:unauthorized',
  forbidden: 'urn:problem:forbidden',
  notFound: 'urn:problem:not-found',
  emailTaken: 'urn:problem:email-taken',
  versionMismatch: 'urn:problem:version-mismatch',
  rateLimited: 'urn:problem:rate-limited',
} as const;

const problemSchema = z.object({
  type: z.string(),
  detail: z.optional(z.string()),
  errors: z.optional(z.array(z.object({ field: z.string(), detail: z.string() }))),
});

export type FieldError = { field: string; detail: string };

export class ApiError extends Error {
  readonly status: number;
  readonly type: string;
  readonly detail: string;
  readonly fieldErrors: FieldError[];
  readonly requestId: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(response: Response, body: unknown) {
    const problem = problemSchema.safeParse(body);
    const type = problem.success ? problem.data.type : 'about:blank';
    super(`${response.status} ${type}`);
    this.name = 'ApiError';
    this.status = response.status;
    this.type = type;
    this.detail = (problem.success && problem.data.detail) || response.statusText;
    this.fieldErrors = (problem.success && problem.data.errors) || [];
    this.requestId = response.headers.get('X-Request-Id');
    this.retryAfterSeconds = parseRetryAfter(response.headers.get('Retry-After'));
  }
}

function parseRetryAfter(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  return Number(value);
}

export function isProblem(error: unknown, type: string): error is ApiError {
  return error instanceof ApiError && error.type === type;
}

const messages: Record<string, string> = {
  [problemTypes.validationFailed]: 'Some fields need fixing. Check the messages next to them.',
  [problemTypes.invalidCredentials]:
    'That email and password don’t match. Check both, then try again.',
  [problemTypes.unauthorized]: 'Your session ended. Log in again to continue.',
  [problemTypes.forbidden]: 'The server refused this request. Reload the page, then try again.',
  [problemTypes.notFound]: 'This item doesn’t exist, or it was deleted.',
  [problemTypes.emailTaken]: 'An account with this email already exists. Log in instead.',
  [problemTypes.versionMismatch]: 'Someone changed this note after you opened it.',
};

export function errorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return 'Can’t reach the server. Check your connection, then try again.';
  }
  if (!(error instanceof ApiError)) {
    return 'Something unexpected went wrong. Reload the page, then try again.';
  }
  if (error.status === 429) {
    const wait = error.retryAfterSeconds;
    return wait === null
      ? 'Too many requests. Wait a minute, then try again.'
      : `Too many requests. Try again in ${wait} ${wait === 1 ? 'second' : 'seconds'}.`;
  }
  const known = messages[error.type];
  if (known) return known;
  const message =
    error.status >= 500 ? 'The server couldn’t finish this request. Try again.' : error.detail;
  const reference = error.requestId
    ? `If it keeps happening, quote request ID ${error.requestId}.`
    : '';
  return [message, reference].filter(Boolean).join(' ');
}
