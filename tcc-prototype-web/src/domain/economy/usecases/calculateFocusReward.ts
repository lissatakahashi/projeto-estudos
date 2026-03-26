export type CalculateFocusRewardInput = {
  plannedDurationSeconds: number;
};

export const REWARD_WINDOW_SECONDS = 5 * 60;

export function calculateFocusReward(input: CalculateFocusRewardInput): number {
  const safeDuration = Math.max(0, Math.floor(input.plannedDurationSeconds));
  return Math.floor(safeDuration / REWARD_WINDOW_SECONDS);
}
