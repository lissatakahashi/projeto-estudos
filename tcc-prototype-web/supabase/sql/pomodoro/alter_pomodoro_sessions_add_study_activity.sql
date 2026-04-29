ALTER TABLE public."pomodoroSessions"
  ADD COLUMN IF NOT EXISTS "studyGoal" TEXT,
  ADD COLUMN IF NOT EXISTS "studySubject" TEXT;

COMMENT ON COLUMN public."pomodoroSessions"."studyGoal" IS
  'Objetivo declarado pelo usuário antes de iniciar a sessão de foco.';

COMMENT ON COLUMN public."pomodoroSessions"."studySubject" IS
  'Tema ou conteúdo que o usuário pretende estudar na sessão.';
