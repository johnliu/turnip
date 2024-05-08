import { env } from 'cloudflare:test';
import { assert, test as base, beforeEach, describe, expect, vi } from 'vitest';

import GuildTurnipQueries from '@/models/queries/guild-turnip';

import { OwnerType, QueryError, TURNIP_HARVESTABLE_AFTER_MS } from '@/models/constants';
import {
  getGuildCounts,
  getTurnipCount,
  seedTurnips,
  verifyTurnips,
} from '../../../utils/queries/turnip-utils';
import { generateSnowflake } from '../../../utils/snowflake';
import { freezeTime, shiftTime } from '../../../utils/time';

interface Context {
  userId: string;
  guildId: string;
  timestamp: number;
}

const test = base<Context>;

beforeEach<Context>(async (context) => {
  context.userId = generateSnowflake();
  context.guildId = generateSnowflake();
  context.timestamp = freezeTime();
});

test('user plants turnip but has no turnip to plant', async ({ userId, guildId }) => {
  expect(await getTurnipCount(userId)).toBe(0);

  const result = await GuildTurnipQueries.plantTurnip(env.db, { userId, guildId });
  expect(result.isErr());
  expect(result._unsafeUnwrapErr().type).toBe(QueryError.NoTurnipsError);

  const { guildPlantedCount } = await getGuildCounts(userId, guildId);
  expect(guildPlantedCount).toBe(0);
});

describe.each([
  { random: 0, expectedHarvests: 8 },
  { random: 1, expectedHarvests: 12 },
])('user plants turnip with random $random value', ({ random, expectedHarvests }) => {
  test('user plants turnip', async ({ userId, guildId, timestamp }) => {
    vi.spyOn(Math, 'random').mockReturnValue(random);

    const [oldestTurnip] = await seedTurnips(userId);
    expect(await getTurnipCount(userId)).toBe(1);

    const nextTimestamp = shiftTime(10);

    const result = await GuildTurnipQueries.plantTurnip(env.db, { userId, guildId });
    assert(result.isOk());

    const { guildTurnip, turnip } = result.value;

    expect(guildTurnip).toMatchObject({
      guildId,
      turnipId: oldestTurnip.id,
      harvestableAt: nextTimestamp + TURNIP_HARVESTABLE_AFTER_MS,
      harvestsRemaining: expectedHarvests,
      planterId: userId,
      plantedAt: nextTimestamp,
    });

    verifyTurnips(
      turnip,
      {
        createdAt: timestamp,
        ownerId: guildId,
        ownerType: OwnerType.GUILD,
        ownedAt: nextTimestamp,
      },
      {
        createdAt: nextTimestamp,
        turnipId: oldestTurnip.id,
        senderId: userId,
        senderType: OwnerType.USER,
        receiverId: guildId,
        receiverType: OwnerType.GUILD,
      },
    );

    const guildCounts = await getGuildCounts(userId, guildId);
    expect(guildCounts).toMatchObject({
      guildPlantedCount: 1,
      userPlantedCount: 1,
      remainingHarvestsCount: 0,
    });
    expect(guildCounts.unripeTurnips).toHaveLength(1);
    expect(await getTurnipCount(userId)).toBe(0);

    shiftTime(TURNIP_HARVESTABLE_AFTER_MS);

    expect(await getGuildCounts(userId, guildId)).toMatchObject({
      guildPlantedCount: 1,
      userPlantedCount: 1,
      remainingHarvestsCount: expectedHarvests,
      unripeTurnips: [],
    });
    expect(guildCounts.unripeTurnips).toHaveLength(1);
  });
});

test('user plants oldest turnip', async ({ userId, guildId, timestamp }) => {
  vi.spyOn(Math, 'random').mockReturnValue(0);

  const [oldestTurnip] = await seedTurnips(userId);
  expect(await getTurnipCount(userId)).toBe(1);

  shiftTime(10);

  await seedTurnips(userId);
  expect(await getTurnipCount(userId)).toBe(2);

  const nextTimestamp = shiftTime(10);

  const result = await GuildTurnipQueries.plantTurnip(env.db, { userId, guildId });
  assert(result.isOk());

  const { guildTurnip, turnip } = result.value;

  expect(guildTurnip).toMatchObject({
    guildId,
    turnipId: oldestTurnip.id,
    harvestableAt: nextTimestamp + TURNIP_HARVESTABLE_AFTER_MS,
    planterId: userId,
    plantedAt: nextTimestamp,
  });

  verifyTurnips(
    turnip,
    {
      createdAt: timestamp,
      ownerId: guildId,
      ownerType: OwnerType.GUILD,
      ownedAt: nextTimestamp,
    },
    {
      createdAt: nextTimestamp,
      turnipId: oldestTurnip.id,
      senderId: userId,
      senderType: OwnerType.USER,
      receiverId: guildId,
      receiverType: OwnerType.GUILD,
    },
  );
  const guildCounts = await getGuildCounts(userId, guildId);
  expect(guildCounts).toMatchObject({
    guildPlantedCount: 1,
    userPlantedCount: 1,
    remainingHarvestsCount: 0,
  });
  expect(guildCounts.unripeTurnips).toHaveLength(1);
  expect(await getTurnipCount(userId)).toBe(1);

  shiftTime(TURNIP_HARVESTABLE_AFTER_MS);

  expect(await getGuildCounts(userId, guildId)).toMatchObject({
    guildPlantedCount: 1,
    userPlantedCount: 1,
    remainingHarvestsCount: 8,
    unripeTurnips: [],
  });
  expect(guildCounts.unripeTurnips).toHaveLength(1);
});
