import * as base64 from '$std/encoding/base64.ts';
import { ApplicationIntegrationType } from '@/constants.ts';
import { request } from '@/scripts/lib.ts';
import { APIApplication, Routes } from 'discord-api-types';

type RESTPatchAPIApplication =
  & Partial<APIApplication>
  & Partial<{
    integration_types_config: {
      [ApplicationIntegrationType.GuildInstall]?: null;
      [ApplicationIntegrationType.UserInstall]?: null;
    };
  }>;

export async function updateApplication(interactions_endpoint_url?: string) {
  const imageBytes = await Deno.readFile(`${Deno.env.get('DEVBOX_PROJECT_ROOT')}/assets/icon.png`);
  const imageDataUri = `data:image/png;base64,${base64.encodeBase64(imageBytes)}`;

  const payload: RESTPatchAPIApplication = {
    name: 'Turnip',
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
