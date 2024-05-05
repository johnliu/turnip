import { verifyKey } from 'discord-interactions';
import type { MiddlewareHandler } from 'hono';
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
