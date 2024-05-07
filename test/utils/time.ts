import { assert, vi } from 'vitest';

export function freezeTime(): number {
  const now = new Date();
  vi.setSystemTime(now);

  return now.getTime();
}
export function shiftTime(ms: number): number {
  const mockedTime = vi.getMockedSystemTime();
  assert(mockedTime != null);

  const now = mockedTime.getTime() + ms;
  vi.setSystemTime(now);
  return now;
}
