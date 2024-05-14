import { type Result, err, ok } from 'neverthrow';

import type { UserSettings } from '@/models/user-settings';
import { batch, getOne, makeInsertOneStatement } from '@/utils/d1';
import { MissingResultError } from '../constants';

const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id'> = {
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
  const [serializedUserSettings] = await batch(db, [
    makeInsertOneStatement<SerializedUserSettings>(db, 'UserSettings', {
      id,
      settings: JSON.stringify(settings),
    }),
  ]);

  if (serializedUserSettings == null) {
    return err(new MissingResultError('saveUserSettings'));
  }
  return ok({
    id: serializedUserSettings.id,
    ...DEFAULT_USER_SETTINGS,
    ...JSON.parse(serializedUserSettings.settings),
  });
}
