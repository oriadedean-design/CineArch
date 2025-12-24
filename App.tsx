import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Welcome } from './pages/Welcome';
import { OnboardingIndividual } from './pages/OnboardingIndividual';
import { OnboardingEnterprise } from './pages/OnboardingEnterprise';

// Dashboard & Functional Pages
import { DashboardIndividual } from './pages/DashboardIndividual';
import { DashboardEnterprise } from './pages/DashboardEnterprise';
import { JobsIndividual } from './pages/JobsIndividual';
import { JobsEnterprise } from './pages/JobsEnterprise';
import { SettingsIndividual } from './pages/SettingsIndividual';
import { SettingsEnterprise } from './pages/SettingsEnterprise';
import { JobDetail } from './pages/Jobs';
import { Reports } from './pages/Reports';
import { Finance } from './pages/Finance';
import { Management } from './pages/Management';

// Public Editorial Pages
import { Resources } from './pages/Resources';
import { Manual } from './pages/Manual';
import { About } from './pages/About';
import { Privacy } from './pages/Privacy';

import { api } from './services/storage';
import { User } from './types';

const MainApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [authAgentMode, setAuthAgentMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const u = api.auth.getUser();
    if (u) {
      setUser(u);
      setShowWelcome(false);
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

  const isAgent = user?.accountType === 'AGENT';

  // Wrapper for private content that requires login - children prop is marked as optional to avoid TS errors
  const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
    if (!user) {
      if (showWelcome) return <Welcome onEnter={handleWelcomeEnter} />;
      return <Auth onLogin={handleLogin} onBack={handleAuthBack} initialAgentMode={authAgentMode} />;
    }
    if (!user.isOnboarded) {
      return user.accountType === 'AGENT' 
        ? <OnboardingEnterprise user={user} onComplete={() => setUser({ ...user, isOnboarded: true })} />
        : <OnboardingIndividual user={user} onComplete={() => setUser({ ...user, isOnboarded: true })} />;
    }
    return <>{children}</>;
  };

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        {/* PUBLIC INTERFACE */}
        <Route path="/about" element={<About />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<Resources />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* AUTHENTICATED COMMAND CENTER */}
        <Route path="/" element={
          <PrivateRoute>
            {isAgent ? <DashboardEnterprise /> : <DashboardIndividual />}
          </PrivateRoute>
        } />
        
        <Route path="/jobs" element={
          <PrivateRoute>
            {isAgent ? <JobsEnterprise /> : <JobsIndividual />}
          </PrivateRoute>
        } />
        
        <Route path="/jobs/:id" element={
          <PrivateRoute>
            <JobDetail />
          </PrivateRoute>
        } />
        
        <Route path="/roster" element={
          <PrivateRoute>
            {isAgent ? <Management /> : <Navigate to="/" replace />}
          </PrivateRoute>
        } />
        
        <Route path="/settings" element={
          <PrivateRoute>
            {isAgent ? <SettingsEnterprise /> : <SettingsIndividual />}
          </PrivateRoute>
        } />
        
        <Route path="/finance" element={
          <PrivateRoute>
            <Finance />
          </PrivateRoute>
        } />
        
        <Route path="/reports" element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        } />

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