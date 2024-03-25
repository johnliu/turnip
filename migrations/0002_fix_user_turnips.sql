-- Migration number: 0002 	 2024-03-25T11:12:26.642Z
DROP TABLE user_turnips;

CREATE TABLE IF NOT EXISTS user_turnips (
  user_id TEXT,
  collected_at_ms INTEGER,
  source_type INTEGER,
  source_id TEXT,
  PRIMARY KEY (user_id, collected_at_ms)
);
