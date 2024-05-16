import fs from 'node:fs/promises';
import {
  type APIApplication,
  type APIApplicationInstallParams,
  OAuth2Scopes,
  Routes,
} from 'discord-api-types/v10';

import { ApplicationIntegrationType } from '@/constants';
import { request } from '@/scripts/lib';

type RESTPatchAPIApplication = Partial<APIApplication> &
  Partial<{
    integration_types_config: {
      [key in ApplicationIntegrationType]?: {
        oauth2_install_params?: APIApplicationInstallParams;
      };
    };
  }>;

export async function updateApplication(interactions_endpoint_url?: string) {
  const imageBytes = await fs.readFile(`${Bun.env.DEVBOX_PROJECT_ROOT}/assets/icon.png`);
  const imageDataUri = `data:image/png;base64,${imageBytes.toString('base64')}`;

  const payload: RESTPatchAPIApplication = {
    name: Bun.env.ENV === 'staging' ? 'Turnip Staging' : 'Turnip',
    description: 'Fun facts about turnips',
    tags: ['turnips', 'fun', 'facts'],
    icon: imageDataUri,
    interactions_endpoint_url,
    integration_types_config: {
      [ApplicationIntegrationType.UserInstall]: {
        oauth2_install_params: {
          scopes: [OAuth2Scopes.ApplicationsCommands],
          permissions: '0',
        },
      },
    },
  };

  await request({
    method: 'PATCH',
    path: Routes.currentApplication(),
    body: payload,
  });
}
