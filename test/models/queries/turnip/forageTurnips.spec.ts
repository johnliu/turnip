import { env } from 'cloudflare:test';
import { assert, test as base, beforeEach, describe, expect, vi } from 'vitest';

import {
  ForageOnCooldownError,
  OriginType,
  OwnerType,
  QueryError,
  TurnipType,
  USER_FORAGE_COOLDOWN_MS,
} from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';
import type { Turnip } from '@/models/turnip';
import { getMany } from '@/utils/d1';

import { verifyTurnips } from '../../../utils';
import { generateSnowflake } from '../../../utils/snowflake';
import { shiftTime } from '../../../utils/time';
import { freezeTime } from '../../../utils/time';

interface Context {
  userId: string;
  timestamp: number;
}

const test = base<Context>;

beforeEach<Context>(async (context) => {
  context.userId = generateSnowflake();
  context.timestamp = freezeTime();
});

describe.each([
  { random: 0, turnipCount: 1 },
  { random: 1, turnipCount: 3 },
])('user forages with random $random value', async ({ random, turnipCount }) => {
  test(`user forages ${turnipCount} turnips`, async ({ userId, timestamp }) => {
    vi.spyOn(Math, 'random').mockReturnValue(random);

    const result = await TurnipQueries.forageTurnips(env.db, { userId });
    expect(result.isOk()).toBe(true);

    const turnips = result._unsafeUnwrap();
    expect(turnips).toHaveLength(turnipCount);

    const partialTurnip = {
      createdAt: timestamp,
      type: TurnipType.STANDARD,
      originId: null,
      originType: OriginType.FORAGED,
      ownerId: userId,
      ownerType: OwnerType.USER,
      ownedAt: timestamp,
    };

    const partialTransaction = {
      createdAt: timestamp,
      senderId: null,
      senderType: OwnerType.SYSTEM,
      receiverId: userId,
      receiverType: OwnerType.USER,
    };

    await verifyTurnips(turnips, partialTurnip, partialTransaction);
  });
});

describe.each([
  { timeElapsed: 0 },
  { timeElapsed: 1 },
  { timeElapsed: USER_FORAGE_COOLDOWN_MS - 1 },
])('user forages but encounters cooldown', async ({ timeElapsed }) => {
  test('user cannot forage again due to cooldown', async ({ userId }) => {
    const firstResult = await TurnipQueries.forageTurnips(env.db, { userId });
    expect(firstResult.isOk()).toBe(true);

    shiftTime(timeElapsed);

    const secondResult = await TurnipQueries.forageTurnips(env.db, { userId });
    expect(secondResult.isErr()).toBe(true);

    const error = secondResult._unsafeUnwrapErr();
    assert(error instanceof ForageOnCooldownError);
    expect(error.type).toBe(QueryError.ForageOnCooldown);
    expect(error.remainingCooldown).toBe(USER_FORAGE_COOLDOWN_MS - timeElapsed);
  });
});

test('user forages and can forage again after cooldown', async ({ userId }) => {
  vi.spyOn(Math, 'random').mockReturnValue(0);

  const firstResult = await TurnipQueries.forageTurnips(env.db, { userId });
  expect(firstResult.isOk()).toBe(true);

  shiftTime(USER_FORAGE_COOLDOWN_MS);

  const secondResult = await TurnipQueries.forageTurnips(env.db, { userId });
  expect(secondResult.isOk()).toBe(true);

  const allTurnips = await getMany<Turnip>(env.db, 'Turnip', {
    ownerId: userId,
    ownerType: OwnerType.USER,
  });
  expect(allTurnips).toHaveLength(2);
});
