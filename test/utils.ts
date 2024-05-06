import { env } from 'cloudflare:test';
import { assert, expect, vi } from 'vitest';

import type { Turnip } from '@/models/turnip';
import type { TurnipTransaction } from '@/models/turnip-transactions';
import { getOne } from '@/utils/d1';

const DISCORD_EPOCH = 1420070400000n;

export function generateSnowflake(date = new Date()): string {
  return ((BigInt(date.getTime()) - DISCORD_EPOCH) << 22n).toString();
}

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

export async function verifyTurnips(
  t: Turnip | Turnip[],
  expectedTurnip: Partial<Turnip>,
  expectedTransaction: Partial<TurnipTransaction>,
) {
  const turnips = Array.isArray(t) ? t : [t];

  for (const turnip of turnips) {
    expect(turnip).toMatchObject(expectedTurnip);

    const transaction = await getOne<TurnipTransaction>(env.db, 'TurnipTransaction', {
      turnipId: turnip.id,
    });
    assert(transaction != null);
    expect(transaction).toMatchObject(expectedTransaction);
  }
}
