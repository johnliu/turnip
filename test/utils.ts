import { env } from 'cloudflare:test';
import { assert, expect } from 'vitest';

import type { Turnip } from '@/models/turnip';
import type { TurnipTransaction } from '@/models/turnip-transactions';
import { getOne } from '@/utils/d1';

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
