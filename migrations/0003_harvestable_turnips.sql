-- Migration number: 0003 	 2024-04-02T00:43:30.423Z

CREATE TABLE IF NOT EXISTS turnips (
  id TEXT PRIMARY KEY,
  created_at DATETIME,
  type INTEGER,
  origin_type INTEGER,
  origin_id TEXT,
  parent_id TEXT,
  owner_type INTEGER,
  owner_id TEXT,
  owned_at DATETIME,
);

CREATE TABLE IF NOT EXISTS turnip_transactions (
  id TEXT PRIMARY KEY,
  created_at_ms DATETIME,
  turnip_id TEXT,
  sender_id TEXT,
  sender_type INTEGER,
  receiver_id TEXT,
  receiver_type INTEGER
);

-- Rename previous guild_turnips table
ALTER TABLE guild_turnips RENAME TO guild_turnips_deprecated;

CREATE TABLE IF NOT EXISTS guild_turnips (
  guild_id TEXT,
  turnip_id TEXT,
  harvestable_at DATETIME,
  harvests_remaining INTEGER,
  planter_id TEXT,
  planted_at DATETIME,
  PRIMARY KEY (guild_id, turnip_id)
);
