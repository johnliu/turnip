import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import { QueryError } from '@/models/constants';
import GuildTurnipQueries from '@/models/queries/guild-turnip';
import type { HonoContext } from '@/utils/hono';
import { assertNotNull } from '@/utils/types';
import { renderError, renderNoTurnips, renderPlant } from '@/views/plant';

export async function handlePlant(
  { guild_id }: APIChatInputApplicationCommandInteraction,
  context: HonoContext,
) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(context.var.user?.id);

  const plantResult = await GuildTurnipQueries.plantTurnip(context.env.db, { guildId, userId });
  const surveyResult = (
    await GuildTurnipQueries.getSurveyGuild(context.env.db, { guildId, userId })
  ).match(
    (result) => result,
    (_) => null,
  );

  return plantResult.match(
    () => renderPlant(userId, surveyResult),
    (error) => {
      if (error.type === QueryError.NoTurnipsError) {
        return renderNoTurnips(userId);
      }
      return renderError();
    },
  );
}
