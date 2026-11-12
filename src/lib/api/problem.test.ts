import { describe, expect, it } from 'vitest';
import { ApiError, errorMessage, isProblem, problemTypes } from './problem';

function apiError(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new ApiError(new Response(null, { status, statusText: 'Status text', headers }), body);
}

describe('ApiError', () => {
  it('reads the problem, request ID, and Retry-After', () => {
    const error = apiError(
      400,
      {
        type: problemTypes.validationFailed,
        detail: 'Fix the fields.',
        errors: [{ field: 'title', detail: 'Too long' }],
      },
      { 'X-Request-Id': 'req_1', 'Retry-After': '7' },
    );

    expect(error.type).toBe('urn:problem:validation-failed');
    expect(error.detail).toBe('Fix the fields.');
    expect(error.fieldErrors).toEqual([{ field: 'title', detail: 'Too long' }]);
    expect(error.requestId).toBe('req_1');
    expect(error.retryAfterSeconds).toBe(7);
    expect(isProblem(error, problemTypes.validationFailed)).toBe(true);
  });

  it('falls back to the status text for a body that isn’t a problem', () => {
    const error = apiError(502, '<html>Bad gateway</html>', { 'Retry-After': 'soon' });

    expect(error.type).toBe('about:blank');
    expect(error.detail).toBe('Status text');
    expect(error.fieldErrors).toEqual([]);
    expect(error.requestId).toBeNull();
    expect(error.retryAfterSeconds).toBeNull();
  });

  it.each([
    ['an array', [{ type: problemTypes.notFound }]],
    ['a detail that isn’t text', { type: problemTypes.notFound, detail: 404 }],
    [
      'malformed field errors',
      { type: problemTypes.validationFailed, errors: [{ field: 'title' }] },
    ],
    ['field errors that aren’t a list', { type: problemTypes.validationFailed, errors: {} }],
  ])('ignores a problem with %s', (_, body) => {
    const error = apiError(400, body);

    expect(error.type).toBe('about:blank');
    expect(error.detail).toBe('Status text');
    expect(error.fieldErrors).toEqual([]);
  });
});

describe('errorMessage', () => {
  it('explains a network failure', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe(
      'Can’t reach the server. Check your connection, then try again.',
    );
  });

  it('says when to retry after a rate limit', () => {
    const limited = (seconds?: string) =>
      apiError(429, { type: problemTypes.rateLimited }, seconds ? { 'Retry-After': seconds } : {});

    expect(errorMessage(limited('30'))).toBe('Too many requests. Try again in 30 seconds.');
    expect(errorMessage(limited('1'))).toBe('Too many requests. Try again in 1 second.');
    expect(errorMessage(limited())).toBe('Too many requests. Wait a minute, then try again.');
  });

  it('uses a written message for known problem types', () => {
    expect(errorMessage(apiError(401, { type: problemTypes.invalidCredentials }))).toBe(
      'That email and password don’t match. Check both, then try again.',
    );
  });

  it('points to the fields when the API names them', () => {
    const error = apiError(400, {
      type: problemTypes.validationFailed,
      detail: 'The request has invalid fields.',
      errors: [{ field: 'title', detail: 'Too long' }],
    });

    expect(errorMessage(error)).toBe('Some fields need fixing. Check the messages next to them.');
  });

  it('shows the detail of a validation failure that names no field', () => {
    const error = apiError(400, {
      type: problemTypes.validationFailed,
      detail: 'A value is outside the allowed range. Fix it and retry.',
    });

    expect(errorMessage(error)).toBe('A value is outside the allowed range. Fix it and retry.');
  });

  it('shows errors about the whole body, which have an empty field', () => {
    const error = apiError(400, {
      type: problemTypes.validationFailed,
      detail: 'The request has invalid fields.',
      errors: [
        { field: 'title', detail: 'Too long' },
        { field: '', detail: 'Send at least one field.' },
      ],
    });

    expect(errorMessage(error)).toBe('Send at least one field.');
  });

  it('adds the request ID to server errors', () => {
    const error = apiError(
      500,
      { type: 'urn:problem:internal-error' },
      { 'X-Request-Id': 'req_9' },
    );

    expect(errorMessage(error)).toBe(
      'The server couldn’t finish this request. Try again. If it keeps happening, quote request ID req_9.',
    );
  });

  it('shows the detail of an unknown client error', () => {
    const error = apiError(422, { type: 'urn:problem:custom', detail: 'Pick another slug.' });

    expect(errorMessage(error)).toBe('Pick another slug.');
  });

  it('covers errors that aren’t from the API', () => {
    expect(errorMessage(new Error('boom'))).toBe(
      'Something unexpected went wrong. Reload the page, then try again.',
    );
  });
});
