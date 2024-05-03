import uuid from 'uuid';

import { first } from '@/utils/arrays';
import { type Statement, type Statements, transaction } from '@/utils/d1';
import { randomRange } from '@/utils/random';

const HARVEST_TIME_MS = 2 * 60 * 60 * 1000; // 2 hours
const HARVEST_RANGE: [number, number] = [8, 12];

enum TurnipType {
  STANDARD = 0,
}

enum OriginType {
  FORAGED = 0,
  HARVEST = 1,
}

enum OwnerType {
  USER = 0,
  GUILD = 1,
}

export type Turnip = {
  id: string;
  createdAt: Date;
  type: TurnipType;
  originType: OriginType;
  originId: string | null;
  parentId: string;
  ownerType: OwnerType;
  ownerId: string;
  ownedAt: Date;
};

type TurnipTransaction = {
  id: string;
  createdAt: Date;
  turnipId: string;
  senderId: string;
  senderType: OwnerType;
  receiverId: string;
  receiverType: OwnerType;
};

export type GuildTurnip = {
  guildId: string;
  turnipId: string;
  harvestableAt: Date;
  harvestsRemaining: number;
  planterId: string;
  plantedAt: Date;
};

type PrepareTransactionParams = TurnipTransaction;
type PrepareTransactionResponse = Statement<TurnipTransaction>;

function prepareTransaction(
  db: D1Database,
  params: PrepareTransactionParams,
): PrepareTransactionResponse {
  return {
    statement: db
      .prepare(
        `
        INSERT INTO TurnipTransaction (
          id,
          createdAt,
          turnipId,
          senderId,
          senderType,
          receiverId,
          receiverType
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?
        )
        RETURNING *
        `,
      )
      .bind(
        params.id,
        params.createdAt,
        params.senderId,
        params.senderType,
        params.receiverId,
        params.receiverType,
      ),
    transformer: (response) => {
      return first(response.results as TurnipTransaction[]);
    },
  };
}

type PrepareMoveTurnipParams = {
  timestamp?: Date;
} & Pick<TurnipTransaction, 'turnipId' | 'receiverId' | 'receiverType' | 'senderId' | 'senderType'>;
type PrepareMoveTurnipResponse = Statements<[Turnip, TurnipTransaction]>;

function prepareMoveTurnip(
  db: D1Database,
  params: PrepareMoveTurnipParams,
): PrepareMoveTurnipResponse {
  const now = params.timestamp ?? new Date();

  return [
    {
      statement: db
        .prepare(
          `
        UPDATE Turnip
        SET ownerId = ?,
            ownerType = ?,
            ownedAt = ?,
        WHERE turnipId = ?
          AND ownerId = ?
          AND ownerType = ?
        ORDER BY ownedAt ASC
        LIMIT 1
        RETURNING *
        `,
        )
        .bind(
          params.receiverId,
          params.receiverType,
          now,
          params.turnipId,
          params.senderId,
          params.senderType,
        ),
      transformer: (response) => first(response.results as Turnip[]),
    },
    prepareTransaction(db, {
      id: uuid.v1(),
      createdAt: now,
      turnipId: params.turnipId,
      senderId: params.senderId,
      senderType: params.senderType,
      receiverId: params.receiverId,
      receiverType: params.receiverType,
    }),
  ];
}

type GuildPlantedCount = number;
type UserPlantedCount = number;
type TotalHarvestsRemainingCount = number;
type UnripeGuildTurnips = GuildTurnip[];

type PrepareSurveyGuildParams = { timestamp?: Date; userId: string; guildId: string };
type PrepareSurveyGuildResponse = Statements<
  [GuildPlantedCount, UserPlantedCount, TotalHarvestsRemainingCount, UnripeGuildTurnips]
>;

