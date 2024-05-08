import { env } from 'cloudflare:test';
import { assert, test as base, beforeEach, expect } from 'vitest';

import { OwnerType, QueryError } from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';

import { getTurnipCount, seedTurnips, verifyTurnips } from '../../../utils/queries/turnip-utils';
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
});

test('userA gives userB a turnip but has no turnips', async ({ userA, userB }) => {
  expect(await getTurnipCount(userA)).toBe(0);

  const result = await TurnipQueries.giveTurnip(env.db, { senderId: userA, receiverId: userB });
  expect(result.isErr()).toBe(true);

  const error = result._unsafeUnwrapErr();
  expect(error.type).toBe(QueryError.NoTurnipsError);
});

test('userA gives userB a turnip', async ({ userA, userB, timestamp }) => {
  const [turnip] = await seedTurnips(userA);
  assert(turnip != null);
  expect(await getTurnipCount(userA)).toBe(1);
  expect(await getTurnipCount(userB)).toBe(0);

  const nextTimestamp = shiftTime(10);

  const result = await TurnipQueries.giveTurnip(env.db, { senderId: userA, receiverId: userB });
  expect(result.isOk()).toBe(true);

  const receivedTurnip = result._unsafeUnwrap();
  assert(receivedTurnip != null);

  await verifyTurnips(
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

  expect(await getTurnipCount(userA)).toBe(0);
  expect(await getTurnipCount(userB)).toBe(1);
});

test('userA gives userB a oldest turnip', async ({ userA, userB, timestamp }) => {
  const [oldestTurnip] = await seedTurnips(userA);
  assert(oldestTurnip != null);
  expect(await getTurnipCount(userA)).toBe(1);
  expect(await getTurnipCount(userB)).toBe(0);

  shiftTime(10);

  const [newerTurnip] = await seedTurnips(userA);
  assert(newerTurnip != null);
  expect(await getTurnipCount(userA)).toBe(2);
  expect(await getTurnipCount(userB)).toBe(0);

  const nextTimestamp = shiftTime(10);

  const result = await TurnipQueries.giveTurnip(env.db, { senderId: userA, receiverId: userB });
  expect(result.isOk()).toBe(true);

  const receivedTurnip = result._unsafeUnwrap();
  assert(receivedTurnip != null);

  await verifyTurnips(
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

  expect(await getTurnipCount(userA)).toBe(1);
  expect(await getTurnipCount(userB)).toBe(1);
});
