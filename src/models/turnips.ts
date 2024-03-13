import type { D1Database } from '@cloudflare/workers-types';

export const MAX_COUNTABLE_TURNIPS = 1000;
export const HARVEST_TIME = 1000 * 60 * 60 * 2;

enum SourceType {
  USER = 0,
  GUILD = 1,
}

export type UserTurnip = {
  user_id: string;
  collected_at_ms: number;
  source_type: SourceType;
  source_id: string;
};

export type GuildTurnip = {
  guild_id: string;
  planter_id: string;
  planted_at_ms: number;
};

export const UserTurnipQueries = {
  async getTurnips(db: D1Database, userId: string) {
    const statement = db.prepare('SELECT * FROM user_turnips WHERE user_id = ?1 ORDER BY collected_at_ms LIMIT 1000');
    const response = await statement.bind(userId).all<UserTurnip>();

    return response.success ? response.results : null;
  },

  async giveTurnip(db: D1Database, senderId: string, receiverId: string) {
    const statement = db.prepare(
      'INSERT INTO user_turnips (user_id, collected_at_ms, source_type, source_id) VALUES(?1, ?2, ?3, ?4)',
    );
    const response = await statement.bind(receiverId, new Date().getTime(), SourceType.USER, senderId).run();
    return response.success;
  },
};

export const GuildTurnipQueries = {
  async surveyTurnips(db: D1Database, guildId: string, userId: string) {
    const statements = [
      db
        .prepare('SELECT COUNT(*) AS count FROM guild_turnips WHERE guild_id = ?1 AND planter_id = ?2')
        .bind(guildId, userId),
      db.prepare('SELECT COUNT(*) AS count FROM guild_turnips WHERE guild_id = ?1').bind(guildId),
    ];

    const responses = await db.batch<{ count: number }>(statements);
    return {
      userTotal: responses[0].results[0].count,
      guildTotal: responses[0].results[0].count,
    };
  },

  async plantTurnip(db: D1Database, guildId: string, planterId: string) {
    const statement = db.prepare(`
      INSERT INTO guild_turnips (guild_id, planter_id, planted_at_ms)
      SELECT ?1, ?2, ?3
      WHERE NOT EXISTS (
        SELECT * FROM guild_turnips
        WHERE guild_id = ?1 AND planter_id = ?2 AND planted_at_ms >= (?3 - ${HARVEST_TIME})
      )
    `);

    const response = await statement.bind(guildId, planterId, new Date().getTime()).run();
    return response.meta.changed_db;
  },

  async lastPlanted(db: D1Database, guildId: string, planterId: string) {
    const statement = db.prepare(
      'SELECT * FROM guild_turnips WHERE guild_id = ?1 AND planter_id = ?2 ORDER BY planted_at_ms DESC LIMIT 1',
    );
    const response = await statement.bind(guildId, planterId).first<GuildTurnip>();
    return response;
  },
};