function prepareSurveyGuild(
  db: D1Database,
  params: PrepareSurveyGuildParams,
): PrepareSurveyGuildResponse {
  const now = params.timestamp ?? new Date();

  return [
    {
      statement: db
        .prepare(
          `
          SELECT COUNT(*) as guildPlantedCount FROM GuildTurnip
          WHERE guildId = ?
          `,
        )
        .bind(params.guildId),
      transformer: (response) =>
        (first(response.results) as { guildPlantedCount: GuildPlantedCount } | undefined)
          ?.guildPlantedCount,
    },
    {
      statement: db
        .prepare(
          `
          SELECT COUNT(*) as userPlantedCount FROM GuildTurnip
          WHERE guildId = ?
            AND planterId = ?
          `,
        )
        .bind(params.guildId, params.userId),
      transformer: (response) =>
        (first(response.results) as { userPlantedCount: UserPlantedCount } | undefined)
          ?.userPlantedCount,
    },
    {
      statement: db
        .prepare(
          `
          SELECT SUM(harvestsRemaining) as totalHarvestsRemainingCount FROM GuildTurnip
          WHERE guildId = ?
            AND harvestableAt < ?
            AND harvestsRemaining > ?
          `,
        )
        .bind(params.guildId, now, 0),
      transformer: (response) =>
        (
          first(response.results) as
            | { totalHarvestsRemainingCount: TotalHarvestsRemainingCount }
            | undefined
        )?.totalHarvestsRemainingCount,
    },
    {
      statement: db
        .prepare(
          `
          SELECT * FROM GuildTurnip
          WHERE guildId = ?
            AND harvestableAt > ?
            AND harvestsRemaining > ?
          `,
        )
        .bind(params.guildId, now, 0),
      transformer: (response) => response.results as UnripeGuildTurnips,
    },
  ];
}

type SurveyGuildParams = Pick<PrepareSurveyGuildParams, 'guildId' | 'userId'>;
type SurveyGuildResponse = Promise<{
  guildPlantedCount: GuildPlantedCount;
  userPlantedCount: UserPlantedCount;
  totalHarvestsRemainingCount: TotalHarvestsRemainingCount;
  unripeGuildTurnips: UnripeGuildTurnips;
} | null>;

async function surveyGuild(db: D1Database, params: SurveyGuildParams): SurveyGuildResponse {
  const [guildPlantedCount, userPlantedCount, totalHarvestsRemainingCount, unripeGuildTurnips] =
    await transaction(db, prepareSurveyGuild(db, params));

  if (
    guildPlantedCount == null ||
    userPlantedCount == null ||
    totalHarvestsRemainingCount == null ||
    unripeGuildTurnips == null
  ) {
    return null;
  }

  return {
    guildPlantedCount,
    userPlantedCount,
    totalHarvestsRemainingCount,
    unripeGuildTurnips,
  };
}

type GetOldestTurnipForOwnerParams = Pick<Turnip, 'ownerId' | 'ownerType' | 'type'>;

async function getOldestTurnipForOwner(
  db: D1Database,
  params: GetOldestTurnipForOwnerParams,
): Promise<Turnip | null | undefined> {
  const statement = db
    .prepare(
      `
      SELECT * FROM Turnip
      WHERE ownerId = ?
        AND ownerType = ?
        AND type = ?
      ORDER BY ownedAt ASC
      LIMIT 1;
      `,
    )
    .bind(params.ownerId, params.ownerType, params.type);

  return await statement.first<Turnip>();
}

type GiveTurnipParams = {
  turnipType: TurnipType;
} & Pick<TurnipTransaction, 'senderId' | 'receiverId'>;
type GiveTurnipResponse = Promise<Turnip | null | undefined>;

async function giveTurnip(db: D1Database, params: GiveTurnipParams): GiveTurnipResponse {
  const consumedTurnip = await getOldestTurnipForOwner(db, {
    ownerId: params.senderId,
    ownerType: OwnerType.USER,
    type: params.turnipType,
  });

  if (consumedTurnip == null) {
    return null;
  }

  const results = await transaction(
    db,
    prepareMoveTurnip(db, {
      turnipId: consumedTurnip.id,
      senderId: params.senderId,
      senderType: OwnerType.USER,
      receiverId: params.receiverId,
      receiverType: OwnerType.USER,
    }),
  );

  return results[0];
}

type TurnipTypeCount = {
  type: Turnip;
  count: number;
};

