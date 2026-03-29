import React, { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import AboutPage from '../pages/About/AboutPage';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage';
import EnvironmentPage from '../pages/Environment/EnvironmentPage';
import HomePage from '../pages/Home/HomePage';
import InventoryPage from '../pages/Inventory/InventoryPage';
import MetodologiaPage from '../pages/Metodologia/MetodologiaPage';
import PomodoroPage from '../pages/Pomodoro/PomodoroPage';
import ShopPage from '../pages/Shop/ShopPage';
import { usePomodoroStore } from '../state/usePomodoroStore';

const PomodoroAbandonmentRouteGuard: React.FC = () => {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);

  useEffect(() => {
    const previous = previousPathnameRef.current;
    if (previous === '/pomodoro' && location.pathname !== '/pomodoro') {
      const state = usePomodoroStore.getState();
      const active = state.pomodoro;

      if (active && active.status !== 'finished' && active.mode === 'focus') {
        void state.invalidateActivePomodoro('route_change');
      }
    }

    previousPathnameRef.current = location.pathname;
  }, [location.pathname]);

  return null;
};

const Router: React.FC = () => (
  <AppShell>
    <PomodoroAbandonmentRouteGuard />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pomodoro" element={<PomodoroPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/environment" element={<EnvironmentPage />} />
      <Route path="/history" element={<div>History (placeholder)</div>} />
      <Route path="/settings" element={<div>Settings (placeholder)</div>} />
      <Route path="/privacy" element={<div>Privacy (placeholder)</div>} />
      <Route path="/terms" element={<div>Terms (placeholder)</div>} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/metodologia" element={<MetodologiaPage />} />
    </Routes>
  </AppShell>
);

export default Router;
