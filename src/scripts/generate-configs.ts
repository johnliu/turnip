const TEMPLATE_DEV_VARS = `\
DISCORD_APPLICATION_ID=${Bun.env.DISCORD_APPLICATION_ID}
DISCORD_PUBLIC_KEY=${Bun.env.DISCORD_PUBLIC_KEY}
DISCORD_BOT_TOKEN=${Bun.env.DISCORD_BOT_TOKEN}
`;

const TEMPLATE_WRANGLER_TOML = `\
name = "turnip"
main = "src/index.ts"
compatibility_date = "2024-03-14"
compatibility_flags = ["nodejs_compat"]


[dev]
port = 3000

[[d1_databases]]
binding = "db"
database_name = "turnip"
database_id = "${Bun.env.CLOUDFLARE_D1_ID}"
`;

export async function generateConfigs() {
  // Create .dev.vars -- developer secrets
  await Bun.write(`${Bun.env.DEVBOX_PROJECT_ROOT}/.dev.vars`, TEMPLATE_DEV_VARS);

  // Create wrangler.toml
  await Bun.write(`${Bun.env.DEVBOX_PROJECT_ROOT}/wrangler.toml`, TEMPLATE_WRANGLER_TOML);
}
