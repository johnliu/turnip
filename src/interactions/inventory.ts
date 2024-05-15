import TurnipQueries from '@/models/queries/turnip';
import type { HonoContext } from '@/utils/hono';
import { assertNotNull } from '@/utils/types';
import { renderInventory } from '@/views/inventory';
import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';

export async function handleInventory(
  context: HonoContext,
): Promise<APIInteractionResponseChannelMessageWithSource> {
  const userId = assertNotNull(context.var.user?.id);
  const turnipCounts = await TurnipQueries.getTurnipInventory(context.env.db, { userId });
  return renderInventory(userId, turnipCounts);
}
