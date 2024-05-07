const DISCORD_EPOCH = 1420070400000n;

export function generateSnowflake(date = new Date()): string {
  return ((BigInt(date.getTime()) - DISCORD_EPOCH) << 22n).toString();
}
