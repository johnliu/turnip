import uuid from 'uuid';

import { type CamelKeysToSnake, snakeKeysToCamel } from '@/utils/objects';
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

type D1ResultTransformer<T> = (response: D1Result) => T | null;

type PrepareTransactionParams = TurnipTransaction;
type PrepareTransactionResponse = {
  statements: [D1PreparedStatement];
  transformers: [D1ResultTransformer<TurnipTransaction>];
};

function prepareTransaction(
  db: D1Database,
  params: PrepareTransactionParams,
): PrepareTransactionResponse {
  return {
    statements: [
      db
        .prepare(
          `
          INSERT INTO turnip_transactions (
            id,
            created_at,
            turnip_id,
            sender_id,
            sender_type,
            receiver_id,
            receiver_type
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
    ],
    transformers: [
      (response) => {
        return response.results.length > 0
          ? snakeKeysToCamel(response.results[0] as CamelKeysToSnake<TurnipTransaction>)
          : null;
      },
    ],
  };
}

type PrepareMoveTurnipParams = Pick<
  TurnipTransaction,
  'turnipId' | 'receiverId' | 'receiverType' | 'senderId' | 'senderType'
> & {
  timestamp?: Date;
};
type PrepareMoveTurnipResponse = {
  statements: [D1PreparedStatement, D1PreparedStatement];
  transformers: [D1ResultTransformer<Turnip>, D1ResultTransformer<TurnipTransaction>];
};

function prepareMoveTurnip(
  db: D1Database,
  params: PrepareMoveTurnipParams,
): PrepareMoveTurnipResponse {
  const now = params.timestamp ?? new Date();

  const { statements, transformers } = prepareTransaction(db, {
    id: uuid.v1(),
    createdAt: now,
    turnipId: params.turnipId,
    senderId: params.senderId,
    senderType: params.senderType,
    receiverId: params.receiverId,
    receiverType: params.receiverType,
  });

  return {
    statements: [
      db
        .prepare(
          `
        UPDATE turnips
        SET owner_id = ?,
            owner_type = ?,
            owned_at = ?,
        WHERE turnip_id = ?
          AND owner_id = ?
          AND owner_type = ?
        ORDER BY owned_at ASC
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
      ...statements,
    ],
    transformers: [
      (response) => {
        return response.results.length > 0
          ? snakeKeysToCamel(response.results[0] as CamelKeysToSnake<Turnip>)
          : null;
      },
      ...transformers,
    ],
  };
}

type PrepareSurveyGuildParams = { timestamp?: Date; userId: string; guildId: string };
type PrepareSurveyGuildResponse = {
  statements: [D1PreparedStatement, D1PreparedStatement, D1PreparedStatement, D1PreparedStatement];
  transformers: [
    D1ResultTransformer<{ guildTotal: number }>,
    D1ResultTransformer<{ userTotal: number }>,
    D1ResultTransformer<{ totalHarvestsRemaining: number }>,
    D1ResultTransformer<GuildTurnip[]>,
  ];
};

function prepareSurveyGuild(
  db: D1Database,
  params: PrepareSurveyGuildParams,
): PrepareSurveyGuildResponse {
  const now = params.timestamp ?? new Date();

  return {
    statements: [
      db // Total planted turnips
        .prepare(
          `
          SELECT COUNT(*) as guild_total FROM guild_turnips
          WHERE guild_id = ?
          `,
        )
        .bind(params.guildId),
      db // Planted by current user
        .prepare(
          `
          SELECT COUNT(*) as user_total FROM guild_turnips
          WHERE guild_id = ?
            AND planter_id = ?
          `,
        )
        .bind(params.guildId, params.userId),
      db // Harvestable turnips
        .prepare(
          `
          SELECT SUM(harvests_remaining) as total_harvests_remaining FROM guild_turnips
          WHERE guild_id = ?
            AND harvestable_at < ?
            AND harvests_remaining > ?
          `,
        )
        .bind(params.guildId, now, 0),
      db // Unripe turnips
        .prepare(
          `
          SELECT * FROM guild_turnips
          WHERE guild_id = ?
            AND harvestable_at > ?
            AND harvests_remaining > ?
          `,
        )
        .bind(params.guildId, now, 0),
    ],
    transformers: [
      (response) => {
        return response.results.length > 0
          ? snakeKeysToCamel(response.results[0] as { guild_total: number })
          : null;
      },
      (response) => {
        return response.results.length > 0
          ? snakeKeysToCamel(response.results[0] as { user_total: number })
          : null;
      },
      (response) => {
        return response.results.length > 0
          ? snakeKeysToCamel(response.results[0] as { total_harvests_remaining: number })
          : null;
      },
      (response) => {
        return response.results.map((r) => snakeKeysToCamel(r as CamelKeysToSnake<GuildTurnip>));
      },
    ],
  };
}

type GetOldestTurnipForOwnerParams = Pick<Turnip, 'ownerId' | 'ownerType' | 'type'>;

async function getOldestTurnipForOwner(
  db: D1Database,
  params: GetOldestTurnipForOwnerParams,
): Promise<Turnip | null> {
  const statement = db
    .prepare(
      `
      SELECT * FROM turnips
      WHERE owner_id = ?
        AND owner_type = ?
        AND type = ?
      ORDER BY owned_at ASC
      LIMIT 1;
      `,
    )
    .bind(params.ownerId, params.ownerType, params.type);

  const response = await statement.first<CamelKeysToSnake<Turnip>>();
  return response != null ? snakeKeysToCamel(response) : null;
}

type GiveTurnipParams = Pick<TurnipTransaction, 'senderId' | 'receiverId'> & {
  turnipType: TurnipType;
};
type GiveTurnipResponse = Promise<{ turnip: Turnip } | null>;

async function giveTurnip(db: D1Database, params: GiveTurnipParams): GiveTurnipResponse {
  const consumedTurnip = await getOldestTurnipForOwner(db, {
    ownerId: params.senderId,
    ownerType: OwnerType.USER,
    type: params.turnipType,
  });

  if (consumedTurnip == null) {
    return null;
  }

  const { statements, transformers } = prepareMoveTurnip(db, {
    turnipId: consumedTurnip.id,
    senderId: params.senderId,
    senderType: OwnerType.USER,
    receiverId: params.receiverId,
    receiverType: OwnerType.USER,
  });

  const [turnip, _] = (await db.batch(statements)).map((response, i) =>
    transformers[i](response),
  ) as [Turnip | null, TurnipTransaction | null];

  return turnip != null
    ? {
        turnip,
      }
    : null;
}

type PlantTurnipParams = Pick<GuildTurnip, 'guildId' | 'planterId' | 'turnipId'>;
type PlantTurnipResponse = Promise<{ turnip: Turnip; guildTurnip: GuildTurnip } | null>;

async function plantTurnip(db: D1Database, params: PlantTurnipParams): PlantTurnipResponse {
  const now = new Date();

  const { statements: moveTurnipStatements, transformers: moveTurnipTransformers } =
    prepareMoveTurnip(db, {
      turnipId: params.turnipId,
      senderId: params.planterId,
      senderType: OwnerType.USER,
      receiverId: params.guildId,
      receiverType: OwnerType.GUILD,
      timestamp: now,
    });

  const { statements: surveyGuildStatements, transformers: surveyGuildTransformers } =
    prepareSurveyGuild(db, {
      timestamp: now,
      userId: params.planterId,
      guildId: params.guildId,
    });

  const statements = [
    ...moveTurnipStatements,
    db
      .prepare(
        `
        INSERT INTO guild_turnips (
          guild_id,
          turnip_id,
          harvestable_at,
          harvests_remaining,
          planter_id,
          planted_at
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
    ...surveyGuildStatements,
  ];

  const transformers: [
    ...typeof moveTurnipTransformers,
    D1ResultTransformer<GuildTurnip>,
    ...typeof surveyGuildTransformers,
  ] = [
    ...moveTurnipTransformers,
    (response: D1Result) =>
      response.results.length > 0
        ? snakeKeysToCamel(response.results[0] as CamelKeysToSnake<GuildTurnip>)
        : null,
    ...surveyGuildTransformers,
  ];

  const [turnip, turnip_transaction] = (await db.batch(statements)).map((response, i) =>
    transformers[i](response),
  );
  const turnip = response[0].results.length > 0 ? response[0].results[0] : null;
  const guildTurnip = response[2].results.length > 0 ? response[2].results[0] : null;

  return {
    turnip: turnip as Turnip,
    guildTurnip: guildTurnip as GuildTurnip,
  };
}

async function getTurnipInventory(db: D1Database, userId: string) {
  const statement = db
    .prepare(
      `
      SELECT type, COUNT(*) AS count
      FROM turnips
      WHERE owner_id = ?
        AND owner_type = ?
      GROUP BY type
      ORDER BY type
      `,
    )
    .bind(userId, OwnerType.USER);

  return statement.all<{ type: TurnipType; count: number }>();
}

const TurnipQueries = {
  async createTurnip(db: D1Database, turnip: Turnip) {
    const statement = db.prepare(`
      INSERT INTO turnips (
        id, created_at, type, origin_type, origin_id, parent_id, owner_type, owner_id, owned_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      RETURNING *
    `);

    return statement.bind(
      turnip.id,
      turnip.created_at,
      turnip.type,
      turnip.origin_type,
      turnip.origin_id,
      turnip.parent_id,
      turnip.owner_type,
      turnip.owner_id,
      turnip.owned_at,
    );
  },

  async giveTurnip(
    db: D1Database,
    senderId: string,
    receiverId: string,
    type: TurnipType = TurnipType.STANDARD,
  ) {
    return this.changeOldestTurnipOwner(
      db,
      senderId,
      OwnerType.USER,
      receiverId,
      OwnerType.USER,
      type,
    );
  },

  async getTurnipsForUser(db: D1Database, userId: string) {
    const statement = db.prepare(`
      SELECT type, COUNT(*) AS count
      FROM turnips
      WHERE owner_id = ?,
            owner_type = ?
      GROUP BY type
      ORDER BY type
    `);

    return statement.bind(userId, OwnerType.USER);
  },

  async plantTurnip(
    db: D1Database,
    userId: string,
    guildId: string,
    type: TurnipType = TurnipType.STANDARD,
  ) {
    const turnip = await this.changeOldestTurnipOwner(
      db,
      userId,
      OwnerType.USER,
      guildId,
      OwnerType.GUILD,
      type,
    ).first<Turnip>();
    if (turnip == null) {
      return null;
    }

    const statement = db.prepare(`
      INSERT INTO guild_turnips (
        guild_id,
        turnip_id,
        harvestable_at,
        harvests_remaining,
        planter_id,
        planted_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?
      )
    `);

    return statement.bind(
      guildId,
      turnip.id,
      new Date(turnip.owned_at.getTime() + 2 * 60 * 60 * 1000),
      randomRange(8, 12),
      userId,
      turnip.owned_at,
    );
  },
};
