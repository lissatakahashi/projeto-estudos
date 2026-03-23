-- Create table to persist completed/invalidated/interrupted focus blocks
CREATE TABLE IF NOT EXISTS public."pomodoroSessions" (
    "sessionId" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "phaseType" TEXT NOT NULL CHECK ("phaseType" IN ('focus', 'short_break', 'long_break')),
    "startedAt" TIMESTAMPTZ NOT NULL,
    "endedAt" TIMESTAMPTZ NOT NULL,
    "plannedDurationSeconds" INTEGER NOT NULL CHECK ("plannedDurationSeconds" > 0),
    "actualDurationSeconds" INTEGER NOT NULL CHECK ("actualDurationSeconds" >= 0),
    "status" TEXT NOT NULL CHECK ("status" IN ('completed', 'invalidated', 'interrupted')),
    "completedAt" TIMESTAMPTZ,
    "focusSequenceIndex" INTEGER,
    "cycleIndex" INTEGER,
    "sourcePomodoroId" TEXT NOT NULL UNIQUE,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pomodoro_sessions_user_id_idx ON public."pomodoroSessions"("userId");
CREATE INDEX IF NOT EXISTS pomodoro_sessions_completed_at_idx ON public."pomodoroSessions"("completedAt");
CREATE INDEX IF NOT EXISTS pomodoro_sessions_status_idx ON public."pomodoroSessions"("status");

ALTER TABLE public."pomodoroSessions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pomodoro sessions" ON public."pomodoroSessions";
CREATE POLICY "Users can view own pomodoro sessions"
    ON public."pomodoroSessions"
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own pomodoro sessions" ON public."pomodoroSessions";
CREATE POLICY "Users can insert own pomodoro sessions"
    ON public."pomodoroSessions"
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own pomodoro sessions" ON public."pomodoroSessions";
CREATE POLICY "Users can update own pomodoro sessions"
    ON public."pomodoroSessions"
    FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete own pomodoro sessions" ON public."pomodoroSessions";
CREATE POLICY "Users can delete own pomodoro sessions"
    ON public."pomodoroSessions"
    FOR DELETE
    USING (auth.uid() = "userId");
