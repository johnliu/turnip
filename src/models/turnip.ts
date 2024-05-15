import type { OriginType, OwnerType, TurnipType } from '@/models/constants';

export type Turnip = {
  id: string;
  createdAt: number;
  type: TurnipType;
  originId: string | null;
  originType: OriginType;
  parentId: string | null;
  ownerId: string;
  ownerType: OwnerType;
  ownedAt: number;
};
