import {
  type APIApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteractionData,
  type APIInteraction,
  type APIMessageApplicationCommandInteraction,
  type APIUserApplicationCommandInteraction,
  InteractionType,
} from 'discord-api-types/v10';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { first } from 'radash';

import handleFact from '@/interactions/fact';
import { handleGiveChatInput, handleGiveMessage, handleGiveUser } from '@/interactions/give';
import handlePing from '@/interactions/ping';
import { verifyKeyMiddleware } from '@/utils';

const app = new Hono();
app.use(logger());
app.use(verifyKeyMiddleware);

function handleCommand(body: APIApplicationCommandInteraction) {
  switch (body.data.name) {
    case 'turnip': {
      const data = body.data as APIChatInputApplicationCommandInteractionData;
      const subcommand = first(data.options ?? [])?.name;

      switch (subcommand) {
        case 'fact':
          return handleFact(data);
        case 'give':
          return handleGiveChatInput(body as APIChatInputApplicationCommandInteraction);
        default:
          throw new HTTPException(400);
      }
    }
    case 'Give Turnip to User':
      return handleGiveMessage(body as APIMessageApplicationCommandInteraction);
    case 'Give Turnip':
      return handleGiveUser(body as APIUserApplicationCommandInteraction);
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
