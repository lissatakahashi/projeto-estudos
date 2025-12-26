import { PomodoroMode } from './enums/PomodoroMode';

/**
 * PomodoroHistoryItemId
 *
 * Identifier type alias for history items.
 */
export type PomodoroHistoryItemId = string;

/**
 * PomodoroHistoryItem
 *
 * A concise record stored when a Pomodoro session finishes or is invalidated.
 * This type is optimized for history listing and analytics (streaks, minutes).
 *
 * Fields:
 * - `pomodoroHistoryItemId`: unique id for this history entry
 * - `mode`: the session mode (focus / short_break / long_break)
 * - `start` / `end`: ISO timestamps for the session period
 * - `duration`: planned duration in seconds
 * - `actualDuration`: elapsed seconds during the session
 * - `isValid`: whether session counted as valid
 * - `invalidReason`: optional reason when invalid (e.g., 'lost_focus')
 */
export type PomodoroHistoryItem = {
  pomodoroHistoryItemId: PomodoroHistoryItemId;
  mode: PomodoroMode;
  start: string; // ISO
  end: string; // ISO
  duration: number; // seconds planned
  actualDuration: number; // seconds elapsed
  isValid: boolean;
  invalidReason?: string;
};
