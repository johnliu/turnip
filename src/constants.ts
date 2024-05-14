import type { D1Database } from '@cloudflare/workers-types';

export enum ApplicationIntegrationType {
  GuildInstall = 0,
  UserInstall = 1,
}

export enum InteractionContextType {
  Guild = 0,
  BotDM = 1,
  PrivateChannel = 2,
}

export type Bindings = {
  db: D1Database;
  DISCORD_APPLICATION_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  KILLSWITCH: string;
};
