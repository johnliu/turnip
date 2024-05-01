import {
  type APIApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIInteraction,
  type APIMessageApplicationCommandInteraction,
  type APIUserApplicationCommandInteraction,
  InteractionType,
} from 'discord-api-types/v10';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Bindings } from '@/constants';
import handleFact from '@/interactions/fact';
import { handleGiveChatInput, handleGiveMessage, handleGiveUser } from '@/interactions/give';
import { handleInventory } from '@/interactions/inventory';
import { handlePing } from '@/interactions/ping';
import { handlePlant } from '@/interactions/plant';
import { handleSurvey } from '@/interactions/survey';
import { verifyKeyMiddleware } from '@/utils/hono';

const app = new Hono<{ Bindings: Bindings }>();
app.use(verifyKeyMiddleware);

async function handleCommand(body: APIApplicationCommandInteraction, env: Bindings) {
  switch (body.data.name) {
    case 'fact':
      return await handleFact();
    case 'survey':
      return await handleSurvey(body as APIChatInputApplicationCommandInteraction, env);
    case 'plant':
      return await handlePlant(body as APIChatInputApplicationCommandInteraction, env);
    case 'inventory':
      return await handleInventory(body as APIChatInputApplicationCommandInteraction, env);
    case 'give':
      return await handleGiveChatInput(body as APIChatInputApplicationCommandInteraction, env);
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
