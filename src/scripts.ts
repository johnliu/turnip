import {
  type APIApplicationCommand as APIApplicationCommandOld,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  RouteBases,
  Routes,
} from 'discord-api-types';
import { inspect, parseArgs } from 'node:util';

import { ApplicationIntegrationType, IntegrationContextType } from '@/constants.ts';
import { assertNotNull } from '@/utils.ts';

type APIApplicationCommand =
  | APIApplicationCommandOld
  | {
    integration_types?: ApplicationIntegrationType[];
    contexts?: IntegrationContextType[];
  };

async function registerCommands() {
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

  const request = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${Deno.env.get('BOT_TOKEN')}`,
    },
    body: commands,
  };

  console.log('Request:', inspect(request));
  const applicationId = assertNotNull(Deno.env.get('APPLICATION_ID'));
  const response = await fetch(RouteBases.api + Routes.applicationCommands(applicationId), {
    ...request,
    body: JSON.stringify(request.body),
  });

  console.log('Response:', inspect({ body: await response.json() }));
}

const { positionals } = parseArgs({ args: Deno.args, allowPositionals: true });
switch (positionals[0]) {
  case 'register-commands': {
    registerCommands();
    break;
  }
  default:
    console.error('Invalid command.');
    break;
}
