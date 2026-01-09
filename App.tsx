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
import { supabase } from './services/supabase';
import { User } from './types';

const MainApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [authAgentMode, setAuthAgentMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Session Hydration & Real-time Listener
    const hydrateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const u = await api.auth.getUser();
        setUser(u);
        setShowWelcome(false);
      }
      setLoading(false);
    };

    hydrateSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const u = await api.auth.getUser();
        setUser(u);
        setShowWelcome(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setShowWelcome(true);
      } else if (event === 'USER_UPDATED') {
        const u = await api.auth.getUser();
        setUser(u);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setShowWelcome(false);
  };

  const handleLogout = () => {
    api.auth.logout();
  };

  const handleWelcomeEnter = (asAgent: boolean = false) => {
    setAuthAgentMode(asAgent);
    setShowWelcome(false);
  };
  
  const handleAuthBack = () => setShowWelcome(true);

  if (loading) return null;

  const isAgent = user?.accountType === 'AGENT';

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
        <Route path="/about" element={<About />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<Resources />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/privacy" element={<Privacy />} />

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