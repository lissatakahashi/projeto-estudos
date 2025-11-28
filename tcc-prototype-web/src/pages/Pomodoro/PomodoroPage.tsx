import React, { useEffect, useRef } from 'react';
import { usePomodoroStore } from '../../state/usePomodoroStore';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

const PomodoroPage: React.FC = () => {
  const pomodoro = usePomodoroStore((s) => s.pomodoro);
  const start = usePomodoroStore((s) => s.startPomodoro);
  const pause = usePomodoroStore((s) => s.pausePomodoro);
  const resume = usePomodoroStore((s) => s.resumePomodoro);
  const tick = usePomodoroStore((s) => s.tickPomodoro);
  const complete = usePomodoroStore((s) => s.completePomodoro);
  const penalize = usePomodoroStore((s) => s.penalizeLostFocus);
  const load = usePomodoroStore((s) => s.loadFromStorage);

  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    load();
    // visibility handlers to detect lost focus duration
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else {
        if (hiddenAtRef.current) {
          const diffMs = Date.now() - hiddenAtRef.current;
          const diffSec = Math.round(diffMs / 1000);
          if (diffSec > 0) penalize(diffSec);
        }
        hiddenAtRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [load, penalize]);

  useEffect(() => {
    let timer: number | undefined;
    if (pomodoro && pomodoro.status === 'running') {
      timer = window.setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [pomodoro, tick]);

  const handleStart = () => start({ duration: 25 * 60, mode: 'focus' });

  return (
    <main>
      <h1>Pomodoro</h1>
      <section aria-live="polite">
        <div style={{ fontSize: 48, fontWeight: 700 }}>
          {pomodoro ? formatTime(pomodoro.remaining) : formatTime(25 * 60)}
        </div>
        <div>{pomodoro ? pomodoro.mode.replace('_', ' ') : 'Foco'}</div>
        <div>
          {pomodoro ? (
            pomodoro.isValid ? (
              <span>Sessão válida</span>
            ) : (
              <span>Sessão inválida: {pomodoro.invalidReason}</span>
            )
          ) : (
            <span>Sem sessão ativa</span>
          )}
        </div>
      </section>

      <div style={{ marginTop: 16 }}>
        {!pomodoro && (
          <button onClick={handleStart} aria-label="Iniciar Pomodoro">
            Iniciar
          </button>
        )}
        {pomodoro && pomodoro.status === 'running' && (
          <>
            <button onClick={pause} aria-label="Pausar Pomodoro">Pausar</button>
            <button onClick={complete} aria-label="Encerrar Pomodoro">Encerrar</button>
          </>
        )}
        {pomodoro && pomodoro.status === 'paused' && (
          <>
            <button onClick={resume} aria-label="Retomar Pomodoro">Retomar</button>
            <button onClick={complete} aria-label="Encerrar Pomodoro">Encerrar</button>
          </>
        )}
      </div>

      <div style={{ marginTop: 12 }} aria-live="polite">
        <small>
          Dicas: use teclado para navegar. Sair da aba por mais de alguns segundos pode
          invalidar a sessão.
        </small>
      </div>
    </main>
  );
};

export default PomodoroPage;
