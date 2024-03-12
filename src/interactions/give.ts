import {
  type APIApplicationCommandInteractionDataSubcommandOption,
  type APIApplicationCommandInteractionDataUserOption,
  type APIChatInputApplicationCommandInteraction,
  type APIInteractionResponseChannelMessageWithSource,
  type APIMessageApplicationCommandInteraction,
  type APIUserApplicationCommandInteraction,
  InteractionResponseType,
} from 'discord-api-types';
import { first } from 'npm:radash';

import { assertNotNull } from '@/utils.ts';

function handleGive(senderId: string, receiverId: string): APIInteractionResponseChannelMessageWithSource {
  const content = (() => {
    switch (receiverId) {
      case Deno.env.get('APPLICATION_ID'):
        return `Aw thanks <@${senderId}>, but you can't give this turnip back to me.`;
      case senderId:
        return `Silly <@${senderId}>, you can't give a turnip to yourself!`;
      default:
        return `<@${senderId}> gave a turnip to you <@${receiverId}>`;
    }
  })();

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
    },
  };
}

export function handleGiveChatInput({ data, member, user }: APIChatInputApplicationCommandInteraction) {
  const senderId = assertNotNull(member?.user.id ?? user?.id);

  const subcommand = first(data.options ?? []) as APIApplicationCommandInteractionDataSubcommandOption | undefined;
  const receiver = first(subcommand?.options ?? []) as APIApplicationCommandInteractionDataUserOption | undefined;
  const receiverId = assertNotNull(receiver?.value);

  return handleGive(senderId, receiverId);
}

export function handleGiveMessage({ data, member, user }: APIMessageApplicationCommandInteraction) {
  const senderId = assertNotNull(member?.user.id ?? user?.id);
  const receiverId = data.resolved.messages[data.target_id].author.id;

  return handleGive(senderId, receiverId);
}

export function handleGiveUser({ data, member, user }: APIUserApplicationCommandInteraction) {
  const senderId = assertNotNull(member?.user.id ?? user?.id);
  const receiverId = data.target_id;
  return handleGive(senderId, receiverId);
}
