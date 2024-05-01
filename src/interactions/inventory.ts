import type { Bindings } from '@/constants';
import { MAX_COUNTABLE_TURNIPS, UserTurnipQueries } from '@/models/deprecated_turnips';
import { assertNotNull } from '@/utils/types';
import {
  type APIChatInputApplicationCommandInteraction,
  type APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
} from 'discord-api-types/v10';

export async function handleInventory(
  { member, user }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
): Promise<APIInteractionResponseChannelMessageWithSource> {
  const userId = assertNotNull(member?.user.id ?? user?.id);
  const turnips = await UserTurnipQueries.getTurnips(env.db, userId);

  let content = null;
  if (turnips == null) {
    content = "We couldn't get your turnips. Yikes.. hope they're still there!";
  } else if (turnips.length === 0) {
    content = "You have no turnips :cry:, give some turnips and maybe you'll get some back.";
  } else if (turnips.length === 1) {
    content = 'You have one turnip.';
  } else if (turnips.length >= MAX_COUNTABLE_TURNIPS) {
    content = "You have 999+ turnips! That's a lot of turnips.";
  } else {
    content = `You have ${turnips.length} turnips.`;
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
    },
  };
}
