import { env } from 'cloudflare:test';
import { test as base, beforeEach, describe, expect } from 'vitest';

import { OwnerType, QueryError, TURNIP_HARVESTABLE_AFTER_MS } from '@/models/constants';
import GuildTurnipQueries from '@/models/queries/guild-turnip';

import { expectErr, expectOk } from '../../../utils/queries';
import {
  assertGuildTurnipCount,
  assertTurnipCount,
  assertTurnipsMatch,
  seedTurnips,
} from '../../../utils/queries/turnip-utils';
import { mockRandom } from '../../../utils/random';
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

  await assertTurnipCount(context.userId, 0);
});

// user harvests turnip
// - user harvests turnip based on random
// - harvested turnips look correct
// - harvested turnips have transactions
// - harvested turnip decrements harvest count correctly

// user harvests turnip but guild has no harvestable turnips

// user harvests turnip but guild has no harvestable turnips but turnips become harvestable

// user harvests turnip twice but second time is on cooldown

// user harvests turnip twice but second time is on cooldown and then cooldown ends

test('user harvests turnip but no more harvests', () => {});

test('user plants turnip but has no turnip to plant', async ({ userId, guildId }) => {
  const error = await expectErr(GuildTurnipQueries.plantTurnip(env.db, { userId, guildId }));
  expect(error.type).toBe(QueryError.NoTurnipsError);

  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 0,
  });
});

describe.each([
  { random: 0, expectedHarvests: 8 },
  { random: 1, expectedHarvests: 12 },
])('user plants turnip with random $random value', ({ random, expectedHarvests }) => {
  test('user plants turnip', async ({ userId, guildId, timestamp }) => {
    mockRandom(random);

    const [oldestTurnip] = await seedTurnips(userId);
    await assertTurnipCount(userId, 1);

    const nextTimestamp = shiftTime(10);

    const { guildTurnip, turnip } = await expectOk(
      GuildTurnipQueries.plantTurnip(env.db, { userId, guildId }),
    );
    expect(guildTurnip).toMatchObject({
      guildId,
      turnipId: oldestTurnip.id,
      harvestableAt: nextTimestamp + TURNIP_HARVESTABLE_AFTER_MS,
      harvestsRemaining: expectedHarvests,
      planterId: userId,
      plantedAt: nextTimestamp,
    });
    assertTurnipsMatch(
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

    await assertTurnipCount(userId, 0);
    await assertGuildTurnipCount(userId, guildId, {
      guildPlantedCount: 1,
      userPlantedCount: 1,
      remainingHarvestsCount: 0,
      unripeTurnips: [guildTurnip],
    });

    shiftTime(TURNIP_HARVESTABLE_AFTER_MS);

    await assertGuildTurnipCount(userId, guildId, {
      guildPlantedCount: 1,
      userPlantedCount: 1,
      remainingHarvestsCount: expectedHarvests,
      unripeTurnips: [],
    });
  });
});

test('user plants oldest turnip', async ({ userId, guildId, timestamp }) => {
  mockRandom(0);

  const [oldestTurnip] = await seedTurnips(userId);
  await assertTurnipCount(userId, 1);

  shiftTime(10);

  await seedTurnips(userId);
  await assertTurnipCount(userId, 2);

  const nextTimestamp = shiftTime(10);

  const { guildTurnip, turnip } = await expectOk(
    GuildTurnipQueries.plantTurnip(env.db, { userId, guildId }),
  );
  expect(guildTurnip).toMatchObject({
    guildId,
    turnipId: oldestTurnip.id,
    harvestableAt: nextTimestamp + TURNIP_HARVESTABLE_AFTER_MS,
    planterId: userId,
    plantedAt: nextTimestamp,
  });
  assertTurnipsMatch(
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

  await assertTurnipCount(userId, 1);
  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 1,
    userPlantedCount: 1,
    remainingHarvestsCount: 0,
    unripeTurnips: [guildTurnip],
  });

  shiftTime(TURNIP_HARVESTABLE_AFTER_MS);

  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 1,
    userPlantedCount: 1,
    remainingHarvestsCount: 8,
    unripeTurnips: [],
  });
});
