import {
  type APIApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteractionData,
  type APIInteraction,
  type APIMessageApplicationCommandInteraction,
  type APIUserApplicationCommandInteraction,
  InteractionType,
} from 'discord-api-types';
import { Hono, HTTPException } from 'hono/mod.ts';

import { Bindings } from '@/constants.ts';
import handleFact from '@/interactions/fact.ts';
import { handleGiveChatInput, handleGiveMessage, handleGiveUser } from '@/interactions/give.ts';
import { handleInventory } from '@/interactions/inventory.ts';
import handlePing from '@/interactions/ping.ts';
import { first, verifyKeyMiddleware } from '@/utils.ts';

const app = new Hono<{ Bindings: Bindings }>();
app.use(verifyKeyMiddleware);

async function handleCommand(body: APIApplicationCommandInteraction, env: Bindings) {
  switch (body.data.name) {
    case 'turnip': {
      const data = body.data as APIChatInputApplicationCommandInteractionData;
      const subcommand = first(data.options)?.name;

      switch (subcommand) {
        case 'fact':
          return handleFact(data);
        case 'give':
          return await handleGiveChatInput(body as APIChatInputApplicationCommandInteraction, env);
        default:
          throw new HTTPException(400);
      }
    }
    case 'inventory':
      return await handleInventory(body as APIChatInputApplicationCommandInteraction, env);
    case 'Give Turnip to User':
      return await handleGiveMessage(body as APIMessageApplicationCommandInteraction, env);
    case 'Give Turnip':
      return await handleGiveUser(body as APIUserApplicationCommandInteraction, env);
    default:
      throw new HTTPException(400);
  }
}

async function handleInteraction(body: APIInteraction, env: Bindings) {
  const { type } = body;

  switch (type) {
    case InteractionType.Ping:
      return handlePing();
    case InteractionType.ApplicationCommand:
      return await handleCommand(body, env);
    default:
      throw new HTTPException(400);
  }
}

app.post('/', async (c) => {
  return c.json(await handleInteraction(await c.req.json(), c.env));
});

export default app;
