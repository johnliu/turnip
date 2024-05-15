import dedent from 'dedent';
import { type Result, err, ok } from 'neverthrow';

import type { UserSettings } from '@/models/user-settings';
import { getOne } from '@/utils/d1';
import { MissingResultError } from '../constants';

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id'> = {
  patchVersion: 0,
};

type SerializedUserSettings = {
  id: string;
  settings: string;
};

export async function getUserSettings(db: D1Database, userId: string): Promise<UserSettings> {
  const serializedUserSettings = await getOne<SerializedUserSettings>(db, 'UserSettings', {
    id: userId,
  });

  if (serializedUserSettings == null) {
    return {
      id: userId,
      ...DEFAULT_USER_SETTINGS,
    };
  }

  return {
    id: userId,
    ...DEFAULT_USER_SETTINGS,
    ...JSON.parse(serializedUserSettings.settings),
  };
}

export async function saveUserSettings(
  db: D1Database,
  userSettings: UserSettings,
): Promise<Result<UserSettings, MissingResultError>> {
  const { id, ...settings } = userSettings;
  const query = db
    .prepare(
      dedent`
      INSERT OR REPLACE INTO UserSettings (
        id, settings
      )
      VALUES (
        ?, ?
      )
      RETURNING *
    `,
    )
    .bind(id, JSON.stringify(settings));

  const serializedUserSettings = await query.first<SerializedUserSettings>();
  if (serializedUserSettings == null) {
    return err(new MissingResultError('saveUserSettings'));
  }

  return ok({
    id: serializedUserSettings.id,
    ...DEFAULT_USER_SETTINGS,
    ...JSON.parse(serializedUserSettings.settings),
  });
}
