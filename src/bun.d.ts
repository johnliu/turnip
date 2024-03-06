declare module 'bun' {
  interface Env {
    ENV: string;
    PGDATA: string;
    PORT: number;
    APPLICATION_ID: string;
    BOT_TOKEN: string;
    BOT_PUBLIC_KEY: string;
  }
}
