import { describe, expect, it } from 'vitest';
import type { DashboardRawData } from '../../../lib/supabase/dashboardService';
import { buildUserProgressDashboard } from './buildUserProgressDashboard';

function makeBaseInput(): DashboardRawData {
  return {
    focusSessions: [],
    wallet: {
      walletId: 'wallet-1',
      userId: 'user-1',
      balance: 0,
      createdAt: '2026-03-20T10:00:00.000Z',
      updatedAt: '2026-03-20T10:00:00.000Z',
    },
    walletTransactions: [],
    inventory: [],
  };
}

describe('buildUserProgressDashboard', () => {
  it('returns friendly empty metrics when user has no study history', () => {
    const result = buildUserProgressDashboard(makeBaseInput());

    expect(result.isEmpty).toBe(true);
    expect(result.metrics.completedFocusSessionsCount).toBe(0);
    expect(result.metrics.totalFocusTimeSeconds).toBe(0);
    expect(result.metrics.totalCoinsEarned).toBe(0);
    expect(result.metrics.totalItemsPurchased).toBe(0);
    expect(result.recentSessions).toHaveLength(0);
    expect(result.recentActivities).toHaveLength(0);
  });

  it('aggregates completed sessions, time, balance and purchases', () => {
    const input = makeBaseInput();
    if (!input.wallet) {
      throw new Error('Expected base input wallet to be defined.');
    }

    input.wallet = {
      ...input.wallet,
      balance: 42,
    };
    input.focusSessions = [
      {
        sessionId: 'session-3',
        status: 'completed',
        phaseType: 'focus',
        startedAt: '2026-03-30T13:00:00.000Z',
        endedAt: '2026-03-30T13:25:00.000Z',
        completedAt: '2026-03-30T13:25:00.000Z',
        plannedDurationSeconds: 1500,
        actualDurationSeconds: 1500,
        focusSequenceIndex: 3,
        cycleIndex: 1,
        createdAt: '2026-03-30T13:00:00.000Z',
      },
      {
        sessionId: 'session-2',
        status: 'completed',
        phaseType: 'focus',
        startedAt: '2026-03-29T10:00:00.000Z',
        endedAt: '2026-03-29T10:20:00.000Z',
        completedAt: '2026-03-29T10:20:00.000Z',
        plannedDurationSeconds: 1500,
        actualDurationSeconds: 1200,
        focusSequenceIndex: 2,
        cycleIndex: 1,
        createdAt: '2026-03-29T10:00:00.000Z',
      },
      {
        sessionId: 'session-1',
        status: 'invalidated',
        phaseType: 'focus',
        startedAt: '2026-03-28T09:00:00.000Z',
        endedAt: '2026-03-28T09:10:00.000Z',
        completedAt: null,
        plannedDurationSeconds: 1500,
        actualDurationSeconds: 600,
        focusSequenceIndex: 1,
        cycleIndex: 1,
        createdAt: '2026-03-28T09:00:00.000Z',
      },
    ];
    input.walletTransactions = [
      {
        transactionId: 'tx-2',
        userId: 'user-1',
        amount: 10,
        transactionType: 'credit',
        reason: 'focus_session_completed',
        referenceType: 'pomodoro_session',
        referenceId: 'session-3',
        description: 'Recompensa por sessao.',
        createdAt: '2026-03-30T13:25:01.000Z',
      },
      {
        transactionId: 'tx-1',
        userId: 'user-1',
        amount: 5,
        transactionType: 'debit',
        reason: 'pet_fed',
        referenceType: 'pet_feed',
        referenceId: null,
        description: 'Alimentou o pet',
        createdAt: '2026-03-30T15:00:00.000Z',
      },
    ];
    input.inventory = [
      {
        inventoryEntryId: 'inv-1',
        userId: 'user-1',
        itemId: 'item-1',
        quantity: 1,
        isEquipped: false,
        equipSlot: 'environment',
        appliedTarget: 'environment',
        createdAt: '2026-03-30T16:00:00.000Z',
        acquiredAt: '2026-03-30T16:00:00.000Z',
        updatedAt: '2026-03-30T16:00:00.000Z',
        purchaseId: 'purchase-1',
        walletTransactionId: 'tx-purchase',
        isReadyForCustomization: true,
        item: {
          itemId: 'item-1',
          name: 'Tema Floresta',
          slug: 'tema-floresta',
          description: 'Tema visual',
          price: 20,
          category: 'theme',
          rarity: 'common',
          environmentSlot: 'background',
          imageUrl: null,
          isActive: true,
          createdAt: '2026-03-30T16:00:00.000Z',
          updatedAt: '2026-03-30T16:00:00.000Z',
        },
      },
    ];

    const result = buildUserProgressDashboard(input);

    expect(result.isEmpty).toBe(false);
    expect(result.metrics.completedFocusSessionsCount).toBe(2);
    expect(result.metrics.totalFocusTimeSeconds).toBe(2700);
    expect(result.metrics.totalFocusTimeMinutes).toBe(45);
    expect(result.metrics.currentWalletBalance).toBe(42);
    expect(result.metrics.totalCoinsEarned).toBe(10);
    expect(result.metrics.totalItemsPurchased).toBe(1);
    expect(result.recentSessions).toHaveLength(3);
    expect(result.currentCycleProgress).toEqual({
      cycleIndex: 1,
      focusSequenceIndex: 3,
    });
  });

  it('creates recent activity feed sorted by latest events', () => {
    const input = makeBaseInput();
    input.focusSessions = [
      {
        sessionId: 'session-1',
        status: 'completed',
        phaseType: 'focus',
        startedAt: '2026-03-30T13:00:00.000Z',
        endedAt: '2026-03-30T13:25:00.000Z',
        completedAt: '2026-03-30T13:25:00.000Z',
        plannedDurationSeconds: 1500,
        actualDurationSeconds: 1500,
        focusSequenceIndex: 1,
        cycleIndex: 1,
        createdAt: '2026-03-30T13:00:00.000Z',
      },
    ];
    input.walletTransactions = [
      {
        transactionId: 'tx-1',
        userId: 'user-1',
        amount: 5,
        transactionType: 'debit',
        reason: 'pet_fed',
        referenceType: 'pet_feed',
        referenceId: null,
        description: 'Alimentou o pet',
        createdAt: '2026-03-30T14:00:00.000Z',
      },
    ];

    const result = buildUserProgressDashboard(input);

    expect(result.recentActivities[0].title).toBe('Interação com pet');
    expect(result.recentActivities[1].title).toBe('Sessão de foco concluída');
  });
});
