
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
import { api } from './services/api'; // Switched from storage to api
import { User } from './types';
import { Loader2 } from 'lucide-react';

const MainApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [authAgentMode, setAuthAgentMode] = useState(false);

  useEffect(() => {
    // Async check for session
    const checkUser = async () => {
        try {
            const u = await api.auth.getUser();
            if (u) {
                setUser(u);
            } else {
                setShowWelcome(true);
            }
        } catch (e) {
            console.error(e);
            setShowWelcome(true);
        } finally {
            setLoading(false);
        }
    };
    checkUser();
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
  
  const handleAuthBack = () => {
    setShowWelcome(true);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin"/></div>;

  if (!user) {
    if (showWelcome) {
       return <Welcome onEnter={handleWelcomeEnter} />;
    }
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
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:slug" element={<Resources />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
