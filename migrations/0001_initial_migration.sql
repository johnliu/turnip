-- Migration number: 0001 	 2024-03-25T07:21:43.046Z
CREATE TABLE IF NOT EXISTS user_turnips (
  user_id TEXT PRIMARY KEY,
  collected_at_ms INTEGER,
  source_type INTEGER,
  source_id TEXT
);

CREATE TABLE IF NOT EXISTS guild_turnips (
  guild_id TEXT,
  planter_id TEXT,
  planted_at_ms INTEGER,
  PRIMARY KEY (guild_id, planter_id, planted_at_ms)
);
