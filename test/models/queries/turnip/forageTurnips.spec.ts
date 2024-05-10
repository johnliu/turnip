import { env } from 'cloudflare:test';
import { assert, test as base, beforeEach, describe, expect } from 'vitest';

import {
  ForageOnCooldownError,
  OriginType,
  OwnerType,
  TurnipType,
  USER_FORAGE_COOLDOWN_MS,
} from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';

import { expectErr, expectOk } from '../../../utils/queries';
import { assertTurnipCount, assertTurnipsMatch } from '../../../utils/queries/turnip-utils';
import { mockRandom } from '../../../utils/random';
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

  await assertTurnipCount(context.userId, 0);
});

describe.each([
  { random: 0, turnipCount: 1 },
  { random: 1, turnipCount: 3 },
])('user forages with random $random value', ({ random, turnipCount }) => {
  test(`user forages ${turnipCount} turnips`, async ({ userId, timestamp }) => {
    mockRandom(random);

    const turnips = await expectOk(TurnipQueries.forageTurnips(env.db, { userId }));
    expect(turnips).toHaveLength(turnipCount);

    await assertTurnipsMatch(
      turnips,
      {
        createdAt: timestamp,
        type: TurnipType.STANDARD,
        originId: null,
        originType: OriginType.FORAGED,
        ownerId: userId,
        ownerType: OwnerType.USER,
        ownedAt: timestamp,
      },
      {
        createdAt: timestamp,
        senderId: null,
        senderType: OwnerType.SYSTEM,
        receiverId: userId,
        receiverType: OwnerType.USER,
      },
    );
    await assertTurnipCount(userId, turnipCount);
  });
});

describe.each([
  { timeElapsed: 0 },
  { timeElapsed: 1 },
  { timeElapsed: USER_FORAGE_COOLDOWN_MS - 1 },
])('user forages but encounters cooldown', ({ timeElapsed }) => {
  test('user cannot forage again due to cooldown', async ({ userId }) => {
    mockRandom(0);

    await expectOk(TurnipQueries.forageTurnips(env.db, { userId }));
    await assertTurnipCount(userId, 1);

    shiftTime(timeElapsed);

    const error = await expectErr(TurnipQueries.forageTurnips(env.db, { userId }));
    assert(error instanceof ForageOnCooldownError);
    expect(error.remainingCooldown).toBe(USER_FORAGE_COOLDOWN_MS - timeElapsed);
    await assertTurnipCount(userId, 1);
  });
});

test('user forages and can forage again after cooldown', async ({ userId }) => {
  mockRandom(0);

  await expectOk(TurnipQueries.forageTurnips(env.db, { userId }));
  await assertTurnipCount(userId, 1);

  shiftTime(USER_FORAGE_COOLDOWN_MS);

  await expectOk(TurnipQueries.forageTurnips(env.db, { userId }));
  await assertTurnipCount(userId, 2);
});
