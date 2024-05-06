import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import { QueryError } from '@/models/constants';
import GuildTurnipQueries from '@/models/queries/guild-turnip';
import { renderContent } from '@/utils/interactions';
import { assertNotNull } from '@/utils/types';

export async function handleHarvest(
  { guild_id, member }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(member?.user?.id);

  const harvestResults = await GuildTurnipQueries.harvestTurnips(env.db, { guildId, userId });
  const surveyResult = await GuildTurnipQueries.getSurveyGuild(env.db, { guildId, userId });

  if (harvestResults.isErr()) {
    if (harvestResults.error.type === QueryError.NoTurnipsError) {
      return renderContent('There are no turnips to harvest in this server.');
    }

    if (harvestResults.error.type === QueryError.HarvestOnCooldown) {
      return renderContent("You're trying to harvest too quickly! Save some turnips for others!");
    }

    return renderContent("Oops! I wasn't able to harvest a turnip here. Try again later.");
  }

  if (surveyResult.isErr()) {
    return renderContent(`You harvested ${harvestResults.value.harvestedTurnips.length} turnips!`);
  }

  const { remainingHarvestsCount } = surveyResult.value;
  return renderContent(
    `You harvested ${harvestResults.value.harvestedTurnips.length} turnips! There are ${remainingHarvestsCount} harvestable turnips remaining.`,
  );
}
