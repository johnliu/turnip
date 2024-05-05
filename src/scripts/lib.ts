import { env } from 'node:process';
import { inspect } from 'node:util';
import { RouteBases } from 'discord-api-types/v10';

export async function request<T>({
  method,
  path,
  body,
}: { method: string; path: string; body: T }) {
  const req = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    },
    body,
  };

  console.log('Request:', inspect(body, undefined, null));
  const res = await fetch(RouteBases.api + path, {
    ...req,
    body: JSON.stringify(req.body),
  });
  console.log('Response:', inspect({ body: await res.json() }, undefined, null));
}
