import {
  type APIApplicationCommand as APIApplicationCommandBase,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Routes,
} from 'discord-api-types';

import { ApplicationIntegrationType, IntegrationContextType } from '@/constants.ts';
import { request } from '@/scripts/lib.ts';
import { assertNotNull } from '@/utils.ts';

type APIApplicationCommand =
  | APIApplicationCommandBase
  | {
    integration_types?: ApplicationIntegrationType[];
    contexts?: IntegrationContextType[];
  };

export async function updateCommands() {
  const commands: APIApplicationCommand[] = [
    {
      name: 'turnip',
      description: 'Turnip commands.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [IntegrationContextType.Guild, IntegrationContextType.BotDM, IntegrationContextType.PrivateChannel],
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'fact',
          description: 'Get a fact about turnips.',
          type: ApplicationCommandOptionType.Subcommand,
        },

        {
          name: 'give',
          description: 'Give a turnip to someone.',
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: 'user',
              description: 'The user to give the turnip to.',
              type: ApplicationCommandOptionType.User,
              required: true,
            },
          ],
        },
      ],
    },

    {
      name: 'inventory',
      description: 'See how many turnips you have.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [IntegrationContextType.Guild, IntegrationContextType.BotDM, IntegrationContextType.PrivateChannel],
      type: ApplicationCommandType.ChatInput,
    },

    {
      name: 'Give Turnip',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [IntegrationContextType.Guild, IntegrationContextType.BotDM, IntegrationContextType.PrivateChannel],
      type: ApplicationCommandType.User,
    },

    {
      name: 'Give Turnip to User',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [IntegrationContextType.Guild, IntegrationContextType.BotDM, IntegrationContextType.PrivateChannel],
      type: ApplicationCommandType.Message,
    },
  ];

  await request({
    method: 'PUT',
    path: Routes.applicationCommands(assertNotNull(Deno.env.get('DISCORD_APPLICATION_ID'))),
    body: commands,
  });
}
