import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import GuildTurnipQueries from '@/models/queries/guild-turnip';
import { assertNotNull } from '@/utils/types';
import { renderError, renderSurvey } from '@/views/survey';

export async function handleSurvey(
  { guild_id, member }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(member?.user?.id);

  const surveyResult = await GuildTurnipQueries.getSurveyGuild(env.db, { guildId, userId });
  return surveyResult.match(
    (surveyCount) => renderSurvey(surveyCount),
    (error) => renderError(),
  );
}
