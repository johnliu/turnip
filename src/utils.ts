import { verifyKey } from 'discord-interactions';
import { createFactory } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

const factory = createFactory();

const verifyKeyMiddleware = factory.createMiddleware(async (c, next) => {
  const signature = c.req.header('X-Signature-Ed25519');
  const timestamp = c.req.header('X-Signature-Timestamp');
  let body = '';
  if (c.req.header('Content-Type') === 'application/json') {
    body = JSON.stringify(await c.req.json());
  }

  if (signature == null || timestamp == null || !verifyKey(body, signature, timestamp, Bun.env.BOT_PUBLIC_KEY)) {
    throw new HTTPException(401);
  }

  await next();
});

export function assertNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error('Unexpected null-ish value.');
  }
  return value;
}

export { verifyKeyMiddleware };
