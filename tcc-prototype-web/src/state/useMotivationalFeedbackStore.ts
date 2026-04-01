import create from 'zustand';
import { resolveFeedbackMessage } from '../domain/feedback/catalog';
import type {
    ActiveFeedbackMessage,
    FeedbackPublishOptions,
    MotivationalFeedbackEvent,
    MotivationalFeedbackPayload,
    ResolvedFeedbackMessage,
} from '../domain/feedback/types';

type MotivationalFeedbackState = {
  active: ActiveFeedbackMessage | null;
  queue: ActiveFeedbackMessage[];
  lastShownAtByDedupeKey: Record<string, number>;
  publishEvent: (
    event: MotivationalFeedbackEvent,
    payload?: MotivationalFeedbackPayload,
    options?: FeedbackPublishOptions,
  ) => ActiveFeedbackMessage | null;
  publish: (
    message: ResolvedFeedbackMessage,
    options?: FeedbackPublishOptions,
  ) => ActiveFeedbackMessage | null;
  dismissActive: () => void;
  reset: () => void;
};

const DEFAULT_DEDUPE_WINDOW_MS = 4000;
const MAX_QUEUE_SIZE = 6;

function toActiveMessage(
  message: ResolvedFeedbackMessage,
  options?: FeedbackPublishOptions,
): ActiveFeedbackMessage {
  const now = Date.now();
  return {
    ...message,
    id: `${message.event}:${now}:${Math.random().toString(16).slice(2)}`,
    dedupeKey: options?.dedupeKey ?? message.dedupeKey,
    durationMs: options?.durationMs ?? message.durationMs,
    createdAt: now,
  };
}

function isDuplicate(
  dedupeMap: Record<string, number>,
  dedupeKey: string,
  dedupeWindowMs: number,
  now: number,
): boolean {
  const previous = dedupeMap[dedupeKey];
  if (!previous) {
    return false;
  }

  return now - previous < dedupeWindowMs;
}

export const useMotivationalFeedbackStore = create<MotivationalFeedbackState>((set, get) => ({
  active: null,
  queue: [],
  lastShownAtByDedupeKey: {},

  publishEvent: (event, payload = {}, options = {}) => {
    const message = resolveFeedbackMessage(event, payload, options.dedupeKey);
    return get().publish(message, options);
  },

  publish: (message, options = {}) => {
    const dedupeWindowMs = options.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
    const activeMessage = toActiveMessage(message, options);
    const now = activeMessage.createdAt;

    if (isDuplicate(get().lastShownAtByDedupeKey, activeMessage.dedupeKey, dedupeWindowMs, now)) {
      return null;
    }

    set((state) => {
      const nextDedupeMap = {
        ...state.lastShownAtByDedupeKey,
        [activeMessage.dedupeKey]: now,
      };

      if (!state.active) {
        return {
          active: activeMessage,
          queue: state.queue,
          lastShownAtByDedupeKey: nextDedupeMap,
        };
      }

      const nextQueue = [...state.queue, activeMessage].slice(0, MAX_QUEUE_SIZE);
      return {
        active: state.active,
        queue: nextQueue,
        lastShownAtByDedupeKey: nextDedupeMap,
      };
    });

    return activeMessage;
  },

  dismissActive: () => {
    set((state) => {
      if (state.queue.length === 0) {
        return { active: null };
      }

      const [next, ...rest] = state.queue;
      return {
        active: next,
        queue: rest,
      };
    });
  },

  reset: () => {
    set({
      active: null,
      queue: [],
      lastShownAtByDedupeKey: {},
    });
  },
}));
