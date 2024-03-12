import { createFactory } from 'hono/helper.ts';
import { HTTPException } from 'hono/mod.ts';
import { verifyKey } from 'npm:discord-interactions';

const factory = createFactory();

const verifyKeyMiddleware = factory.createMiddleware(async (c, next) => {
  const signature = c.req.header('X-Signature-Ed25519');
  const timestamp = c.req.header('X-Signature-Timestamp');
  let body = '';
  if (c.req.header('Content-Type') === 'application/json') {
    body = JSON.stringify(await c.req.json());
  }

  const publicKey = assertNotNull(Deno.env.get('BOT_PUBLIC_KEY'));
  if (signature == null || timestamp == null || !verifyKey(body, signature, timestamp, publicKey)) {
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
