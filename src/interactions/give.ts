import {
  type APIApplicationCommandInteractionDataUserOption,
  type APIChatInputApplicationCommandInteraction,
  type APIInteractionResponseChannelMessageWithSource,
  type APIMessageApplicationCommandInteraction,
  type APIUserApplicationCommandInteraction,
  InteractionResponseType,
} from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import { UserTurnipQueries } from '@/models/turnips';
import { assertNotNull, first } from '@/utils';

async function handleGive(
  env: Bindings,
  senderId: string,
  receiverId: string,
): Promise<APIInteractionResponseChannelMessageWithSource> {
  let content = null;
  if (receiverId === env.DISCORD_APPLICATION_ID) {
    content = `Aw thanks <@${senderId}>, but you can't give this turnip back to me.`;
  } else if (receiverId === senderId) {
    content = `Silly <@${senderId}>, you can't give a turnip to yourself!`;
  } else if (await UserTurnipQueries.giveTurnip(env.db, senderId, receiverId)) {
    content = `<@${senderId}> gave a turnip to you <@${receiverId}>`;
  } else {
    content = `Sorry <@${senderId}>, looks like I didn't have any turnips in stock to give. Try again later.`;
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
    },
  };
}

export async function handleGiveChatInput(
  { data, member, user }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const senderId = assertNotNull(member?.user.id ?? user?.id);

  const receiver = first(data.options) as APIApplicationCommandInteractionDataUserOption | undefined;
  const receiverId = assertNotNull(receiver?.value);

  return await handleGive(env, senderId, receiverId);
}

export async function handleGiveMessage(
  { data, member, user }: APIMessageApplicationCommandInteraction,
  env: Bindings,
) {
  const senderId = assertNotNull(member?.user.id ?? user?.id);
  const receiverId = data.resolved.messages[data.target_id].author.id;

  return await handleGive(env, senderId, receiverId);
}

export async function handleGiveUser({ data, member, user }: APIUserApplicationCommandInteraction, env: Bindings) {
  const senderId = assertNotNull(member?.user.id ?? user?.id);
  const receiverId = data.target_id;

  return await handleGive(env, senderId, receiverId);
}
