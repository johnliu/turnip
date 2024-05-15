import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import GuildTurnipQueries from '@/models/queries/guild-turnip';
import type { HonoContext } from '@/utils/hono';
import { assertNotNull } from '@/utils/types';
import { renderError, renderSurvey } from '@/views/survey';

export async function handleSurvey(
  { guild_id }: APIChatInputApplicationCommandInteraction,
  context: HonoContext,
) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(context.var.user?.id);

  const surveyResult = await GuildTurnipQueries.getSurveyGuild(context.env.db, { guildId, userId });
  return surveyResult.match(
    (surveyCount) => renderSurvey(surveyCount),
    (_) => renderError(),
  );
}
