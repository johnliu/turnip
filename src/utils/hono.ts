import type { D1Database } from '@cloudflare/workers-types';
import type { APIUser } from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const verifyKeyMiddleware: MiddlewareHandler = async (c, next) => {
  const signature = c.req.header('X-Signature-Ed25519');
  const timestamp = c.req.header('X-Signature-Timestamp');
  let body = '';
  if (c.req.header('Content-Type') === 'application/json') {
    body = JSON.stringify(await c.req.json());
  }

  if (
    signature == null ||
    timestamp == null ||
    !verifyKey(body, signature, timestamp, c.env.DISCORD_PUBLIC_KEY)
  ) {
    throw new HTTPException(401);
  }

  await next();
};
export type Bindings = {
  db: D1Database;
  DISCORD_APPLICATION_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  KILLSWITCH: string;
};

export type Variables = {
  user: APIUser | undefined;
};

export type HonoContext = Context<{
  Bindings: Bindings;
  Variables: Variables;
}>;
