import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { api } from './services/storage';
import { supabase } from './services/supabase';
import { User } from './types';

// Critical path — loaded eagerly (needed before any route resolves)
import { Auth } from './pages/Auth';
import { Welcome } from './pages/Welcome';
import { OnboardingIndividual } from './pages/OnboardingIndividual';
import { OnboardingEnterprise } from './pages/OnboardingEnterprise';

// Route-split: each page becomes its own JS chunk, dramatically reducing
// the initial bundle from ~1MB to ~200KB for the critical path.
const DashboardIndividual = lazy(() => import('./pages/DashboardIndividual').then(m => ({ default: m.DashboardIndividual })));
const DashboardEnterprise  = lazy(() => import('./pages/DashboardEnterprise').then(m => ({ default: m.DashboardEnterprise })));
const JobsIndividual       = lazy(() => import('./pages/JobsIndividual').then(m => ({ default: m.JobsIndividual })));
const JobsEnterprise       = lazy(() => import('./pages/JobsEnterprise').then(m => ({ default: m.JobsEnterprise })));
const JobDetail            = lazy(() => import('./pages/Jobs').then(m => ({ default: m.JobDetail })));
const Finance              = lazy(() => import('./pages/Finance').then(m => ({ default: m.Finance })));
const Reports              = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Management           = lazy(() => import('./pages/Management').then(m => ({ default: m.Management })));
const SettingsIndividual   = lazy(() => import('./pages/SettingsIndividual').then(m => ({ default: m.SettingsIndividual })));
const SettingsEnterprise   = lazy(() => import('./pages/SettingsEnterprise').then(m => ({ default: m.SettingsEnterprise })));
const Resources            = lazy(() => import('./pages/Resources').then(m => ({ default: m.Resources })));
const Manual               = lazy(() => import('./pages/Manual').then(m => ({ default: m.Manual })));
const About                = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Privacy              = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));

// Thin spinner shown while a lazy chunk loads (keeps OLED black intact)
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-black">
    <div className="w-8 h-[2px] bg-accent animate-pulse" />
  </div>
);

const MainApp = () => {
  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [authAgentMode, setAuthAgentMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
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

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin        = (u: User) => { setUser(u); setShowWelcome(false); };
  const handleLogout       = () => api.auth.logout();
  const handleWelcomeEnter = (asAgent = false) => { setAuthAgentMode(asAgent); setShowWelcome(false); };
  const handleAuthBack     = () => setShowWelcome(true);

  if (loading) return <PageLoader />;

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/about"           element={<About />} />
          <Route path="/resources"       element={<Resources />} />
          <Route path="/resources/:slug" element={<Resources />} />
          <Route path="/manual"          element={<Manual />} />
          <Route path="/privacy"         element={<Privacy />} />

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
            <PrivateRoute><JobDetail /></PrivateRoute>
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
            <PrivateRoute><Finance /></PrivateRoute>
          } />

          <Route path="/reports" element={
            <PrivateRoute><Reports /></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App = () => (
  <HashRouter>
    <MainApp />
  </HashRouter>
);

export default App;
