import { vi } from 'vitest';

export function mockRandom(rv: number) {
  vi.spyOn(Math, 'random').mockReturnValue(rv);
}
