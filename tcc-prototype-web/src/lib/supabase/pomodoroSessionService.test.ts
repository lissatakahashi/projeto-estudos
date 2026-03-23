import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  singleMock,
  selectMock,
  upsertMock,
  fromMock,
} = vi.hoisted(() => {
  const single = vi.fn();
  const select = vi.fn(() => ({ single }));
  const upsert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ upsert }));

  return {
    singleMock: single,
    selectMock: select,
    upsertMock: upsert,
    fromMock: from,
  };
});

vi.mock('./client', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { mapFocusSessionToInsert, registerFocusSession } from './pomodoroSessionService';

describe('pomodoroSessionService', () => {
  beforeEach(() => {
    fromMock.mockClear();
    upsertMock.mockClear();
    selectMock.mockClear();
    singleMock.mockClear();
  });

  it('maps completion payload with completedAt only for completed sessions', () => {
    const completed = mapFocusSessionToInsert({
      userId: 'user-1',
      sourcePomodoroId: 'pomodoro-1',
      phaseType: 'focus',
      startedAt: '2026-03-22T10:00:00.000Z',
      endedAt: '2026-03-22T10:25:00.000Z',
      plannedDurationSeconds: 1500,
      actualDurationSeconds: 1500,
      status: 'completed',
      focusSequenceIndex: 3,
      cycleIndex: 1,
      trigger: 'timer_elapsed',
      isValid: true,
    });

    const interrupted = mapFocusSessionToInsert({
      userId: 'user-1',
      sourcePomodoroId: 'pomodoro-2',
      phaseType: 'focus',
      startedAt: '2026-03-22T10:30:00.000Z',
      endedAt: '2026-03-22T10:40:00.000Z',
      plannedDurationSeconds: 1500,
      actualDurationSeconds: 600,
      status: 'interrupted',
      focusSequenceIndex: 4,
      cycleIndex: 1,
      trigger: 'manual_advance',
      isValid: true,
    });

    expect(completed.completedAt).toBe('2026-03-22T10:25:00.000Z');
    expect(interrupted.completedAt).toBeNull();
  });

  it('uses upsert with sourcePomodoroId conflict key to enforce idempotency', async () => {
    singleMock.mockResolvedValue({
      data: {
        sessionId: 'session-1',
      },
      error: null,
    });

    await registerFocusSession({
      userId: 'user-1',
      sourcePomodoroId: 'pomodoro-1',
      phaseType: 'focus',
      startedAt: '2026-03-22T10:00:00.000Z',
      endedAt: '2026-03-22T10:25:00.000Z',
      plannedDurationSeconds: 1500,
      actualDurationSeconds: 1500,
      status: 'completed',
      focusSequenceIndex: 3,
      cycleIndex: 1,
      trigger: 'timer_elapsed',
      isValid: true,
    });

    expect(fromMock).toHaveBeenCalledWith('pomodoroSessions');
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePomodoroId: 'pomodoro-1' }),
      { onConflict: 'sourcePomodoroId' },
    );
  });
});
