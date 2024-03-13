import { D1Database } from 'cloudflare/worker-types';

export const MAX_COUNTABLE_TURNIPS = 1000;

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
  harvested_at_ms: number | null;
};

export const UserTurnipQueries = {
  async getTurnips(db: D1Database, userId: string) {
    const statement = db.prepare('SELECT * FROM user_turnips WHERE user_id = ?1 LIMIT 1000 ORDER BY collected_at');
    const response = await statement.bind(userId).all<UserTurnip>();

    return response.success ? response.results : null;
  },

  async giveTurnip(db: D1Database, senderId: string, receiverId: string) {
    const statement = db.prepare(
      'INSERT INTO user_turnips (user_id, collected_at_ms, source_type, source_id) VALUES(?1, ?2, ?3, ?4)',
    );
    const response = await statement.bind(senderId, new Date().getTime(), SourceType.USER, receiverId).run();
    return response.success;
  },
};
