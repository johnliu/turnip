-- Migration number: 0003 	 2024-04-02T00:43:30.423Z

CREATE TABLE IF NOT EXISTS Turnip (
  id TEXT PRIMARY KEY,
  createdAt INTEGER,
  type INTEGER,
  originType INTEGER,
  originId TEXT,
  parentId TEXT,
  ownerType INTEGER,
  ownerId TEXT,
  ownedAt INTEGER
);

CREATE INDEX IF NOT EXISTS Turnip_ownerId_idx ON Turnip (
  ownerId,
  ownerType
);

CREATE TABLE IF NOT EXISTS TurnipTransaction (
  id TEXT PRIMARY KEY,
  createdAt INTEGER,
  turnipId TEXT,
  senderId TEXT,
  senderType INTEGER,
  receiverId TEXT,
  receiverType INTEGER
);

CREATE INDEX IF NOT EXISTS TurnipTransaction_receiverId_idx ON TurnipTransaction (
  receiverId,
  receiverType
);

CREATE TABLE IF NOT EXISTS GuildTurnip (
  guildId TEXT,
  turnipId TEXT,
  harvestableAt INTEGER,
  harvestsRemaining INTEGER,
  planterId TEXT,
  plantedAt INTEGER,
  PRIMARY KEY (guildId, turnipId)
);
