
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Welcome } from './pages/Welcome';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { JobsList, JobDetail } from './pages/Jobs';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { authService } from './services/authService';
import { User } from './types';
import { Loader2 } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Firebase Auth Listener
    if (!auth) { setLoading(false); setShowWelcome(true); return; }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch full profile from Firestore
        try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
                setUser(userDoc.data() as User);
            }
        } catch (e) {
            console.error("Error fetching user profile", e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setShowWelcome(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setShowWelcome(true);
  };

  const handleWelcomeEnter = () => {
    setShowWelcome(false);
  };

  const handleGoHome = () => {
    setShowWelcome(true);
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-[#F3F3F1]"><Loader2 className="w-8 h-8 animate-spin text-[#C73E1D]"/></div>;
  }

  // PRIORITY: Show Welcome Landing Page if requested, regardless of auth state.
  if (showWelcome) {
    return <Welcome onEnter={handleWelcomeEnter} isLoggedIn={!!user} />;
  }

  // Not logged in -> Show Auth
  if (!user) {
    return <Auth onLogin={handleLogin} onBack={handleGoHome} />;
  }

  // Logged in but new -> Show Onboarding
  if (!user.isOnboarded) {
    return (
      <HashRouter>
        <Onboarding
          user={user}
          onComplete={(updates) => setUser({ ...user, ...updates })}
        />
      </HashRouter>
    );
  }

  // Logged in and onboarded -> Show App
  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout} onGoHome={handleGoHome}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/jobs" element={<JobsList user={user} />} />
          <Route path="/jobs/:id" element={<JobDetail user={user} />} />
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
