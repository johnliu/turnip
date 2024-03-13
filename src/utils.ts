import { verifyKey } from 'discord-interactions';
import { HTTPException } from 'hono/mod.ts';
import { MiddlewareHandler } from 'hono/types.ts';

export const verifyKeyMiddleware: MiddlewareHandler = async (c, next) => {
  const signature = c.req.header('X-Signature-Ed25519');
  const timestamp = c.req.header('X-Signature-Timestamp');
  let body = '';
  if (c.req.header('Content-Type') === 'application/json') {
    body = JSON.stringify(await c.req.json());
  }

  if (signature == null || timestamp == null || !verifyKey(body, signature, timestamp, c.env.DISCORD_PUBLIC_KEY)) {
    throw new HTTPException(401);
  }

  await next();
};

export function assertNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error('Unexpected null-ish value.');
  }
  return value;
}

export function first<T>(array: T[] | null | undefined): T | undefined {
  return array != null && array.length > 0 ? array[0] : undefined;
}
