import { env } from 'cloudflare:test';
import { faker } from '@faker-js/faker';
import { test as base, beforeEach, expect } from 'vitest';

import { TurnipType } from '@/models/constants';
import TurnipQueries from '@/models/queries/turnip';

import { seedTurnips } from '../../../utils/queries/turnip-utils';
import { generateSnowflake } from '../../../utils/snowflake';
import { freezeTime } from '../../../utils/time';

interface Context {
  userId: string;
  timestamp: number;
}

const test = base<Context>;

beforeEach<Context>(async (context) => {
  context.userId = generateSnowflake();
  context.timestamp = freezeTime();
});

test('get inventory with no turnips', async ({ userId }) => {
  const turnipCounts = await TurnipQueries.getTurnipInventory(env.db, { userId });
  expect(turnipCounts).toHaveLength(0);
});

test('get inventory with turnips', async ({ userId }) => {
  const numTurnips = faker.number.int({ min: 1, max: 5 });
  await seedTurnips(userId, numTurnips);

  const turnipCounts = await TurnipQueries.getTurnipInventory(env.db, { userId });
  expect(turnipCounts).toHaveLength(1);
  expect(turnipCounts[0]).toMatchObject({
    type: TurnipType.STANDARD,
    count: numTurnips,
  });
});
