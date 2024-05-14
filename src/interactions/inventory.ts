import type { Bindings } from '@/constants';
import TurnipQueries from '@/models/queries/turnip';
import { assertNotNull } from '@/utils/types';
import { renderInventory } from '@/views/inventory';
import type {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponseChannelMessageWithSource,
} from 'discord-api-types/v10';

export async function handleInventory(
  { member, user }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
): Promise<APIInteractionResponseChannelMessageWithSource> {
  const userId = assertNotNull(member?.user.id ?? user?.id);

  const turnipCounts = await TurnipQueries.getTurnipInventory(env.db, { userId });
  return renderInventory(userId, turnipCounts);
}
