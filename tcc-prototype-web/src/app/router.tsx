import React, { useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import {
    isPomodoroProgressAtRisk,
    POMODORO_EXIT_CONFIRMATION_MESSAGE,
} from '../domain/pomodoro/usecases/pomodoroExitProtection';
import AboutPage from '../pages/About/AboutPage';
import ShopCatalogAdminPage from '../pages/Admin/ShopCatalogAdminPage';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import EnvironmentPage from '../pages/Environment/EnvironmentPage';
import HomePage from '../pages/Home/HomePage';
import InventoryPage from '../pages/Inventory/InventoryPage';
import MetodologiaPage from '../pages/Metodologia/MetodologiaPage';
import PetPage from '../pages/Pet/PetPage';
import PomodoroPage from '../pages/Pomodoro/PomodoroPage';
import ShopPage from '../pages/Shop/ShopPage';
import { usePomodoroStore } from '../state/usePomodoroStore';

const PomodoroAbandonmentRouteGuard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPathnameRef = useRef(location.pathname);

  useEffect(() => {
    const previous = previousPathnameRef.current;
    if (previous === '/pomodoro' && location.pathname !== '/pomodoro') {
      const state = usePomodoroStore.getState();
      if (isPomodoroProgressAtRisk(state.pomodoro)) {
        const confirmed = window.confirm(POMODORO_EXIT_CONFIRMATION_MESSAGE);
        if (!confirmed) {
          previousPathnameRef.current = '/pomodoro';
          navigate('/pomodoro', { replace: true });
          return;
        }

        void state.invalidateActivePomodoro('route_change');
      }
    }

    previousPathnameRef.current = location.pathname;
  }, [location.pathname, navigate]);

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
      <Route path="/admin/shop-items" element={<ShopCatalogAdminPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/environment" element={<EnvironmentPage />} />
      <Route path="/pet" element={<PetPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/history" element={<DashboardPage />} />
      <Route path="/settings" element={<div>Configurações (em breve)</div>} />
      <Route path="/privacy" element={<div>Privacidade (em breve)</div>} />
      <Route path="/terms" element={<div>Termos de uso (em breve)</div>} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/metodologia" element={<MetodologiaPage />} />
    </Routes>
  </AppShell>
);

export default Router;
