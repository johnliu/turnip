import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import { ForageOnCooldownError } from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';
import { assertNotNull } from '@/utils/types';
import { renderError, renderForage, renderForageOnCooldown } from '@/views/forage';

export async function handleForage(
  { member, user }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const userId = assertNotNull(member?.user?.id ?? user?.id);

  const result = await TurnipQueries.forageTurnips(env.db, { userId });

  return result.match(
    (turnips) => renderForage(userId, turnips.length),
    (error) => {
      if (error instanceof ForageOnCooldownError) {
        return renderForageOnCooldown(userId, error.remainingCooldown);
      }

      return renderError();
    },
  );
}
