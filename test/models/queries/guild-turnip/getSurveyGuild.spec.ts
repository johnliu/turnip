import { test as base, beforeEach, describe } from 'vitest';

import { generateSnowflake } from '../../../utils/snowflake';
import { freezeTime } from '../../../utils/time';

// guildPlantedCount - guild has no planted

// guildPlantedCount - guild has N planted

// userPlantedCount - guild has no planted by user

// userPlantedCount - guild has planted by user

// remainingHarvests - no harvests remaining

// remainingHarvests - sums correctly

// unripe turnips - no unripe

// unripe turnips - has unripe

// unripe turnips - has unripe becomes ripe

interface Context {
  user: string;
  guild: string;
  timestamp: number;
}

const test = base<Context>;

beforeEach<Context>(async (context) => {
  context.user = generateSnowflake();
  context.guild = generateSnowflake();
  context.timestamp = freezeTime();
});

describe('survey guild for guildPlantedCount', () => {
  test('guild has no planted', async () => {});
});
