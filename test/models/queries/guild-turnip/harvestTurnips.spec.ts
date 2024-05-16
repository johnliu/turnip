import { env } from 'cloudflare:test';
import { assert, test as base, beforeEach, describe, expect } from 'vitest';

import {
  HarvestOnCooldownError,
  OriginType,
  OwnerType,
  QueryError,
  USER_HARVEST_COOLDOWN_MS,
} from '@/models/constants';
import GuildTurnipQueries from '@/models/queries/guild-turnip';

import { expectErr, expectOk } from '@test/utils/queries';
import {
  assertGuildTurnipCount,
  assertTurnipCount,
  assertTurnipsMatch,
  seedGuildTurnip,
} from '@test/utils/queries/turnip-utils';
import { mockRandom } from '@test/utils/random';
import { generateSnowflake } from '@test/utils/snowflake';
import { freezeTime, shiftTime } from '@test/utils/time';

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

describe.each([
  { random: 0, harvestsRemaining: 1, expectedHarvests: 1 },
  { random: 1, harvestsRemaining: 1, expectedHarvests: 1 },
  { random: 0, harvestsRemaining: 12, expectedHarvests: 2 },
  { random: 1, harvestsRemaining: 12, expectedHarvests: 5 },
])(
  'user harvests turnip with different randoms',
  ({ random, harvestsRemaining, expectedHarvests }) => {
    test('user harvests $expectedHarvests turnips', async ({ userId, guildId, timestamp }) => {
      mockRandom(random);

      const { guildTurnip } = await seedGuildTurnip({
        guildId,
        userId,
        harvestableAt: timestamp,
        harvestsRemaining: harvestsRemaining,
      });
      await assertGuildTurnipCount(userId, guildId, {
        guildPlantedCount: 1,
        remainingHarvestsCount: harvestsRemaining,
        unripeTurnips: [],
      });

      const { harvestedTurnips } = await expectOk(
        GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }),
      );
      await assertTurnipCount(userId, expectedHarvests);
      assertTurnipsMatch(
        harvestedTurnips,
        {
          createdAt: timestamp,
          originId: guildId,
          originType: OriginType.HARVEST,
          parentId: guildId,
          ownerId: userId,
          ownerType: OwnerType.USER,
          ownedAt: timestamp,
        },
        {
          createdAt: timestamp,
          senderId: guildId,
          senderType: OwnerType.GUILD,
          receiverId: userId,
          receiverType: OwnerType.GUILD,
        },
      );
    });
  },
);

test('user harvests turnips, rolls over', async ({ userId, guildId, timestamp }) => {
  mockRandom(1);

  const harvestableTurnips = [];
  for (let i = 0; i < 6; i++) {
    const { guildTurnip } = await seedGuildTurnip({
      guildId,
      userId,
      harvestableAt: timestamp,
      harvestsRemaining: 1,
    });

    harvestableTurnips.push(guildTurnip);
  }

  expect(harvestableTurnips).toHaveLength(6);
  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 6,
    remainingHarvestsCount: 6,
    unripeTurnips: [],
  });

  const { guildTurnips, harvestedTurnips } = await expectOk(
    GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }),
  );
  expect(guildTurnips).toHaveLength(5);
  expect(harvestedTurnips).toHaveLength(5);
  await assertTurnipCount(userId, 5);
  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 6,
    remainingHarvestsCount: 1,
    unripeTurnips: [],
  });
});

test('user harvests oldest turnip', async ({ userId, guildId, timestamp }) => {
  mockRandom(0);

  const { guildTurnip: oldestGuildTurnip } = await seedGuildTurnip({
    guildId,
    userId,
    harvestableAt: timestamp,
    harvestsRemaining: 2,
  });

  const nextTimestamp = shiftTime(10);

  await seedGuildTurnip({
    guildId,
    userId,
    harvestableAt: nextTimestamp,
    harvestsRemaining: 1,
  });

  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 2,
    remainingHarvestsCount: 3,
    unripeTurnips: [],
  });

  const { guildTurnips } = await expectOk(
    GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }),
  );
  await assertTurnipCount(userId, 2);
  expect(guildTurnips).toHaveLength(1);
  expect(guildTurnips[0].turnipId).toBe(oldestGuildTurnip.turnipId);
});

test('user harvests turnip but no more harvests', async ({ userId, guildId, timestamp }) => {
  await seedGuildTurnip({ guildId, userId, harvestableAt: timestamp, harvestsRemaining: 0 });
  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 1,
    remainingHarvestsCount: 0,
    unripeTurnips: [],
  });

  const error = await expectErr(GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }));
  expect(error.type).toBe(QueryError.NoTurnipsError);
});

test('user harvests turnip but unripe', async ({ userId, guildId, timestamp }) => {
  mockRandom(0);

  const { guildTurnip } = await seedGuildTurnip({
    guildId,
    userId,
    harvestableAt: timestamp + 1,
    harvestsRemaining: 1,
  });
  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 1,
    remainingHarvestsCount: 0,
    unripeTurnips: [guildTurnip],
  });

  const error = await expectErr(GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }));
  expect(error.type).toBe(QueryError.NoTurnipsError);

  // becomes ripe
  shiftTime(1);

  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 1,
    remainingHarvestsCount: 1,
    unripeTurnips: [],
  });
  await expectOk(GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }));
  await assertTurnipCount(userId, 1);
});

describe.each([
  { timeElapsed: 0 },
  { timeElapsed: 1 },
  { timeElapsed: USER_HARVEST_COOLDOWN_MS - 1 },
])('user harvests turnip but encounters cooldown', ({ timeElapsed }) => {
  test('user cannot harvest again due to cooldown', async ({ userId, guildId, timestamp }) => {
    mockRandom(0);

    await seedGuildTurnip({
      guildId,
      userId,
      harvestableAt: timestamp,
      harvestsRemaining: 3,
    });
    await assertGuildTurnipCount(userId, guildId, {
      guildPlantedCount: 1,
      remainingHarvestsCount: 3,
      unripeTurnips: [],
    });

    await expectOk(GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }));
    await assertTurnipCount(userId, 2);
    await assertGuildTurnipCount(userId, guildId, { remainingHarvestsCount: 1 });

    shiftTime(timeElapsed);

    const error = await expectErr(GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }));
    assert(error instanceof HarvestOnCooldownError);
    expect(error.remainingCooldown).toBe(USER_HARVEST_COOLDOWN_MS - timeElapsed);
    await assertTurnipCount(userId, 2);
    await assertGuildTurnipCount(userId, guildId, { remainingHarvestsCount: 1 });
  });
});

test('user harvests turnip and can harvest again after cooldown', async ({
  userId,
  guildId,
  timestamp,
}) => {
  mockRandom(0);

  await seedGuildTurnip({
    guildId,
    userId,
    harvestableAt: timestamp,
    harvestsRemaining: 3,
  });
  await assertGuildTurnipCount(userId, guildId, {
    guildPlantedCount: 1,
    remainingHarvestsCount: 3,
    unripeTurnips: [],
  });

  await expectOk(GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }));
  await assertTurnipCount(userId, 2);
  await assertGuildTurnipCount(userId, guildId, { remainingHarvestsCount: 1 });

  shiftTime(USER_HARVEST_COOLDOWN_MS);

  await expectOk(GuildTurnipQueries.harvestTurnips(env.db, { userId, guildId }));
  await assertTurnipCount(userId, 3);
  await assertGuildTurnipCount(userId, guildId, { remainingHarvestsCount: 0 });
});
