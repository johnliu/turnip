import { type Result, err, ok } from 'neverthrow';

import {
  HarvestOnCooldownError,
  MissingResultError,
  OriginType,
  OwnerType,
  QueryError,
  TURNIP_HARVESTABLE_AFTER_MS,
  TURNIP_HARVESTABLE_AMOUNT_RANGE,
  TurnipType,
  USER_HARVEST_AMOUNT_RANGE,
} from '@/models/constants';
import type { GuildTurnip } from '@/models/guild-turnip';
import {
  getOldestTurnipForUser,
  prepareCreateTurnips,
  prepareMoveTurnip,
} from '@/models/queries/turnip';
import {
  prepareGetGuildPlantedCount,
  prepareGetLastHarvest,
  prepareGetUserPlantedCount,
} from '@/models/queries/turnip-transaction';
import type { Turnip } from '@/models/turnip';
import type { TurnipTransaction } from '@/models/turnip-transactions';
import {
  type Statement,
  type Statements,
  batch,
  makeInsertOneStatement,
  makeManyStatement,
  makeOneStatement,
} from '@/utils/d1';
import { StandardError } from '@/utils/errors';
import { randomRange } from '@/utils/random';

export function prepareCreateGuildTurnip(
  db: D1Database,
  params: GuildTurnip,
): Statement<GuildTurnip> {
  return makeInsertOneStatement<GuildTurnip>(db, 'GuildTurnip', params);
}

export function preparePlantTurnip(
  db: D1Database,
  params: {
    timestamp: number;
    turnipId: string;
    userId: string;
    guildId: string;
  },
): Statements<[Turnip, TurnipTransaction, GuildTurnip]> {
  return [
    ...prepareMoveTurnip(db, {
      timestamp: params.timestamp,
      turnipId: params.turnipId,
      receiverId: params.guildId,
      receiverType: OwnerType.GUILD,
      senderId: params.userId,
      senderType: OwnerType.USER,
    }),
    prepareCreateGuildTurnip(db, {
      guildId: params.guildId,
      turnipId: params.turnipId,
      harvestableAt: params.timestamp + TURNIP_HARVESTABLE_AFTER_MS,
      harvestsRemaining: randomRange(...TURNIP_HARVESTABLE_AMOUNT_RANGE),
      planterId: params.userId,
      plantedAt: params.timestamp,
    }),
  ];
}

export function prepareGetRemainingHarvestsCount(
  db: D1Database,
  params: {
    timestamp: number;
    guildId: string;
  },
): Statement<{ remainingHarvestsCount: number }> {
  return makeOneStatement<{ remainingHarvestsCount: number }>(
    db
      .prepare(
        `
        SELECT COALESCE(SUM(harvestsRemaining), 0) as remainingHarvestsCount FROM GuildTurnip
        WHERE guildId = ?
          AND harvestableAt <= ?
          AND harvestsRemaining > ?
        `,
      )
      .bind(params.guildId, params.timestamp, 0),
  );
}

export function prepareGetUnripeTurnips(
  db: D1Database,
  params: {
    timestamp: number;
    guildId: string;
  },
): Statement<GuildTurnip[]> {
  return makeManyStatement<GuildTurnip>(
    db
      .prepare(
        `
        SELECT * FROM GuildTurnip
        WHERE guildId = ?
          AND harvestableAt > ?
          AND harvestsRemaining > ?
        ORDER BY harvestableAt ASC
        `,
      )
      .bind(params.guildId, params.timestamp, 0),
  );
}

export async function getSurveyGuild(
  db: D1Database,
  params: {
    guildId: string;
    userId: string;
  },
): Promise<
  Result<
    {
      guildPlantedCount: number;
      userPlantedCount: number;
      remainingHarvestsCount: number;
      unripeTurnips: GuildTurnip[];
    },
    MissingResultError
  >
> {
  const now = new Date().getTime();
  const [guildPlantedCount, userPlantedCount, remainingHarvestsCount, unripeTurnips] = await batch<
    [
      { guildPlantedCount: number },
      { userPlantedCount: number },
      { remainingHarvestsCount: number },
      GuildTurnip[],
    ]
  >(db, [
    prepareGetGuildPlantedCount(db, { guildId: params.guildId }),
    prepareGetUserPlantedCount(db, { guildId: params.guildId, userId: params.userId }),
    prepareGetRemainingHarvestsCount(db, { guildId: params.guildId, timestamp: now }),
    prepareGetUnripeTurnips(db, { guildId: params.guildId, timestamp: now }),
  ]);

  if (
    guildPlantedCount == null ||
    userPlantedCount == null ||
    remainingHarvestsCount == null ||
    unripeTurnips == null
  ) {
    return err(new MissingResultError('getSurveyGuild'));
  }

  return ok({
    ...guildPlantedCount,
    ...userPlantedCount,
    ...remainingHarvestsCount,
    unripeTurnips,
  });
}

