import {
  type APIChatInputApplicationCommandInteraction,
  InteractionResponseType,
  MessageFlags,
} from 'discord-api-types/v10';
import humanizeDuration from 'humanize-duration';

import type { Bindings } from '@/constants';
import { GuildTurnipQueries, HARVEST_TIME } from '@/models/deprecated_turnips';
import { assertNotNull } from '@/utils/types';

export async function handlePlant({ guild_id, member }: APIChatInputApplicationCommandInteraction, env: Bindings) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(member?.user?.id);
  const success = await GuildTurnipQueries.plantTurnip(env.db, guildId, userId);

  let content = null;
  let flags = 0;
  if (success) {
    const { userTotal, guildTotal } = await GuildTurnipQueries.surveyTurnips(env.db, guildId, userId);
    content = `You planted a turnip in this server! There are ${guildTotal} turnips in this server. You contributed ${userTotal} turnips.`;
  } else {
    const lastTurnip = assertNotNull(await GuildTurnipQueries.lastPlanted(env.db, guildId, userId));

    const remainingDuration = lastTurnip.planted_at_ms + HARVEST_TIME - new Date().getTime();
    console.log(remainingDuration);
    const durationString =
      remainingDuration > 1000 * 60 ? humanizeDuration(remainingDuration, { units: ['h', 'm'], round: true }) : 'a bit';
    content = `You planted a turnip too recently! Try again in ${durationString}.`;
    flags = MessageFlags.Ephemeral;
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
      flags,
    },
  };
}