type GetTurnipInventoryResponse = Promise<TurnipTypeCount[] | null>;

async function getTurnipInventory(db: D1Database, userId: string): GetTurnipInventoryResponse {
  const statement = db
    .prepare(
      `
      SELECT type, COUNT(*) AS count
      FROM Turnip
      WHERE ownerId = ?
        AND ownerType = ?
      GROUP BY type
      ORDER BY type
      `,
    )
    .bind(userId, OwnerType.USER);

  return (await statement.all<TurnipTypeCount>()).results;
}

type PlantTurnipParams = Pick<GuildTurnip, 'guildId' | 'planterId' | 'turnipId'>;
type PlantTurnipResponse = Promise<
  | {
      turnip: Turnip;
      guildTurnip: GuildTurnip;
      guildPlantedCount: GuildPlantedCount;
      userPlantedCount: UserPlantedCount;
      totalHarvestsRemainingCount: TotalHarvestsRemainingCount;
      unripeGuildTurnips: UnripeGuildTurnips;
    }
  | null
  | undefined
>;

async function plantTurnip(db: D1Database, params: PlantTurnipParams): PlantTurnipResponse {
  const now = new Date();

  const [
    turnip,
    _,
    guildTurnip,
    guildPlantedCount,
    userPlantedCount,
    totalHarvestsRemainingCount,
    unripeGuildTurnips,
  ] = await transaction<
    [
      Turnip,
      TurnipTransaction,
      GuildTurnip,
      GuildPlantedCount,
      UserPlantedCount,
      TotalHarvestsRemainingCount,
      UnripeGuildTurnips,
    ]
  >(db, [
    ...prepareMoveTurnip(db, {
      turnipId: params.turnipId,
      senderId: params.planterId,
      senderType: OwnerType.USER,
      receiverId: params.guildId,
      receiverType: OwnerType.GUILD,
      timestamp: now,
    }),
    {
      statement: db
        .prepare(
          `
          INSERT INTO GuildTurnip (
            guildId,
            turnipId,
            harvestableAt,
            harvestsRemaining,
            planterId,
            plantedAt
          ) VALUES (
            ?, ?, ?, ?, ?, ?
          )
          RETURNING *
          `,
        )
        .bind(
          params.guildId,
          params.turnipId,
          new Date(now.getTime() + HARVEST_TIME_MS),
          randomRange(...HARVEST_RANGE),
          params.planterId,
          now,
        ),
      transformer: (response) => first(response.results[0] as GuildTurnip[]),
    },
    ...prepareSurveyGuild(db, {
      timestamp: now,
      userId: params.planterId,
      guildId: params.guildId,
    }),
  ]);

  if (
    turnip == null ||
    guildTurnip == null ||
    guildPlantedCount == null ||
    userPlantedCount == null ||
    totalHarvestsRemainingCount == null ||
    unripeGuildTurnips == null
  ) {
    return null;
  }

  return {
    turnip,
    guildTurnip,
    guildPlantedCount,
    userPlantedCount,
    totalHarvestsRemainingCount,
    unripeGuildTurnips,
  };
}


type GetOldestHarvestableGuildTurnipParams = {
  guildId: string,
}

function getOldestHarvestableGuildTurnip(db: D1Database, params: GetOldestHarvestableGuildTurnipParams): Promise<GuildTurnip | null | undefined> {
  const statement = db.prepare(
    `
    SELECT * FROM GuildTurnip
    WHERE guildId = ?
      AND harvestableAt < ?
      AND harvestsRemaining > ?
    ORDER BY harvestableAt ASC
    LIMIT 1
    `
  ).bind(
    new Date(),
    0,
  )

  return statement.first<GuildTurnip>();
}

type PrepareHarvestTurnipParams = {
  guildId: string,
  turnipId: string,
  harvestsRemaining
}
type PrepareHarvestTurnipResponse = Statements<[]>

function prepareHarvestTurnip() {
  return [
    {
      statement:
    }
  ]
}

export const TurnipQueries = {
  giveTurnip,
  getTurnipInventory,
  surveyGuild,
  plantTurnip,
};
