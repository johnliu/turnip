import { env } from 'cloudflare:test';
import { assert, expect } from 'vitest';

import { OriginType, OwnerType, TURNIP_HARVESTABLE_AFTER_MS } from '@/models/constants';
import type { GuildTurnip } from '@/models/guild-turnip';
import { getSurveyGuild, prepareCreateGuildTurnip } from '@/models/queries/guild-turnip';
import { getTurnipInventory, prepareCreateTurnips } from '@/models/queries/turnip';
import type { Turnip } from '@/models/turnip';
import type { TurnipTransaction } from '@/models/turnip-transactions';
import { first } from '@/utils/arrays';
import { batch, getOne } from '@/utils/d1';

export async function assertTurnipsMatch(
  t: Turnip | Turnip[],
  expectedTurnip: Partial<Turnip>,
  expectedTransaction: Partial<TurnipTransaction>,
) {
  const turnips = Array.isArray(t) ? t : [t];

  for (const turnip of turnips) {
    expect(turnip).toMatchObject(expectedTurnip);

    const transaction = await getOne<TurnipTransaction>(env.db, 'TurnipTransaction', {
      turnipId: turnip.id,
      createdAt: turnip.ownedAt,
      receiverId: turnip.ownerId,
      receiverType: turnip.ownerType,
    });
    assert(transaction != null);
    expect(transaction).toMatchObject(expectedTransaction);
  }
}

export async function seedTurnips(userId: string, count = 1): Promise<Turnip[]> {
  const now = new Date().getTime();
  const [turnips, _transactions] = await batch(
    env.db,
    prepareCreateTurnips(env.db, {
      count,
      createdAt: now,
      originId: null,
      originType: OriginType.FORAGED,
      parentId: null,
      ownerId: userId,
      ownerType: OwnerType.USER,
    }),
  );

  assert(turnips != null);
  return turnips;
}

export async function seedGuildTurnip({
  guildId,
  harvestableAt,
  harvestsRemaining,
  userId,
}: {
  guildId: string;
  harvestableAt: number;
  harvestsRemaining: number;
  userId: string;
}) {
  const now = new Date().getTime();

  const [turnips, _transactions] = await batch(
    env.db,
    prepareCreateTurnips(env.db, {
      count: 1,
      createdAt: now,
      originId: null,
      originType: OriginType.FORAGED,
      parentId: null,
      ownerId: guildId,
      ownerType: OwnerType.GUILD,
    }),
  );
  const turnip = first(turnips);
  assert(turnip != null);

  const [guildTurnip] = await batch(env.db, [
    prepareCreateGuildTurnip(env.db, {
      guildId,
      turnipId: turnip.id,
      harvestableAt,
      harvestsRemaining,
      planterId: userId,
      plantedAt: harvestableAt - TURNIP_HARVESTABLE_AFTER_MS,
    }),
  ]);
  assert(guildTurnip != null);

  return {
    turnip,
    guildTurnip,
  };
}

export async function assertTurnipCount(userId: string, count: number) {
  const turnipCounts = await getTurnipInventory(env.db, { userId });
  const total = turnipCounts.reduce((total, count) => total + count.count, 0);
  assert(total === count, `Expected turnip count to be: ${count}, got ${total}`);
}

export async function assertGuildTurnipCount(
  userId: string,
  guildId: string,
  count: {
    guildPlantedCount?: number;
    userPlantedCount?: number;
    remainingHarvestsCount?: number;
    unripeTurnips?: GuildTurnip[];
  },
) {
  const result = await getSurveyGuild(env.db, { userId, guildId });

  assert(result.isOk());
  expect(result.value).toMatchObject(count);
}
