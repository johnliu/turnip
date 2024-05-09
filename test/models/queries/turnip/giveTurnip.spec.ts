import { env } from 'cloudflare:test';
import { test as base, beforeEach, expect } from 'vitest';

import { OwnerType, QueryError } from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';

import { expectErr, expectOk } from '../../../utils/queries';
import {
  assertTurnipCount,
  assertTurnipsMatch,
  seedTurnips,
} from '../../../utils/queries/turnip-utils';
import { generateSnowflake } from '../../../utils/snowflake';
import { freezeTime, shiftTime } from '../../../utils/time';

interface Context {
  userA: string;
  userB: string;
  timestamp: number;
}

const test = base<Context>;

beforeEach<Context>(async (context) => {
  context.userA = generateSnowflake();
  context.userB = generateSnowflake();
  context.timestamp = freezeTime();

  await assertTurnipCount(context.userA, 0);
  await assertTurnipCount(context.userB, 0);
});

test('userA gives userB a turnip but has no turnips', async ({ userA, userB }) => {
  const error = await expectErr(
    TurnipQueries.giveTurnip(env.db, { senderId: userA, receiverId: userB }),
  );
  expect(error.type).toBe(QueryError.NoTurnipsError);
});

test('userA gives userB a turnip', async ({ userA, userB, timestamp }) => {
  const [turnip] = await seedTurnips(userA);
  await assertTurnipCount(userA, 1);
  await assertTurnipCount(userB, 0);

  const nextTimestamp = shiftTime(10);

  const receivedTurnip = await expectOk(
    TurnipQueries.giveTurnip(env.db, { senderId: userA, receiverId: userB }),
  );

  await assertTurnipsMatch(
    receivedTurnip,
    {
      id: turnip.id,
      createdAt: timestamp,
      ownerId: userB,
      ownerType: OwnerType.USER,
      ownedAt: nextTimestamp,
    },
    {
      createdAt: nextTimestamp,
      turnipId: turnip.id,
      senderId: userA,
      senderType: OwnerType.USER,
      receiverId: userB,
      receiverType: OwnerType.USER,
    },
  );
  await assertTurnipCount(userA, 0);
  await assertTurnipCount(userB, 1);
});

test('userA gives userB a oldest turnip', async ({ userA, userB, timestamp }) => {
  const [oldestTurnip] = await seedTurnips(userA);
  await assertTurnipCount(userA, 1);
  await assertTurnipCount(userB, 0);

  shiftTime(10);

  await seedTurnips(userA);
  await assertTurnipCount(userA, 2);
  await assertTurnipCount(userB, 0);

  const nextTimestamp = shiftTime(10);

  const receivedTurnip = await expectOk(
    TurnipQueries.giveTurnip(env.db, { senderId: userA, receiverId: userB }),
  );

  await assertTurnipsMatch(
    receivedTurnip,
    {
      id: oldestTurnip.id,
      createdAt: timestamp,
      ownerId: userB,
      ownerType: OwnerType.USER,
      ownedAt: nextTimestamp,
    },
    {
      createdAt: nextTimestamp,
      turnipId: oldestTurnip.id,
      senderId: userA,
      senderType: OwnerType.USER,
      receiverId: userB,
      receiverType: OwnerType.USER,
    },
  );

  await assertTurnipCount(userA, 1);
  await assertTurnipCount(userB, 1);
});
