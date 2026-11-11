import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api/problem';

export function setServerFieldErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError) || error.fieldErrors.length === 0) return false;
  const matched = error.fieldErrors.filter((item) => fields.includes(item.field as Path<T>));
  matched.forEach((item, index) => {
    setError(item.field as Path<T>, { message: item.detail }, { shouldFocus: index === 0 });
  });
  return matched.length === error.fieldErrors.length;
}
