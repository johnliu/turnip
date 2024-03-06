import {
  type APIApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteractionData,
  type APIInteraction,
  type APIUserApplicationCommandInteraction,
  InteractionType,
} from 'discord-api-types/v10';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import handleFact from '@/interactions/fact';
import handleGive from '@/interactions/give';
import handlePing from '@/interactions/ping';
import { verifyKeyMiddleware } from '@/utils';

const app = new Hono();
app.use('/', verifyKeyMiddleware);

function handleCommand(body: APIApplicationCommandInteraction) {
  const { data } = body;

  switch (data.name) {
    case 'turnip-facts':
      return handleFact(data as APIChatInputApplicationCommandInteractionData);
    case 'Give Turnip':
      return handleGive(body as APIUserApplicationCommandInteraction);
    default:
      throw new HTTPException(400);
  }
}

function handleInteraction(body: APIInteraction) {
  const { type } = body;

  switch (type) {
    case InteractionType.Ping:
      return handlePing();
    case InteractionType.ApplicationCommand:
      return handleCommand(body);
    default:
      throw new HTTPException(400);
  }
}

app.post('/', async (c) => {
  return c.json(handleInteraction(await c.req.json()));
});

export default app;
