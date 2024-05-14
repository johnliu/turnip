import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import { HarvestOnCooldownError, QueryError } from '@/models/constants';
import GuildTurnipQueries from '@/models/queries/guild-turnip';
import type { HonoContext } from '@/utils/hono';
import { assertNotNull } from '@/utils/types';
import {
  renderError,
  renderHarvest,
  renderHarvestOnCooldown,
  renderNoTurnips,
} from '@/views/harvest';

export async function handleHarvest(
  { guild_id }: APIChatInputApplicationCommandInteraction,
  context: HonoContext,
) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(context.var.user?.id);

  const harvestResults = await GuildTurnipQueries.harvestTurnips(context.env.db, {
    guildId,
    userId,
  });
  const surveyResult = (
    await GuildTurnipQueries.getSurveyGuild(context.env.db, { guildId, userId })
  ).match(
    (result) => result,
    (_) => null,
  );

  return harvestResults.match(
    ({ harvestedTurnips }) => renderHarvest(userId, harvestedTurnips.length, surveyResult),
    (error) => {
      if (error instanceof HarvestOnCooldownError) {
        return renderHarvestOnCooldown(userId, surveyResult, error.remainingCooldown);
      }

      if (error.type === QueryError.NoTurnipsError) {
        return renderNoTurnips(userId, surveyResult);
      }

      return renderError();
    },
  );
}
