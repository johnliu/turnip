import { updateApplication } from '@/scripts/update-application.ts';
import { updateCommands } from '@/scripts/update-commands.ts';
import { parseArgs } from 'node:util';

const { positionals } = parseArgs({ args: Deno.args, allowPositionals: true });
switch (positionals[0]) {
  case 'update-commands': {
    updateCommands();
    break;
  }
  case 'update-application': {
    updateApplication(positionals[1]);
    break;
  }
  case 'migrate-database': {
    break;
  }
  default:
    console.error('Invalid command.');
    break;
}
