const DISCORD_EPOCH = 1420070400000n;
const MAX_INCREMENT = 0x1000n;

let processIncrement = 0n;

export function generateSnowflake(date = new Date()): string {
  const timestampPortion = (BigInt(date.getTime()) - DISCORD_EPOCH) << 22n;
  const incrementPortion = processIncrement++ % MAX_INCREMENT;

  return (timestampPortion + processIncrement).toString();
}
