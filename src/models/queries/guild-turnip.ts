import dedent from 'dedent';
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
  USER_HARVEST_COOLDOWN_MS,
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
        dedent`
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
        dedent`
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

export type SurveyCount = {
  guildPlantedCount: number;
  userPlantedCount: number;
  remainingHarvestsCount: number;
  unripeTurnips: GuildTurnip[];
};

export async function getSurveyGuild(
  db: D1Database,
  params: {
    guildId: string;
    userId: string;
  },
): Promise<Result<SurveyCount, MissingResultError>> {
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
): Statement<GuildTurnip[]> {
  return makeManyStatement<GuildTurnip>(
    db
      .prepare(
        dedent`
          SELECT * FROM GuildTurnip
          WHERE guildId = ?
            AND harvestableAt <= ?
            AND harvestsRemaining > ?
          ORDER BY harvestableAt ASC
          LIMIT 5
        `,
      )
      .bind(params.guildId, params.timestamp, 0),
  );
}

export function prepareHarvestTurnips(
  db: D1Database,
  params: {
    guildTurnip: GuildTurnip;
    userId: string;
    harvests: number;
    ts: number;
  },
): Statements<[GuildTurnip, Turnip[], TurnipTransaction[]]> {
  return [
    makeOneStatement<GuildTurnip>(
      db
        .prepare(
          dedent`
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
          params.harvests,
          params.guildTurnip.guildId,
          params.guildTurnip.turnipId,
          params.guildTurnip.harvestsRemaining,
        ),
    ),
    ...prepareCreateTurnips(db, {
      count: params.harvests,
      createdAt: params.ts,
      originId: params.guildTurnip.guildId,
      originType: OriginType.HARVEST,
      parentId: params.guildTurnip.turnipId,
      ownerId: params.userId,
      ownerType: OwnerType.USER,
    }),
  ];
}

export async function harvestTurnips(
  db: D1Database,
  params: {
    userId: string;
    guildId: string;
  },
): Promise<
  Result<
    { guildTurnips: GuildTurnip[]; harvestedTurnips: Turnip[] },
    StandardError<QueryError.NoTurnipsError> | HarvestOnCooldownError | MissingResultError
  >
> {
  const now = new Date().getTime();

  const [harvestableTurnips, lastHarvestedTimestamp] = await batch<[GuildTurnip[], number]>(db, [
    prepareGetHarvestableTurnip(db, { timestamp: now, guildId: params.guildId }),
    prepareGetLastHarvest(db, { timestamp: now, userId: params.userId, guildId: params.guildId }),
  ]);

  if (harvestableTurnips == null || harvestableTurnips.length === 0) {
    return err(new StandardError(QueryError.NoTurnipsError));
  }

  if (lastHarvestedTimestamp != null) {
    return err(new HarvestOnCooldownError(lastHarvestedTimestamp + USER_HARVEST_COOLDOWN_MS - now));
  }

  let harvests = Math.min(
    randomRange(...USER_HARVEST_AMOUNT_RANGE),
    harvestableTurnips.reduce((total, guildTurnip) => total + guildTurnip.harvestsRemaining, 0),
  );

  const guildTurnips: GuildTurnip[] = [];
  const harvestedTurnips: Turnip[] = [];
  for (const harvestableTurnip of harvestableTurnips) {
    if (harvests === 0) {
      break;
    }

    const currentHarvest = Math.min(harvests, harvestableTurnip.harvestsRemaining);
    const [guildTurnip, turnips, _] = await batch<[GuildTurnip, Turnip[], TurnipTransaction[]]>(
      db,
      prepareHarvestTurnips(db, {
        guildTurnip: harvestableTurnip,
        userId: params.userId,
        harvests: currentHarvest,
        ts: now,
      }),
    );

    if (guildTurnip != null && turnips != null) {
      harvests -= harvestableTurnip.harvestsRemaining - guildTurnip.harvestsRemaining;
      guildTurnips.push(guildTurnip);
      harvestedTurnips.push(...turnips);
    }
  }

  return ok({
    guildTurnips,
    harvestedTurnips,
  });
}

export default {
  getSurveyGuild,
  plantTurnip,
  harvestTurnips,
};
