
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Welcome } from './pages/Welcome';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { JobsList, JobDetail } from './pages/Jobs';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { api } from './services/storage';
import { User } from './types';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check for existing session
    const u = api.auth.getUser();
    if (u) {
      setUser(u);
    } else {
      setShowWelcome(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setShowWelcome(false);
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setShowWelcome(true);
  };

  const handleWelcomeEnter = () => {
    setShowWelcome(false);
  };

  if (loading) return null;

  // New State: Show Welcome Landing Page if not logged in and not explicitly dismissed
  if (!user && showWelcome) {
    return <Welcome onEnter={handleWelcomeEnter} />;
  }

  // Not logged in, and passed welcome screen -> Show Auth
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Logged in but new -> Show Onboarding
  if (!user.isOnboarded) {
    return (
      <HashRouter>
        <Onboarding user={user} onComplete={() => setUser({ ...user, isOnboarded: true })} />
      </HashRouter>
    );
  }

  // Logged in and onboarded -> Show App
  return (
    <HashRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
