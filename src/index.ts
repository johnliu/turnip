import {
  type APIApplicationCommandInteraction,
  type APIChatInputApplicationCommandInteraction,
  type APIInteraction,
  type APIMessageApplicationCommandInteraction,
  type APIUserApplicationCommandInteraction,
  InteractionType,
} from 'discord-api-types/v10';
import { type Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Bindings } from '@/constants';
import { handleDebugMessage } from '@/interactions/debug';
import handleFact from '@/interactions/fact';
import { handleForage } from '@/interactions/forage';
import { handleGiveChatInput, handleGiveMessage, handleGiveUser } from '@/interactions/give';
import { handleHarvest } from '@/interactions/harvest';
import { handleInventory } from '@/interactions/inventory';
import { handlePing } from '@/interactions/ping';
import { handlePlant } from '@/interactions/plant';
import { handleSurvey } from '@/interactions/survey';
import { verifyKeyMiddleware } from '@/utils/hono';
import { renderOffline } from '@/views/offline';

const app = new Hono<{ Bindings: Bindings }>();
app.use(verifyKeyMiddleware);

async function handleCommand(
  body: APIApplicationCommandInteraction,
  c: Context<{ Bindings: Bindings }>,
) {
  if (c.env.KILLSWITCH === 'true') {
    return renderOffline();
  }

  switch (body.data.name) {
    case 'fact':
      return await handleFact();
    case 'survey':
      return await handleSurvey(body as APIChatInputApplicationCommandInteraction, c.env);
    case 'plant':
      return await handlePlant(body as APIChatInputApplicationCommandInteraction, c.env);
    case 'harvest':
      return await handleHarvest(body as APIChatInputApplicationCommandInteraction, c.env);
    case 'forage':
      return await handleForage(body as APIChatInputApplicationCommandInteraction, c.env);
    case 'inventory':
      return await handleInventory(body as APIChatInputApplicationCommandInteraction, c.env);
    case 'give':
      return await handleGiveChatInput(body as APIChatInputApplicationCommandInteraction, c.env);
    case 'Give Turnip to User':
      return await handleGiveMessage(body as APIMessageApplicationCommandInteraction, c.env);
    case 'Give Turnip':
      return await handleGiveUser(body as APIUserApplicationCommandInteraction, c.env);
    case 'Debug Message':
      return await handleDebugMessage(body as APIMessageApplicationCommandInteraction, c);
    default:
      throw new HTTPException(400);
  }
}

async function handleInteraction(body: APIInteraction, env: Context<{ Bindings: Bindings }>) {
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
  return c.json(await handleInteraction(await c.req.json(), c));
});

export default app;
