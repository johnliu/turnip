import fs from 'node:fs/promises';
import { env } from 'node:process';
import { type APIApplication, Routes } from 'discord-api-types/v10';

import { ApplicationIntegrationType } from '@/constants';
import { request } from '@/scripts/lib';

type RESTPatchAPIApplication = Partial<APIApplication> &
  Partial<{
    integration_types_config: {
      [ApplicationIntegrationType.GuildInstall]?: null;
      [ApplicationIntegrationType.UserInstall]?: null;
    };
  }>;

export async function updateApplication(interactions_endpoint_url?: string) {
  const imageBytes = await fs.readFile(`${env.DEVBOX_PROJECT_ROOT}/assets/icon.png`);
  const imageDataUri = `data:image/png;base64,${imageBytes.toString('base64')}`;

  const payload: RESTPatchAPIApplication = {
    name: env.ENV === 'staging' ? 'Turnip Staging' : 'Turnip',
    description: 'Fun facts about turnips',
    tags: ['turnips', 'fun', 'facts'],
    icon: imageDataUri,
    interactions_endpoint_url,
    integration_types_config: {
      [ApplicationIntegrationType.UserInstall]: null,
    },
  };

  await request({
    method: 'PATCH',
    path: Routes.currentApplication(),
    body: payload,
  });
}
