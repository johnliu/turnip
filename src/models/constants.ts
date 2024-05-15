import { StandardError } from '@/utils/errors';

export enum TurnipType {
  STANDARD = 0,
}

export enum OriginType {
  FORAGED = 0,
  HARVEST = 1,
}

export enum OwnerType {
  SYSTEM = 0,
  USER = 1,
  GUILD = 2,
}

export enum QueryError {
  MissingResult = 0,
  NoTurnipsError = 1,
  ForageOnCooldown = 2,
  HarvestOnCooldown = 3,
}

export class ForageOnCooldownError extends StandardError<QueryError.ForageOnCooldown> {
  remainingCooldown: number;

  constructor(remainingCooldown: number) {
    super(QueryError.ForageOnCooldown);
    this.remainingCooldown = remainingCooldown;
  }
}

export class HarvestOnCooldownError extends StandardError<QueryError.HarvestOnCooldown> {
  remainingCooldown: number;

  constructor(remainingCooldown: number) {
    super(QueryError.HarvestOnCooldown);
    this.remainingCooldown = remainingCooldown;
  }
}

export class MissingResultError extends StandardError<QueryError.MissingResult> {
  query: string;

  constructor(query: string) {
    super(QueryError.MissingResult);
    this.query = query;
  }
}

// Users can harvest between 2-5 turnips each time.
export const USER_HARVEST_AMOUNT_RANGE = [2, 5] as const;

// User can harvest once every 30 minutes from the same guild.
export const USER_HARVEST_COOLDOWN_MS = 30 * 60 * 1000;

// Users can forage between 2-5 turnips each time.
export const USER_FORAGE_AMOUNT_RANGE = [2, 5] as const;

// User can forage once every 12 hours.
export const USER_FORAGE_COOLDOWN_MS = 12 * 60 * 60 * 1000;

// Planted turnips yields between 8-12 harvestable turnips.
export const TURNIP_HARVESTABLE_AMOUNT_RANGE = [8, 12] as const;

// Planted turnips are harvestable after 2 hours.
export const TURNIP_HARVESTABLE_AFTER_MS = 2 * 60 * 60 * 1000;
