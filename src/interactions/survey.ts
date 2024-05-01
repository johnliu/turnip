import { type APIChatInputApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import { GuildTurnipQueries } from '@/models/deprecated_turnips';
import { assertNotNull } from '@/utils/types';

export async function handleSurvey({ guild_id, member }: APIChatInputApplicationCommandInteraction, env: Bindings) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(member?.user?.id);
  const { userTotal, guildTotal } = await GuildTurnipQueries.surveyTurnips(env.db, guildId, userId);

  let content = null;
  if (guildTotal === 0) {
    content = 'There are no turnips in this server yet! You should plant some.';
  } else {
    let userContribution = '';
    if (userTotal === guildTotal) {
      userContribution = 'You planted all the turnips!';
    } else if (userTotal / guildTotal > 0.5) {
      userContribution = 'You planted most of the turnips in this server.';
    } else if (userTotal !== 0) {
      userContribution = `${userTotal} turnips were planted by you!`;
    }
    content = `There's ${guildTotal} turnips in this server. ${userContribution}`;
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
    },
  };
}
