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
  owned_at DATETIME
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


---

CREATE TABLE IF NOT EXISTS turnips (
  id TEXT PRIMARY KEY,
  created_at DATETIME,
  type INTEGER,
  origin_type INTEGER,
  origin_id TEXT,
  parent_id TEXT,
  owner_type INTEGER,
  owner_id TEXT,
  owned_at DATETIME
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

CREATE TABLE IF NOT EXISTS guild_turnips (
  guild_id TEXT,
  turnip_id TEXT,
  harvestable_at DATETIME,
  harvests_remaining INTEGER,
  planter_id TEXT,
  planted_at DATETIME,
  PRIMARY KEY (guild_id, turnip_id)
);

INSERT OR REPLACE INTO turnips (
  id,
  created_at,
  type,
  origin_type,
  origin_id,
  parent_id,
  owner_type,
  owner_id,
  owned_at
) VALUES
  (
    '1c90f260-084d-11ef-baa3-61005c79c3bb',
    '2024-05-02T06:28:07.785Z',
    0,
    0,
    NULL,
    NULL,
    0,
    '1088605169517858818',
    '2024-05-02T06:28:07.785Z'
  ),
  (
    '3ee09940-084f-11ef-baa3-61005c79c3bb',
    '2024-05-02T06:43:20.806Z',
    0,
    0,
    NULL,
    NULL,
    0,
    '1088605169517858818',
    '2024-05-02T06:43:20.806Z'
  ),
  (
    '4d7d7180-084f-11ef-baa3-61005c79c3bb',
    '2024-05-02T06:43:46.003Z',
    0,
    0,
    NULL,
    NULL,
    0,
    '128697916033466368',
    '2024-05-02T06:43:46.003Z'
  )
RETURNING *;

UPDATE OR IGNORE turnips
SET owner_id = '128697916033466368',
    owner_type = 0,
    owned_at = '2024-05-02T06:46:05.862Z'
WHERE id = '1c90f260-084d-11ef-baa3-61005c79c3bb'
  AND owner_id = '1088605169517858818'
  AND owner_type = 0
RETURNING *;
