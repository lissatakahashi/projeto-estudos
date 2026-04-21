ALTER TABLE public."userPomodoroSettings"
ADD COLUMN IF NOT EXISTS "keepSessionRunningOnHiddenTab" BOOLEAN NOT NULL DEFAULT FALSE;
