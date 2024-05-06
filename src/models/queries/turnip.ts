import { type Result, err, ok } from 'neverthrow';
import { v1 as uuid } from 'uuid';

import {
  ForageOnCooldownError,
  MissingResultError,
  OriginType,
  OwnerType,
  QueryError,
  TurnipType,
  USER_FORAGE_AMOUNT_RANGE,
  USER_FORAGE_COOLDOWN_MS,
} from '@/models/constants';
import {
  getLastForage,
  prepareCreateTransaction,
  prepareCreateTransactions,
} from '@/models/queries/turnip-transaction';
import type { Turnip } from '@/models/turnip';
import type { TurnipTransaction } from '@/models/turnip-transactions';
import {
  type Statements,
  batch,
  getOne,
  makeInsertManyStatement,
  makeOneStatement,
} from '@/utils/d1';
import type { StandardError } from '@/utils/errors';
import { randomRange } from '@/utils/random';

export function prepareMoveTurnip(
  db: D1Database,
  params: {
    timestamp: number;
    turnipId: string;
    receiverId: string;
    receiverType: OwnerType;
    senderId: string;
    senderType: OwnerType;
  },
): Statements<[Turnip, TurnipTransaction]> {
  return [
    makeOneStatement(
      db
        .prepare(
          `
          UPDATE Turnip
          SET ownerId = ?,
              ownerType = ?,
              ownedAt = ?
          WHERE id = ?
            AND ownerId = ?
            AND ownerType = ?
          RETURNING *
          ORDER BY ownedAt ASC
          LIMIT 1
          `,
        )
        .bind(
          params.receiverId,
          params.receiverType,
          params.timestamp,
          params.turnipId,
          params.senderId,
          params.senderType,
        ),
    ),
    prepareCreateTransaction(db, {
      id: uuid(),
      createdAt: params.timestamp,
      turnipId: params.turnipId,
      senderId: params.senderId,
      senderType: params.senderType,
      receiverId: params.receiverId,
      receiverType: params.receiverType,
    }),
  ];
}

export function prepareCreateTurnips(
  db: D1Database,
  params: {
    count: number;
  } & Pick<Turnip, 'createdAt' | 'originId' | 'originType' | 'parentId' | 'ownerId' | 'ownerType'>,
): Statements<[Turnip[], TurnipTransaction[]]> {
  const turnips: Turnip[] = [...Array(params.count)].map((_) => ({
    id: uuid(),
    type: TurnipType.STANDARD,
    createdAt: params.createdAt,
    originId: params.originId,
    originType: params.originType,
    parentId: params.parentId,
    ownerId: params.ownerId,
    ownerType: params.ownerType,
    ownedAt: params.createdAt,
  }));

  return [
    makeInsertManyStatement(db, 'Turnip', turnips),
    prepareCreateTransactions(db, {
      turnipIds: turnips.map((turnip) => turnip.id),
      createdAt: params.createdAt,
      receiverId: params.ownerId,
      receiverType: params.ownerType,
      senderId: params.originId,
      senderType: params.originId != null ? OwnerType.GUILD : OwnerType.SYSTEM,
    }),
  ];
}

export async function getOldestTurnipForUser(
  db: D1Database,
  {
    userId,
    turnipType = TurnipType.STANDARD,
  }: {
    userId: string;
    turnipType: TurnipType;
  },
): Promise<Turnip | null | undefined> {
  return await getOne<Turnip>(db, 'Turnip', {
    ownerId: userId,
    ownerType: OwnerType.USER,
    type: turnipType,
  });
}

export async function giveTurnip(
  db: D1Database,
  {
    turnipType = TurnipType.STANDARD,
    ...params
  }: { senderId: string; receiverId: string; turnipType?: TurnipType },
): Promise<
  Result<Turnip, StandardError<QueryError.NoTurnipsError> | StandardError<QueryError.MissingResult>>
> {
  const sentTurnip = await getOldestTurnipForUser(db, { userId: params.senderId, turnipType });
  if (sentTurnip == null) {
    return err({ type: QueryError.NoTurnipsError });
  }

  const [receivedTurnip, _] = await batch(
    db,
    prepareMoveTurnip(db, {
      timestamp: new Date().getTime(),
      turnipId: sentTurnip.id,
      senderId: params.senderId,
      senderType: OwnerType.USER,
      receiverId: params.receiverId,
      receiverType: OwnerType.USER,
    }),
  );

  return receivedTurnip != null ? ok(receivedTurnip) : err({ type: QueryError.MissingResult });
}

type TurnipCount = {
  type: TurnipType;
  count: number;
};

export async function getTurnipInventory(
  db: D1Database,
  params: { userId: string },
): Promise<TurnipCount[]> {
  const results = await db
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
    .bind(params.userId, OwnerType.USER)
    .all<TurnipCount>();

  return results.results;
}

export async function forageTurnips(
  db: D1Database,
  params: { userId: string },
): Promise<Result<Turnip[], ForageOnCooldownError | MissingResultError>> {
  const now = new Date().getTime();
  const lastForagedTimestamp = await getLastForage(db, { timestamp: now, ...params });

  if (lastForagedTimestamp != null) {
    return err(new ForageOnCooldownError(lastForagedTimestamp + USER_FORAGE_COOLDOWN_MS - now));
  }

  const [turnips, _] = await batch(
    db,
    prepareCreateTurnips(db, {
      count: randomRange(...USER_FORAGE_AMOUNT_RANGE),
      createdAt: now,
      originId: null,
      originType: OriginType.FORAGED,
      parentId: null,
      ownerId: params.userId,
      ownerType: OwnerType.USER,
    }),
  );

  return turnips != null ? ok(turnips) : err(new MissingResultError('forageTurnips'));
}

export default {
  giveTurnip,
  getTurnipInventory,
  forageTurnips,
};
