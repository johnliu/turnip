import type {
  APIApplicationCommandInteractionDataUserOption,
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponseChannelMessageWithSource,
  APIMessageApplicationCommandInteraction,
  APIUserApplicationCommandInteraction,
} from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import { QueryError } from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';
import { first } from '@/utils/arrays';
import { assertNotNull } from '@/utils/types';
import {
  renderError,
  renderGive,
  renderGiveBack,
  renderGiveSelf,
  renderNoTurnips,
} from '@/views/give';

async function handleGive(
  env: Bindings,
  senderId: string,
  receiverId: string,
): Promise<APIInteractionResponseChannelMessageWithSource> {
  if (receiverId === env.DISCORD_APPLICATION_ID) {
    return renderGiveBack(senderId, env.DISCORD_APPLICATION_ID);
  }

  if (receiverId === senderId) {
    return renderGiveSelf(senderId);
  }

  return (await TurnipQueries.giveTurnip(env.db, { senderId, receiverId })).match(
    (_turnip) => renderGive(senderId, receiverId),
    (error) => {
      if (error.type === QueryError.NoTurnipsError) {
        return renderNoTurnips(senderId, receiverId);
      }
      return renderError();
    },
  );
}

export async function handleGiveChatInput(
  { data, member, user }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const senderId = assertNotNull(member?.user.id ?? user?.id);

  const receiver = first(data.options) as
    | APIApplicationCommandInteractionDataUserOption
    | undefined;
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

export async function handleGiveUser(
  { data, member, user }: APIUserApplicationCommandInteraction,
  env: Bindings,
) {
  const senderId = assertNotNull(member?.user.id ?? user?.id);
  const receiverId = data.target_id;

  return await handleGive(env, senderId, receiverId);
}
