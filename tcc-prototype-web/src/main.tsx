import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Router from './app/router';
import GlobalMotivationalFeedback from './components/feedback/GlobalMotivationalFeedback';
import { ThemeModeContext } from './contexts/ThemeModeContext';
import './styles/index.css';
import { createAppTheme } from './theme';

if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then(({ default: ReactAxe }) => {
    ReactAxe(React, createRoot(document.getElementById('root')!), 1000);
  });
}

function App() {
  const [mode, setMode] = React.useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('theme') as 'light' | 'dark') || (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
      } catch {}
      return next;
    });
  };

  React.useEffect(() => {
    try {
      // Show skip-link briefly on first visit (per session) to make it discoverable.
      const seenKey = 'skipLinkShown';
      const alreadyShown = sessionStorage.getItem(seenKey);
      if (!alreadyShown) {
        document.body.classList.add('show-skip-on-load');
        // remove after 3.5s and mark as shown for this session
        const t = window.setTimeout(() => {
          document.body.classList.remove('show-skip-on-load');
          try { sessionStorage.setItem(seenKey, '1'); } catch {}
        }, 3500);
        return () => window.clearTimeout(t);
      }
    } catch (e) {
      // ignore DOM/sessionStorage errors in non-browser environments
    }
    return undefined;
  }, []);

  // keep a CSS variable with the current app bar height so the skip-link can be positioned below it
  React.useEffect(() => {
    const update = () => {
      try {
        const el = document.querySelector('.MuiAppBar-root') || document.querySelector('header');
        const h = el ? Math.ceil((el as HTMLElement).getBoundingClientRect().height) : 0;
        document.documentElement.style.setProperty('--app-bar-height', `${h}px`);
      } catch {}
    };
    update();
    window.addEventListener('resize', update);
    // also update after a short delay to catch async layout changes
    const t = window.setTimeout(update, 300);
    return () => {
      window.removeEventListener('resize', update);
      clearTimeout(t);
    };
  }, []);

  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Router />
          <GlobalMotivationalFeedback />
        </BrowserRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
