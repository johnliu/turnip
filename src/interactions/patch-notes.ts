import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';

import { getUserSettings, saveUserSettings } from '@/models/queries/user-settings';
import type { HonoContext } from '@/utils/hono';
import { injectPatchShort, renderPatchNotes } from '@/views/patch-notes';

const CURRENT_PATCH_VERSION = 2;

export function handlePatchNotes(): APIInteractionResponseChannelMessageWithSource {
  return renderPatchNotes();
}

export async function injectPatchNotes(
  response: Promise<APIInteractionResponseChannelMessageWithSource>,
  context: HonoContext,
) {
  const userId = context.var.user?.id;
  if (userId == null) {
    return await response;
  }

  const settings = await getUserSettings(context.env.db, userId);
  if (settings.patchVersion < CURRENT_PATCH_VERSION) {
    await saveUserSettings(context.env.db, {
      ...settings,
      patchVersion: CURRENT_PATCH_VERSION,
    });

    // Verison 0 is a new player so don't notify them.
    if (settings.patchVersion !== 0) {
      return injectPatchShort(await response);
    }
  }

  return await response;
}
