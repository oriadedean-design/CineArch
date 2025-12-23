
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Welcome } from './pages/Welcome';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { JobsList, JobDetail } from './pages/Jobs';
import { Contacts } from './pages/Contacts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Resources } from './pages/Resources';
import { Finance } from './pages/Finance';
import { Privacy } from './pages/Privacy';
import { About } from './pages/About';
import { api } from './services/storage';
import { User } from './types';
import { ErrorScreen } from './components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  public render() {
    if (this.state.hasError) return <ErrorScreen error={this.state.error} reset={() => { localStorage.clear(); window.location.href = '/'; }} />;
    return this.props.children;
  }
}

const MainApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authAgentMode, setAuthAgentMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const u = api.auth.getUser();
    if (u) {
      setUser(u);
      if (location.pathname === '/' || location.pathname === '/auth') {
        const resumePath = api.auth.getResumePath();
        if (resumePath && resumePath.startsWith('/app')) navigate(resumePath);
        else navigate('/app/dashboard');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user && location.pathname.startsWith('/app')) {
      api.auth.setResumePath(location.pathname);
    }
  }, [location.pathname, user]);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app/dashboard" replace /> : <Welcome onEnter={asAgent => { setAuthAgentMode(asAgent); navigate('/auth'); }} />} />
      <Route path="/auth" element={user ? <Navigate to="/app/dashboard" replace /> : <Auth onLogin={u => { setUser(u); navigate('/app/dashboard'); }} onBack={() => navigate('/')} initialAgentMode={authAgentMode} />} />
      <Route path="/about" element={<About />} />
      <Route path="/resources/*" element={<Resources />} />

      {user ? (
        !user.isOnboarded ? (
          <Route path="*" element={<Onboarding user={user} onComplete={() => {
            const updated = api.auth.updateUser({ isOnboarded: true });
            if (updated) setUser(updated);
            navigate('/app/dashboard');
          }} />} />
        ) : (
          <Route path="/app/*" element={
            <Layout onLogout={() => { api.auth.logout(); setUser(null); navigate('/'); }}>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="jobs" element={<JobsList />} />
                <Route path="jobs/:id" element={<JobDetail />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="finance" element={<Finance />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          } />
        )
      ) : (
        <Route path="/app/*" element={<Navigate to="/auth" replace />} />
      )}
    </Routes>
  );
};

const App = () => (
  <HashRouter>
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  </HashRouter>
);

export default App;
