declare module 'cloudflare:test' {
  interface ProvidedEnv extends Env {
    db: D1Database;
    TEST_MIGRATIONS: D1Migration[];
  }
}
