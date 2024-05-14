import type {
  APIApplicationCommandInteractionDataUserOption,
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponseChannelMessageWithSource,
  APIMessageApplicationCommandInteraction,
  APIUserApplicationCommandInteraction,
} from 'discord-api-types/v10';

import { QueryError } from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';
import { first } from '@/utils/arrays';
import type { HonoContext } from '@/utils/hono';
import { assertNotNull } from '@/utils/types';
import {
  renderError,
  renderGive,
  renderGiveBack,
  renderGiveSelf,
  renderNoTurnips,
} from '@/views/give';

async function handleGive(
  context: HonoContext,
  senderId: string,
  receiverId: string,
): Promise<APIInteractionResponseChannelMessageWithSource> {
  if (receiverId === context.env.DISCORD_APPLICATION_ID) {
    return renderGiveBack(senderId, context.env.DISCORD_APPLICATION_ID);
  }

  if (receiverId === senderId) {
    return renderGiveSelf(senderId);
  }

  return (await TurnipQueries.giveTurnip(context.env.db, { senderId, receiverId })).match(
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
  { data }: APIChatInputApplicationCommandInteraction,
  context: HonoContext,
) {
  const senderId = assertNotNull(context.var.user?.id);
  const receiver = first(data.options) as
    | APIApplicationCommandInteractionDataUserOption
    | undefined;
  const receiverId = assertNotNull(receiver?.value);

  return await handleGive(context, senderId, receiverId);
}

export async function handleGiveMessage(
  { data }: APIMessageApplicationCommandInteraction,
  context: HonoContext,
) {
  const senderId = assertNotNull(context.var.user?.id);
  const receiverId = data.resolved.messages[data.target_id].author.id;

  return await handleGive(context, senderId, receiverId);
}

export async function handleGiveUser(
  { data }: APIUserApplicationCommandInteraction,
  context: HonoContext,
) {
  const senderId = assertNotNull(context.var.user?.id);
  const receiverId = data.target_id;

  return await handleGive(context, senderId, receiverId);
}
