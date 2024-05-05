import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import { QueryError } from '@/models/constants';
import GuildTurnipQueries from '@/models/queries/guild_turnip';
import { renderContent } from '@/utils/interactions';
import { assertNotNull } from '@/utils/types';

export async function handlePlant(
  { guild_id, member }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(member?.user?.id);

  const plantResult = await GuildTurnipQueries.plantTurnip(env.db, { guildId, userId });

  if (plantResult.isErr()) {
    if (plantResult.error.type === QueryError.NoTurnipsError) {
      return renderContent(
        'You have no turnips to plant. Try `/harvest`ing for some in this server.',
      );
    }

    return renderContent("Oops! I wasn't able to plant a turnip here. Try again later.");
  }

  const surveyResult = await GuildTurnipQueries.getSurveyGuild(env.db, { guildId, userId });

  if (surveyResult.isErr()) {
    return renderContent('You planted a turnip in this server!');
  }

  const { guildPlantedCount, userPlantedCount, remainingHarvestsCount } = surveyResult.value;
  return renderContent(
    `You planted a turnip in this server! There are ${guildPlantedCount} turnips in this server. You contributed ${userPlantedCount} turnips.`,
  );
}
