export type Wallet = {
  walletId: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type WalletTransactionType = 'credit' | 'debit';

export type WalletTransactionReason =
  | 'focus_session_completed'
  | 'shop_purchase'
  | 'refund'
  | 'manual_adjustment';

export type WalletReferenceType =
  | 'pomodoro_session'
  | 'shop_purchase'
  | 'refund'
  | 'system';

export type WalletTransaction = {
  transactionId: string;
  userId: string;
  amount: number;
  transactionType: WalletTransactionType;
  reason: WalletTransactionReason;
  referenceType: WalletReferenceType;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
};

export type FocusSessionRewardPayload = {
  userId: string;
  focusSessionId: string;
  plannedDurationSeconds: number;
};

export type FocusSessionRewardResult = {
  awarded: boolean;
  awardedAmount: number;
  newBalance: number;
  transactionId: string | null;
  reason: 'awarded' | 'duplicate' | 'not_eligible' | 'integrity_error';
};
