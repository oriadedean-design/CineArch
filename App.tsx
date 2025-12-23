
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
import { Resources } from './pages/Resources';
import { Finance } from './pages/Finance';
import { Privacy } from './pages/Privacy';
import { Management } from './pages/Management';
import { api } from './services/storage';
import { User } from './types';

const MainApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [authAgentMode, setAuthAgentMode] = useState(false);

  useEffect(() => {
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

  const handleWelcomeEnter = (asAgent: boolean = false) => {
    setAuthAgentMode(asAgent);
    setShowWelcome(false);
  };
  
  const handleAuthBack = () => setShowWelcome(true);

  if (loading) return null;

  if (!user) {
    if (showWelcome) return <Welcome onEnter={handleWelcomeEnter} />;
    return <Auth onLogin={handleLogin} onBack={handleAuthBack} initialAgentMode={authAgentMode} />;
  }

  if (!user.isOnboarded) {
    return <Onboarding user={user} onComplete={() => setUser({ ...user, isOnboarded: true })} />;
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<JobsList />} />
        <Route path="/roster" element={<Management />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<Resources />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App = () => {
  return (
    <HashRouter>
      <MainApp />
    </HashRouter>
  );
};

export default App;
