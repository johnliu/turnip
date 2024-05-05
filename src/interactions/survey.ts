import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import GuildTurnipQueries from '@/models/queries/guild_turnip';
import { renderContent } from '@/utils/interactions';
import { assertNotNull } from '@/utils/types';

export async function handleSurvey(
  { guild_id, member }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(member?.user?.id);

  const surveyResult = await GuildTurnipQueries.getSurveyGuild(env.db, { guildId, userId });
  if (surveyResult.isErr()) {
    return renderContent("Oops. I couldn't survey this server. Try again later.");
  }

  const { guildPlantedCount, userPlantedCount, remainingHarvestsCount } = surveyResult.value;

  if (guildPlantedCount === 0) {
    return renderContent('There are no turnips in this server yet! You should plant some.');
  }

  let userContribution = '';
  if (userPlantedCount === guildPlantedCount) {
    userContribution = 'You planted all the turnips in the server. Get your friends to help!';
  } else if (userPlantedCount / guildPlantedCount > 0.5) {
    userContribution = `You planted ${userPlantedCount} turnips. That's most of the turnips in the server!`;
  } else {
    userContribution = `You planted ${userPlantedCount} turnips.`;
  }

  let harvestableTurnips = '';
  if (remainingHarvestsCount === 0) {
    harvestableTurnips = 'There are no more harvestable turnips in this server. Plant some more!';
  } else {
    harvestableTurnips = `${remainingHarvestsCount} turnips are ready for harvesting!`;
  }

  return renderContent(
    `${guildPlantedCount} turnips planted in the server. ${userContribution} \n\n${harvestableTurnips}`,
  );
}
