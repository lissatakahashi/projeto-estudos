import { describe, expect, it } from 'vitest';
import { calculateFocusReward } from './calculateFocusReward';

describe('calculateFocusReward', () => {
  it('returns 0 for durations shorter than 5 minutes', () => {
    expect(calculateFocusReward({ plannedDurationSeconds: 299 })).toBe(0);
  });

  it('returns 1 coin for exactly 5 minutes', () => {
    expect(calculateFocusReward({ plannedDurationSeconds: 300 })).toBe(1);
  });

  it('returns proportional reward for standard focus block', () => {
    expect(calculateFocusReward({ plannedDurationSeconds: 1500 })).toBe(5);
  });
});
