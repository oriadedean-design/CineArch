
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
import { Agency } from './pages/Agency';
import { api } from './services/api'; 
import { Loader2 } from 'lucide-react';

const MainApp = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
        try {
            const s = await api.auth.getSession();
            if (s) {
                setSession(s);
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

  const handleLogin = (user: any) => {
    setSession(user); // Mock for now, usually session object
    setShowWelcome(false);
    window.location.reload(); // Force api context refresh
  };

  const handleLogout = () => {
    api.auth.logout();
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin"/></div>;

  if (!session) {
    if (showWelcome) {
       return <Welcome onEnter={() => setShowWelcome(false)} />;
    }
    return <Auth onLogin={handleLogin} onBack={() => setShowWelcome(true)} />;
  }

  // Simplified Onboarding Check logic would go here, 
  // checking if user has any org memberships yet.

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<JobsList />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/agency" element={<Agency />} />
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
