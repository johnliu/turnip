import { test as base, beforeEach } from 'vitest';

import { freezeTime, generateSnowflake } from '../../../utils';

interface Context {
  userId: string;
  timestamp: number;
}

const test = base<Context>;

beforeEach<Context>(async (context) => {
  context.userId = generateSnowflake();
  context.timestamp = freezeTime();
});

// user has no turnips
test('user ');

// user has N turnips

// stub for when there are types
