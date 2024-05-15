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

import { handleDebugMessage } from '@/interactions/debug';
import { handleFact } from '@/interactions/fact';
import { handleForage } from '@/interactions/forage';
import { handleGiveChatInput, handleGiveMessage, handleGiveUser } from '@/interactions/give';
import { handleHarvest } from '@/interactions/harvest';
import { handleInventory } from '@/interactions/inventory';
import { handlePatchNotes, injectPatchNotes } from '@/interactions/patch-notes';
import { handlePing } from '@/interactions/ping';
import { handlePlant } from '@/interactions/plant';
import { handleSurvey } from '@/interactions/survey';
import { verifyKeyMiddleware } from '@/utils/hono';
import type { Bindings, HonoContext, Variables } from '@/utils/hono';
import { renderOffline } from '@/views/offline';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
app.use(verifyKeyMiddleware);

async function handleCommand(body: APIApplicationCommandInteraction, context: HonoContext) {
  context.set('user', body.member?.user ?? body.user);

  switch (body.data.name) {
    case 'fact':
      return await handleFact();
    case 'patch-notes':
      return await handlePatchNotes();
    case 'survey':
      return await injectPatchNotes(
        handleSurvey(body as APIChatInputApplicationCommandInteraction, context),
        context,
      );
    case 'plant':
      return await injectPatchNotes(
        handlePlant(body as APIChatInputApplicationCommandInteraction, context),
        context,
      );
    case 'harvest':
      return await injectPatchNotes(
        handleHarvest(body as APIChatInputApplicationCommandInteraction, context),
        context,
      );
    case 'forage':
      return await injectPatchNotes(handleForage(context), context);
    case 'inventory':
      return await injectPatchNotes(handleInventory(context), context);
    case 'give':
      return await injectPatchNotes(
        handleGiveChatInput(body as APIChatInputApplicationCommandInteraction, context),
        context,
      );
    case 'Give Turnip to User':
      return await injectPatchNotes(
        handleGiveMessage(body as APIMessageApplicationCommandInteraction, context),
        context,
      );
    case 'Give Turnip':
      return await injectPatchNotes(
        handleGiveUser(body as APIUserApplicationCommandInteraction, context),
        context,
      );
    case 'Debug Message':
      return await handleDebugMessage(body as APIMessageApplicationCommandInteraction, context);
    default:
      throw new HTTPException(400);
  }
}

async function handleInteraction(body: APIInteraction, context: HonoContext) {
  const { type } = body;

  switch (type) {
    case InteractionType.Ping:
      return handlePing();
    case InteractionType.ApplicationCommand:
      if (context.env.KILLSWITCH === 'true') {
        return renderOffline();
      }

      return await handleCommand(body, context);
    default:
      throw new HTTPException(400);
  }
}

app.post('/', async (c) => {
  return c.json(await handleInteraction(await c.req.json(), c));
});

export default app;
