-- Create pomodoros table
CREATE TABLE IF NOT EXISTS public.pomodoros (
    "pomodoroId" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "startedAt" TIMESTAMPTZ DEFAULT NOW(),
    "endedAt" TIMESTAMPTZ,
    "isComplete" BOOLEAN DEFAULT FALSE,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS pomodoros_user_id_idx ON public.pomodoros("userId");
CREATE INDEX IF NOT EXISTS pomodoros_created_at_idx ON public.pomodoros("createdAt");

-- Enable RLS
ALTER TABLE public.pomodoros ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own pomodoros" ON public.pomodoros;
CREATE POLICY "Users can view their own pomodoros"
    ON public.pomodoros
    FOR SELECT
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert their own pomodoros" ON public.pomodoros;
CREATE POLICY "Users can insert their own pomodoros"
    ON public.pomodoros
    FOR INSERT
    WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update their own pomodoros" ON public.pomodoros;
CREATE POLICY "Users can update their own pomodoros"
    ON public.pomodoros
    FOR UPDATE
    USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete their own pomodoros" ON public.pomodoros;
CREATE POLICY "Users can delete their own pomodoros"
    ON public.pomodoros
    FOR DELETE
    USING (auth.uid() = "userId");

-- Create updated_at trigger
-- Trigger for updatedAt omitted due to RPC limitations/permissions.
-- Please add using Supabase Dashboard if needed:
-- CREATE EXTENSION moddatetime SCHEMA extensions;
-- CREATE TRIGGER handle_pomodoros_updated_at BEFORE UPDATE ON public.pomodoros FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime('updatedAt');
