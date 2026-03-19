CREATE TABLE IF NOT EXISTS public."userPomodoroSettings" (
    "userId" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "focusDurationMinutes" INTEGER NOT NULL DEFAULT 25 CHECK ("focusDurationMinutes" BETWEEN 5 AND 120),
    "shortBreakDurationMinutes" INTEGER NOT NULL DEFAULT 5 CHECK ("shortBreakDurationMinutes" BETWEEN 1 AND 30),
    "longBreakDurationMinutes" INTEGER NOT NULL DEFAULT 15 CHECK ("longBreakDurationMinutes" BETWEEN 5 AND 60),
    "cyclesBeforeLongBreak" INTEGER NOT NULL DEFAULT 4 CHECK ("cyclesBeforeLongBreak" BETWEEN 1 AND 12),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ("longBreakDurationMinutes" >= "shortBreakDurationMinutes")
);

ALTER TABLE public."userPomodoroSettings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own pomodoro settings" ON public."userPomodoroSettings";
CREATE POLICY "Users can read own pomodoro settings"
    ON public."userPomodoroSettings"
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own pomodoro settings" ON public."userPomodoroSettings";
CREATE POLICY "Users can insert own pomodoro settings"
    ON public."userPomodoroSettings"
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own pomodoro settings" ON public."userPomodoroSettings";
CREATE POLICY "Users can update own pomodoro settings"
    ON public."userPomodoroSettings"
    FOR UPDATE
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete own pomodoro settings" ON public."userPomodoroSettings";
CREATE POLICY "Users can delete own pomodoro settings"
    ON public."userPomodoroSettings"
    FOR DELETE
    USING (auth.uid() = "userId");
