import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import AboutPage from '../pages/About/AboutPage';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage';
import HomePage from '../pages/Home/HomePage';
import MetodologiaPage from '../pages/Metodologia/MetodologiaPage';
import PomodoroPage from '../pages/Pomodoro/PomodoroPage';

const Router: React.FC = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pomodoro" element={<PomodoroPage />} />
      <Route path="/shop" element={<div>Shop (placeholder)</div>} />
      <Route path="/inventory" element={<div>Inventory (placeholder)</div>} />
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
