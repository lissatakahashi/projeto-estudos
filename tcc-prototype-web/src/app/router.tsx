import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import AboutPage from '../pages/About/AboutPage';
import HomePage from '../pages/Home/HomePage';
import MetodologiaPage from '../pages/Metodologia/MetodologiaPage';
import PomodoroPage from '../pages/Pomodoro/PomodoroPage';

const Router: React.FC = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<HomePage />} />
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
