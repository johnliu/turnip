import { parseArgs } from 'node:util';
import { updateApplication } from '@/scripts/update-application';
import { updateCommands } from '@/scripts/update-commands';

const { positionals } = parseArgs({ args: process.argv.slice(2), allowPositionals: true });
switch (positionals[0]) {
  case 'update-commands': {
    updateCommands();
    break;
  }
  case 'update-application': {
    updateApplication(positionals[1]);
    break;
  }
  default:
    console.error('Invalid command.');
    break;
}
