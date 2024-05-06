import type { OwnerType } from '@/models/constants';

export type TurnipTransaction = {
  id: string;
  createdAt: number;
  turnipId: string;
  senderId: string | null;
  senderType: OwnerType;
  receiverId: string;
  receiverType: OwnerType;
};
