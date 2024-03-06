import { parseArgs } from 'util';
import { ApplicationCommandType, Routes } from 'discord-api-types/v10';

import { ApplicationIntegrationTypes, IntegrationContextType } from '@/constants';

async function registerCommands() {
  const commands = [
    {
      name: 'turnip',
      description: 'Turnip commands.',
      integration_types: [ApplicationIntegrationTypes.UserInstall],
      contexts: [IntegrationContextType.Guild, IntegrationContextType.BotDM, IntegrationContextType.PrivateChannel],
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          type: 1,
          name: 'fact',
          description: 'Get a fact about turnips.',
        },
      ],
    },

    {
      name: 'Give Turnip',
      integration_types: [ApplicationIntegrationTypes.UserInstall],
      contexts: [IntegrationContextType.Guild, IntegrationContextType.BotDM, IntegrationContextType.PrivateChannel],
      type: ApplicationCommandType.User,
    },
  ];

  await fetch(Routes.applicationCommands(Bun.env.APPLICATION_ID), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${Bun.env.BOT_TOKEN}`,
    },
    body: JSON.stringify(commands),
  });
}

const { positionals } = parseArgs({ args: Bun.argv, allowPositionals: true });
switch (positionals[0]) {
  case 'register-commands': {
    registerCommands();
    break;
  }
  default:
    break;
}