export async function plantTurnip(
  db: D1Database,
  {
    turnipType = TurnipType.STANDARD,
    ...params
  }: {
    userId: string;
    guildId: string;
    turnipType?: TurnipType;
  },
): Promise<
  Result<
    { turnip: Turnip; guildTurnip: GuildTurnip },
    StandardError<QueryError.NoTurnipsError> | MissingResultError
  >
> {
  const now = new Date().getTime();

  const oldTurnip = await getOldestTurnipForUser(db, { userId: params.userId, turnipType });
  if (oldTurnip == null) {
    return err(new StandardError(QueryError.NoTurnipsError));
  }

  const [turnip, _, guildTurnip] = await batch(
    db,
    preparePlantTurnip(db, {
      timestamp: now,
      turnipId: oldTurnip.id,
      userId: params.userId,
      guildId: params.guildId,
    }),
  );

  if (turnip == null || guildTurnip == null) {
    return err(new MissingResultError('plantTurnip'));
  }

  return ok({
    turnip,
    guildTurnip,
  });
}

function prepareGetHarvestableTurnip(
  db: D1Database,
  params: { timestamp: number; guildId: string },
): Statement<GuildTurnip> {
  return makeOneStatement<GuildTurnip>(
    db
      .prepare(
        `
        SELECT * FROM GuildTurnip
        WHERE guildId = ?
          AND harvestableAt < ?
          AND harvestsRemaining > ?
        ORDER BY harvestableAt ASC
        LIMIT 1
        `,
      )
      .bind(params.guildId, params.timestamp, 0),
  );
}

export async function harvestTurnips(
  db: D1Database,
  params: {
    userId: string;
    guildId: string;
  },
): Promise<
  Result<
    { guildTurnip: GuildTurnip; harvestedTurnips: Turnip[] },
    StandardError<QueryError.NoTurnipsError> | HarvestOnCooldownError | MissingResultError
  >
> {
  const now = new Date().getTime();

  const [harvestableTurnip, lastHarvestedTimestamp] = await batch<[GuildTurnip, number]>(db, [
    prepareGetHarvestableTurnip(db, { timestamp: now, guildId: params.guildId }),
    prepareGetLastHarvest(db, { timestamp: now, userId: params.userId, guildId: params.guildId }),
  ]);

  if (harvestableTurnip == null) {
    return err(new StandardError(QueryError.NoTurnipsError));
  }

  if (lastHarvestedTimestamp != null) {
    return err(
      new HarvestOnCooldownError(lastHarvestedTimestamp + TURNIP_HARVESTABLE_AFTER_MS - now),
    );
  }

  const harvests = Math.max(
    randomRange(...USER_HARVEST_AMOUNT_RANGE),
    harvestableTurnip.harvestsRemaining,
  );

  const [guildTurnip, harvestedTurnips, _] = await batch<
    [GuildTurnip, Turnip[], TurnipTransaction[]]
  >(db, [
    makeOneStatement<GuildTurnip>(
      db
        .prepare(
          `
          UPDATE GuildTurnip
          SET harvestsRemaining = harvestsRemaining - ?
          WHERE guildId = ?
            AND turnipId = ?
            AND harvestsRemaining = ?
          RETURNING *
          LIMIT 1
          `,
        )
        .bind(
          harvests,
          params.guildId,
          harvestableTurnip.turnipId,
          harvestableTurnip.harvestsRemaining,
        ),
    ),
    ...prepareCreateTurnips(db, {
      count: harvests,
      createdAt: now,
      originId: params.guildId,
      originType: OriginType.HARVEST,
      parentId: harvestableTurnip.turnipId,
      ownerId: params.userId,
      ownerType: OwnerType.USER,
    }),
  ]);

  if (guildTurnip == null || harvestedTurnips == null) {
    return err(new MissingResultError('harvestTurnips'));
  }

  return ok({
    guildTurnip,
    harvestedTurnips,
  });
}

export default {
  getSurveyGuild,
  plantTurnip,
  harvestTurnips,
};
