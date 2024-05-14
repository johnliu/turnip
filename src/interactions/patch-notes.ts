import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';

import { getUserSettings, saveUserSettings } from '@/models/queries/user-settings';
import type { HonoContext } from '@/utils/hono';
import { injectPatchShort, renderPatchNotes } from '@/views/patch-notes';

const CURRENT_PATCH_VERSION = 1;

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
    return injectPatchShort(await response);
  }

  return await response;
}
