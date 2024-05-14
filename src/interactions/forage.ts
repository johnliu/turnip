import { ForageOnCooldownError } from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';
import type { HonoContext } from '@/utils/hono';
import { assertNotNull } from '@/utils/types';
import { renderError, renderForage, renderForageOnCooldown } from '@/views/forage';

export async function handleForage(context: HonoContext) {
  const userId = assertNotNull(context.var.user?.id);
  const result = await TurnipQueries.forageTurnips(context.env.db, { userId });

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
