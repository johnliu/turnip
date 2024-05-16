import fs from 'node:fs/promises';
import { $ } from 'bun';
import YAML from 'yaml';

const METRICS_ENDPOINT = '127.0.0.1:54321';

async function getConfig(): Promise<{
  tunnelId: string | undefined;
  hostname: string | undefined;
}> {
  if (await fs.exists('.cloudflared')) {
    const config = YAML.parse(await Bun.file('.cloudflared/config.yml').text());
    const tunnelId = config.tunnel;
    const hostname = `https://${config.ingress[0].hostname}`;

    return {
      tunnelId,
      hostname,
    };
  }

  try {
    const tunnelMetadata: { hostname?: string } = await (
      await fetch(`http://${METRICS_ENDPOINT}/quicktunnel`)
    ).json();
    const hostname = tunnelMetadata.hostname;

    return {
      tunnelId: undefined,
      hostname,
    };
  } catch (e) {
    return {
      tunnelId: undefined,
      hostname: undefined,
    };
  }
}

export async function tunnel() {
  $.cwd(Bun.env.DEVBOX_PROJECT_ROOT);

  const { tunnelId } = await getConfig();
  const command =
    tunnelId != null
      ? $`cloudflared tunnel --metrics=${METRICS_ENDPOINT} --config=.cloudflared/config.yml run ${tunnelId}`
      : $`cloudflared tunnel --metrics=${METRICS_ENDPOINT} --url=localhost:3000`;

  for await (const line of command.lines()) {
    console.log(line);
  }
}

export async function tunnelUrl() {
  const { hostname } = await getConfig();
  console.log(hostname);
}
