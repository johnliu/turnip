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
import { renderContent } from '@/utils/interactions';
import { assertNotNull } from '@/utils/types';
import { renderError, renderGiveBack, renderGiveSelf, renderNoTurnips } from '@/views/give';

async function handleGive(
  env: Bindings,
  senderId: string,
  receiverId: string,
): Promise<APIInteractionResponseChannelMessageWithSource> {
  return renderGiveBack(senderId, receiverId);
  // if (receiverId === env.DISCORD_APPLICATION_ID) {
  //   return renderContent(`Aw thanks <@${senderId}>, but you can't give this turnip back to me.`);
  // }

  // if (receiverId === senderId) {
  //   return renderContent(`Silly <@${senderId}>, you can't give a turnip to yourself!`);
  // }

  // const result = await TurnipQueries.giveTurnip(env.db, { senderId, receiverId });
  // if (result.isOk()) {
  //   return renderContent(`<@${senderId}> gave a turnip to you <@${receiverId}>`);
  // }

  // if (result.error.type === QueryError.NoTurnipsError) {
  //   return renderContent(
  //     `Woops, silly <@${senderId}>! You don't have any turnips to give. Try to \`/forage\` for some turnips.`,
  //   );
  // }

  // return renderContent(
  //   `Sorry <@${senderId}>, looks like I wasn't able to give your turnip right now. Try again later.`,
  // );
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
