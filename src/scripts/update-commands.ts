import { env } from 'node:process';
import {
  type APIApplicationCommand as APIApplicationCommandBase,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Routes,
} from 'discord-api-types/v10';

import { ApplicationIntegrationType, InteractionContextType } from '@/constants';
import { request } from '@/scripts/lib';

type APIApplicationCommand =
  | APIApplicationCommandBase
  | {
      integration_types?: ApplicationIntegrationType[];
      contexts?: InteractionContextType[];
    };

export async function updateCommands() {
  const commands: APIApplicationCommand[] = [
    {
      name: 'patch-notes',
      description: "What's new with turnips.",
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
      ],
      type: ApplicationCommandType.ChatInput,
    },

    {
      name: 'fact',
      description: 'Get a fact about turnips.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
      ],
      type: ApplicationCommandType.ChatInput,
    },

    {
      name: 'survey',
      description: 'Check on the turnip crop in this server.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [InteractionContextType.Guild],
    },

    {
      name: 'plant',
      description: 'Plant a turnip in this server.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [InteractionContextType.Guild],
    },

    {
      name: 'harvest',
      description: 'Harvest turnips in this server.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [InteractionContextType.Guild],
    },

    {
      name: 'forage',
      description: 'Forage around for some turnips.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
      ],
    },

    {
      name: 'inventory',
      description: 'See how many turnips you have.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
      ],
      type: ApplicationCommandType.ChatInput,
    },

    {
      name: 'give',
      description: 'Give a turnip to someone.',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
      ],
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'user',
          description: 'The user to give the turnip to.',
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },

    {
      name: 'Give Turnip',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
      ],
      type: ApplicationCommandType.User,
    },

    {
      name: 'Give Turnip to User',
      integration_types: [ApplicationIntegrationType.UserInstall],
      contexts: [
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel,
      ],
      type: ApplicationCommandType.Message,
    },
  ];

  const debugCommands =
    Bun.env.ENV === 'production'
      ? []
      : [
          {
            name: 'Debug Message',
            integration_types: [ApplicationIntegrationType.UserInstall],
            contexts: [
              InteractionContextType.Guild,
              InteractionContextType.BotDM,
              InteractionContextType.PrivateChannel,
            ],
            type: ApplicationCommandType.Message,
          },
        ];

  await request({
    method: 'PUT',
    path: Routes.applicationCommands(env.DISCORD_APPLICATION_ID),
    body: [...commands, ...debugCommands],
  });
}
