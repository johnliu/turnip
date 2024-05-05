import type { Bindings } from '@/constants';
import TurnipQueries from '@/models/queries/turnip';
import { renderContent } from '@/utils/interactions';
import { assertNotNull } from '@/utils/types';
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
  const turnipTotal = turnipCounts.reduce((total, { count }) => total + count, 0);

  if (turnipTotal === 0) {
    return renderContent(
      'You have no turnips :cry:.. `/forage` for some turnips or ask a friend to give you one.',
    );
  }

  if (turnipTotal === 1) {
    return renderContent('You have one turnip.');
  }

  return renderContent(`You have ${turnipTotal} turnips.`);
}
