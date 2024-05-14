declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ENV: 'production' | 'staging' | null;
      DEVBOX_PROJECT_ROOT: string;
      DISCORD_APPLICATION_ID: string;
      DISCORD_PUBLIC_KEY: string;
      DISCORD_BOT_TOKEN: string;
      KILLSWITCH: string;
    }
  }
}

declare module '*.png';
declare module '*.jpg';

export type {};
