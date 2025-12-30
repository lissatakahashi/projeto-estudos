import { PomodoroMode } from './enums/PomodoroMode';
import { PomodoroStatus } from './enums/PomodoroStatus';

/**
 * PomodoroId
 *
 * Identifier type alias for Pomodoro sessions.
 */
export type PomodoroId = string;

/**
 * Pomodoro
 *
 * Represents a single Pomodoro session in the application domain.
 * Fields are designed to support state persistence, anti-cheat checks
 * and UI presentation.
 *
 * Fields:
 * - `pomodoroId`: unique id for the session instance
 * - `mode`: which mode the session is in (`focus` / `short_break` / `long_break`)
 * - `status`: lifecycle status (`idle` / `running` / `paused` / `finished`)
 * - `duration`: planned duration in seconds (e.g., 25 * 60)
 * - `remaining`: seconds left until session end (decrements while running)
 * - `isValid`: whether this session is considered valid for rewards
 * - `lostFocusSeconds`: accumulated seconds where the page lost visibility
 * - `invalidReason`: optional string to explain why a session was marked invalid
 * - `startedAt` / `endedAt`: ISO timestamps for session start/end (optional)
 */
export type Pomodoro = {
  pomodoroId: PomodoroId;
  title: string;
  mode: PomodoroMode;
  status: PomodoroStatus;
  duration: number; // planned duration in seconds
  remaining: number; // remaining seconds
  isValid: boolean;
  lostFocusSeconds: number;
  invalidReason?: string;
  startedAt?: string; // ISO
  endedAt?: string; // ISO
};
