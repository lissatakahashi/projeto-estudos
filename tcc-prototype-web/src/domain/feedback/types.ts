export type FeedbackVariant = 'success' | 'info' | 'warning' | 'error' | 'motivational';

export type MotivationalFeedbackEvent =
  | 'pomodoro_started'
  | 'pomodoro_completed'
  | 'pomodoro_invalidated'
  | 'coins_earned'
  | 'shop_item_purchased'
  | 'environment_item_equipped'
  | 'pet_fed'
  | 'dashboard_empty'
  | 'first_achievement_unlocked';

export type MotivationalFeedbackPayload = {
  coins?: number;
  itemName?: string;
  slotLabel?: string;
  petMood?: string;
  invalidReasonLabel?: string;
  achievementLabel?: string;
};

export type ResolvedFeedbackMessage = {
  event: MotivationalFeedbackEvent;
  variant: FeedbackVariant;
  message: string;
  dedupeKey: string;
  durationMs: number;
};

export type FeedbackPublishOptions = {
  dedupeKey?: string;
  dedupeWindowMs?: number;
  durationMs?: number;
};

export type ActiveFeedbackMessage = ResolvedFeedbackMessage & {
  id: string;
  createdAt: number;
};
