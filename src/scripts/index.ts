import { parseArgs } from 'node:util';
import { generateConfigs } from '@/scripts/generate-configs';
import { tunnel, tunnelUrl } from '@/scripts/local-tunnel';
import { migration } from '@/scripts/migrations';
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
  case 'generate-configs': {
    generateConfigs();
    break;
  }
  case 'tunnel': {
    tunnel();
    break;
  }
  case 'tunnel-url': {
    tunnelUrl();
    break;
  }
  case 'migrations': {
    migration(positionals[1]);
    break;
  }
  default:
    console.error('Invalid command.');
    break;
}
