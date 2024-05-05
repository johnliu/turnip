import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

import type { Bindings } from '@/constants';
import { QueryError } from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';
import { renderContent } from '@/utils/interactions';
import { assertNotNull } from '@/utils/types';

export async function handleForage(
  { member, user }: APIChatInputApplicationCommandInteraction,
  env: Bindings,
) {
  const userId = assertNotNull(member?.user?.id ?? user?.id);

  const result = await TurnipQueries.forageTurnips(env.db, { userId });

  if (result.isErr()) {
    if (result.error.type === QueryError.ForageOnCooldown) {
      return renderContent('You can only forage once a day! Try again tomorrow.');
    }

    return renderContent("Oops! I wasn't able to forage for you. Please try again later.");
  }

  return renderContent(`You foraged ${result.value.length} turnips!`);
}
