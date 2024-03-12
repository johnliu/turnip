import {
  type APIApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteractionData,
  type APIInteraction,
  type APIMessageApplicationCommandInteraction,
  type APIUserApplicationCommandInteraction,
  InteractionType,
} from 'discord-api-types';
import { logger } from 'hono/middleware.ts';
import { Hono, HTTPException } from 'hono/mod.ts';
import { first } from 'npm:radash';

import handleFact from '@/interactions/fact.ts';
import { handleGiveChatInput, handleGiveMessage, handleGiveUser } from '@/interactions/give.ts';
import handlePing from '@/interactions/ping.ts';
import { verifyKeyMiddleware } from '@/utils.ts';

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

Deno.serve({ port: parseInt(Deno.env.get('PORT') ?? '3000') }, app.fetch);
