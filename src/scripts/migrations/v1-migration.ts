import dedent from 'dedent';
import { nanoid } from 'nanoid';

import { OriginType, OwnerType, TURNIP_HARVESTABLE_AFTER_MS, TurnipType } from '@/models/constants';

type UserTurnip = {
  user_id: string;
  collected_at_ms: number;
  source_id: string;
  migrated_id?: string;
};

type GuildTurnip = {
  guild_id: string;
  planter_id: string;
  planted_at_ms: string;
  migrated_id?: string;
};

async function queryD1(sql: string, params?: unknown[]) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${Bun.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${Bun.env.CLOUDFLARE_D1_ID}/query`;
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Bun.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql,
      params,
    }),
  });
}

async function getUserTurnips(limit?: number) {
  const sql =
    limit == null ? 'SELECT * FROM user_turnips;' : `SELECT * FROM user_turnips LIMIT ${limit};`;

  const response = await (await queryD1(sql)).json<{
    result: {
      results: UserTurnip[];
    }[];
  }>();

  return response.result[0].results;
}

async function getGuildTurnips(limit?: number) {
  const sql =
    limit == null ? 'SELECT * FROM guild_turnips;' : `SELECT * FROM guild_turnips LIMIT ${limit};`;

  const response = await (await queryD1(sql)).json<{
    result: {
      results: GuildTurnip[];
    }[];
  }>();

  return response.result[0].results;
}

async function migrateUserTurnips(rows: UserTurnip[]) {
  for (const row of rows) {
    const id = nanoid();
    console.log(`Migrating user_turnip ${row.user_id}, ${row.collected_at_ms} -> ${id}`);

    if (row.migrated_id != null) {
      console.log(`Skipping because this turnip was already migrated as ${row.migrated_id}.`);
      continue;
    }

    let response: Response;

    response = await queryD1(
      dedent`
        INSERT INTO Turnip (
          id, createdAt, type, originId, originType, parentId, ownerId, ownerType, ownedAt
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *;
      `,
      [
        id,
        row.collected_at_ms,
        TurnipType.STANDARD,
        null,
        OriginType.FORAGED,
        null,
        row.user_id,
        OwnerType.USER,
        row.collected_at_ms,
      ],
    );
    if (response.status !== 200) {
      console.log(`-> Could not insert Turnip for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }

    // Giver forages, then gives.
    response = await queryD1(
      dedent`
        INSERT INTO TurnipTransaction (
          id, createdAt, turnipId, senderId, senderType, receiverId, receiverType
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?)
        RETURNING *;
      `,
      [
        ...[
          nanoid(),
          row.collected_at_ms,
          id,
          null,
          OwnerType.SYSTEM,
          row.source_id,
          OwnerType.USER,
        ],
        ...[
          nanoid(),
          row.collected_at_ms,
          id,
          row.source_id,
          OwnerType.USER,
          row.user_id,
          OwnerType.USER,
        ],
      ],
    );
    if (response.status !== 200) {
      console.log(`-> Could not insert TurnipTransactions for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }

    response = await queryD1(
      dedent`
        INSERT OR IGNORE INTO UserSettings (
          id, settings
        )
        VALUES
        (?, ?)
        RETURNING *;
      `,
      [row.source_id, JSON.stringify({ patchVersion: 1 })],
    );
    if (response.status !== 200) {
      console.log(`-> Could not create UserSettings for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }

    response = await queryD1(
      dedent`
        UPDATE user_turnips
        SET migrated_id = ?
        WHERE user_id = ?
          AND collected_at_ms = ?;
      `,
      [id, row.user_id, row.collected_at_ms],
    );
    if (response.status !== 200) {
      console.log(`-> Could not update migrated_id for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }
  }
}

async function migrateGuildTurnips(rows: GuildTurnip[]) {
  for (const row of rows) {
    const id = nanoid();
    console.log(
      `Migrating guild_turnip ${row.guild_id}, ${row.planter_id}, ${row.planted_at_ms} -> ${id}`,
    );

    if (row.migrated_id != null) {
      console.log(`Skipping because this guild turnip was already migrated as ${row.migrated_id}.`);
      continue;
    }

    let response: Response;
    response = await queryD1(
      dedent`
        INSERT INTO Turnip (
          id, createdAt, type, originId, originType, parentId, ownerId, ownerType, ownedAt
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *;
      `,
      [
        id,
        row.planted_at_ms,
        TurnipType.STANDARD,
        null,
        OriginType.FORAGED,
        null,
        row.guild_id,
        OwnerType.GUILD,
        row.planted_at_ms,
      ],
    );
    if (response.status !== 200) {
      console.log(`-> Could not insert Turnip for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }

    // Planter forages, then plants.
    response = await queryD1(
      dedent`
        INSERT INTO TurnipTransaction (
          id, createdAt, turnipId, senderId, senderType, receiverId, receiverType
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?)
        RETURNING *;
      `,
      [
        ...[
          nanoid(),
          row.planted_at_ms,
          id,
          null,
          OwnerType.SYSTEM,
          row.planter_id,
          OwnerType.USER,
        ],
        ...[
          nanoid(),
          row.planted_at_ms,
          id,
          row.planter_id,
          OwnerType.USER,
          row.guild_id,
          OwnerType.GUILD,
        ],
      ],
    );
    if (response.status !== 200) {
      console.log(`-> Could not create TurnipTransactions for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }

    response = await queryD1(
      dedent`
        INSERT INTO GuildTurnip (
          guildId, turnipId, harvestableAt, harvestsRemaining, planterId, plantedAt
        )
        VALUES
        (?, ?, ?, ?, ?, ?)
        RETURNING *;
      `,
      [
        row.guild_id,
        id,
        row.planted_at_ms + TURNIP_HARVESTABLE_AFTER_MS,
        1,
        row.planter_id,
        row.planted_at_ms,
      ],
    );
    if (response.status !== 200) {
      console.log(`-> Could not create GuildTurnip for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }

    response = await queryD1(
      dedent`
        INSERT OR IGNORE INTO UserSettings (
          id, settings
        )
        VALUES
        (?, ?)
        RETURNING *;
      `,
      [row.planter_id, JSON.stringify({ patchVersion: 1 })],
    );
    if (response.status !== 200) {
      console.log(`-> Could not create UserSettings for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }

    response = await queryD1(
      dedent`
        UPDATE guild_turnips
        SET migrated_id = ?
        WHERE guild_id = ?
          AND planter_id = ?
          AND planted_at_ms = ?;
      `,
      [id, row.guild_id, row.planter_id, row.planted_at_ms],
    );
    if (response.status !== 200) {
      console.log(`-> Could not update migrated_id for ${id}, got a ${response.status}`);
      throw new Error('Failed to migrate record');
    }
  }
}

export async function migrateAll() {
  await migrateUserTurnips(await getUserTurnips());
  await migrateGuildTurnips(await getGuildTurnips());
}
