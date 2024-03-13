import { D1Database } from 'cloudflare/worker-types';

export enum ApplicationIntegrationType {
  GuildInstall = 0,
  UserInstall = 1,
}

export enum IntegrationContextType {
  Guild = 0,
  BotDM = 1,
  PrivateChannel = 2,
}

export type Bindings = {
  db: D1Database;
  DISCORD_APPLICATION_ID: string;
  DISCORD_PUBLIC_KEY: string;
};
