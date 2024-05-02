import { randomRange } from '@/utils/random';
import type { SnakeKeysToCamel } from '@/utils/types';

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
  created_at: Date;
  type: TurnipType;
  origin_type: OriginType;
  origin_id: string | null;
  parent_id: string;
  owner_type: OwnerType;
  owner_id: string;
  owned_at: Date;
};

type TurnipTransaction = {
  id: string;
  created_at: Date;
  turnip_id: string;
  sender_id: string;
  sender_type: OwnerType;
  receiver_id: string;
  receiver_type: OwnerType;
};

export type GuildTurnip = {
  guild_id: string;
  turnip_id: string;
  harvestable_at: number;
  harvests_remaining: number;
  planter_id: string;
  planted_at: number;
};


type TurnipTransactionParams = SnakeKeysToCamel<TurnipTransaction>;

function internalCreateTransaction(db: D1Database, transaction: TurnipTransactionParams) {

}

const TurnipInternalQueries = {
  createTransaction({db, turnipId, createdAt, senderId, senderType, receiverId, receiverType}: {db: D1Database, turnipId: string, createdAt: Date, senderId: string, senderType: OwnerType, receiverId: string, receiverType: OwnerType}) {

  },

  moveTurnip(
    db: D1Database,
    senderId: string,
    senderOwnerType: OwnerType,
    receiverId: string,
    receiverIdType: OwnerType,
    type: TurnipType = TurnipType.STANDARD,
  ) {
    const statements = [
      db.prepare(
        `
        UPDATE turnips
        SET owner_id = ?,
            owner_type = ?,
            owned_at = ?,
        WHERE owner_id = ?,
          AND owner_type = ?,
          AND type = ?
        ORDER BY owned_at ASC
        LIMIT 1
        RETURNING *
        `
      ).bind(
        senderId,
        senderOwnerType,
        new Date(),
        receiverId,
        receiverIdType,
        type,
      ),
      db.prepare(
        `
        INSERT INTO turnip_transactions (

        )
        `
      ),
    ];

    return statements;
  },
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

  async giveTurnip(db: D1Database, senderId: string, receiverId: string, type: TurnipType = TurnipType.STANDARD) {
    return this.changeOldestTurnipOwner(db, senderId, OwnerType.USER, receiverId, OwnerType.USER, type);
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

  async plantTurnip(db: D1Database, userId: string, guildId: string, type: TurnipType = TurnipType.STANDARD) {
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
