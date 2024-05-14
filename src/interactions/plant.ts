import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import { QueryError } from '@/models/constants';
import GuildTurnipQueries from '@/models/queries/guild-turnip';
import { assertNotNull } from '@/utils/types';
import { renderError, renderNoTurnips, renderPlant } from '@/views/plant';

export async function handlePlant(
  { guild_id, member }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const guildId = assertNotNull(guild_id);
  const userId = assertNotNull(member?.user?.id);

  const plantResult = await GuildTurnipQueries.plantTurnip(env.db, { guildId, userId });
  const surveyResult = (await GuildTurnipQueries.getSurveyGuild(env.db, { guildId, userId })).match(
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
