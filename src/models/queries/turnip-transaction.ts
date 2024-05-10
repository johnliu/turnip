import { v1 as uuid } from 'uuid';

import { OwnerType, USER_FORAGE_COOLDOWN_MS, USER_HARVEST_COOLDOWN_MS } from '@/models/constants';
import type { TurnipTransaction } from '@/models/turnip-transactions';
import { first } from '@/utils/arrays';
import {
  type Statement,
  makeInsertManyStatement,
  makeInsertOneStatement,
  makeOneStatement,
} from '@/utils/d1';

export function prepareCreateTransaction(
  db: D1Database,
  params: TurnipTransaction,
): Statement<TurnipTransaction> {
  return makeInsertOneStatement<TurnipTransaction>(db, 'TurnipTransaction', params);
}

export function prepareCreateTransactions(
  db: D1Database,
  params: {
    turnipIds: string[];
  } & Pick<
    TurnipTransaction,
    'createdAt' | 'senderId' | 'senderType' | 'receiverId' | 'receiverType'
  >,
): Statement<TurnipTransaction[]> {
  const transactions = params.turnipIds.map((turnipId) => ({
    id: uuid(),
    createdAt: params.createdAt,
    turnipId,
    senderId: params.senderId,
    senderType: params.senderType,
    receiverId: params.receiverId,
    receiverType: params.receiverType,
  }));

  return makeInsertManyStatement<TurnipTransaction>(db, 'TurnipTransaction', transactions);
}

export function prepareGetLastHarvest(
  db: D1Database,
  params: {
    userId: string;
    guildId: string;
    timestamp: number;
  },
): Statement<number> {
  return {
    statement: db
      .prepare(
        `
      SELECT createdAt FROM TurnipTransaction
      WHERE senderId = ?
        AND senderType = ?
        AND receiverId = ?
        AND receiverType = ?
        AND createdAt > ?
      ORDER BY createdAt DESC
      `,
      )
      .bind(
        params.guildId,
        OwnerType.GUILD,
        params.userId,
        OwnerType.USER,
        params.timestamp - USER_HARVEST_COOLDOWN_MS,
      ),
    transformer: (response: D1Result) =>
      (first(response.results) as { createdAt: number })?.createdAt,
  };
}

export async function getLastForage(
  db: D1Database,
  params: {
    userId: string;
    timestamp: number;
  },
): Promise<number | null> {
  return await db
    .prepare(
      `
      SELECT createdAt FROM TurnipTransaction
      WHERE senderType = ?
        AND receiverId = ?
        AND receiverType = ?
        AND createdAt > ?
      ORDER BY createdAt DESC
      `,
    )
    .bind(
      OwnerType.SYSTEM,
      params.userId,
      OwnerType.USER,
      params.timestamp - USER_FORAGE_COOLDOWN_MS,
    )
    .first<number>('createdAt');
}

export function prepareGetGuildPlantedCount(
  db: D1Database,
  params: { guildId: string },
): Statement<{ guildPlantedCount: number }> {
  return makeOneStatement<{ guildPlantedCount: number }>(
    db
      .prepare(
        `
        SELECT COUNT(*) as guildPlantedCount FROM TurnipTransaction
        WHERE receiverId = ?
          AND receiverType = ?
        `,
      )
      .bind(params.guildId, OwnerType.GUILD),
  );
}

export function prepareGetUserPlantedCount(
  db: D1Database,
  params: { guildId: string; userId: string },
): Statement<{ userPlantedCount: number }> {
  return makeOneStatement<{ userPlantedCount: number }>(
    db
      .prepare(
        `
        SELECT COUNT(*) as userPlantedCount FROM TurnipTransaction
        WHERE receiverId = ?
          AND receiverType = ?
          AND senderId = ?
          AND senderType = ?
        `,
      )
      .bind(params.guildId, OwnerType.GUILD, params.userId, OwnerType.USER),
  );
}
