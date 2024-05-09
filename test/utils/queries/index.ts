import type { Result } from 'neverthrow';
import { assert } from 'vitest';

import type { StandardError } from '@/utils/errors';

export async function expectOk<T>(promise: Promise<Result<T, unknown>>): Promise<T> {
  const result = await promise;
  assert(result.isOk());

  return result.value;
}

export async function expectErr<E extends StandardError<unknown>>(
  promise: Promise<Result<unknown, E>>,
): Promise<E> {
  const result = await promise;
  assert(result.isErr());

  return result.error;
}
