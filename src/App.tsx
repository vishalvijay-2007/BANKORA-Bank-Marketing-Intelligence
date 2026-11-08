import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DashboardLayout } from './layouts/DashboardLayout.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { DataExplorerPage } from './pages/DataExplorerPage.tsx';
import { CustomerInsightsPage } from './pages/CustomerInsightsPage.tsx';
import { CampaignAnalyticsPage } from './pages/CampaignAnalyticsPage.tsx';
import { PredictCustomerPage } from './pages/PredictCustomerPage.tsx';
import { ModelPerformancePage } from './pages/ModelPerformancePage.tsx';
import { PredictionHistoryPage } from './pages/PredictionHistoryPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AboutProjectPage } from './pages/AboutProjectPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.tsx';
import { BankoraLogo } from './components/BankoraLogo.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { bankoraApi } from './services/api.ts';
import { NavPageId, OverviewResponse } from './types/bankora.ts';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

function BankoraApp() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const [activePage, setActivePage] = useState<NavPageId>('overview');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [resetToken, setResetToken] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  const [userProfile, setUserProfile] = useState({
    name: 'Analyst',
    role: 'Intelligence Analyst',
    department: 'Retail Banking Decision Science'
  });


  // Sync dark class on html
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  // Check URL query parameters for reset password links
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get('auth');
      const tokenParam = params.get('token');
      if (authParam === 'reset-password' && tokenParam) {
        setResetToken(tokenParam);
        setAuthView('reset-password');
      } else if (authParam === 'register') {
        setAuthView('register');
      } else if (authParam === 'forgot-password') {
        setAuthView('forgot-password');
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingOverview(true);
    try {
      const data = await bankoraApi.getOverview();
      setOverviewData(data);
    } catch {
      // Handled silently
    } finally {
      setLoadingOverview(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOverview();
      bankoraApi
        .getSettings()
        .then(settings => {
          if (settings?.profile && typeof settings.profile === 'object') {
            const p = settings.profile as { name?: string; role?: string; department?: string };
            if (p.name && p.role && p.department) {
              setUserProfile({ name: p.name, role: p.role, department: p.department });
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, fetchOverview]);

  // Sync authenticated user details to profile
  useEffect(() => {
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        name: user.fullName,
        role: user.role === 'admin' ? 'Lead ML Architect (Admin)' : 'Intelligence Analyst'
      }));
    }
  }, [user]);

  const handleRestoreDefaultDataset = async () => {
    await bankoraApi.resetDataset();
    await fetchOverview();
  };

  // 1. Initial Session Restoration Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070B19] text-white space-y-5 p-4 selection:bg-blue-600 selection:text-white">
        <BankoraLogo isDark={true} />
        <div className="flex items-center gap-2.5 text-xs text-slate-400 font-medium">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Restoring secure banking session & encryption keys...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Route to Auth Pages
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateLogin={() => setAuthView('login')}
          onRegisterSuccess={() => setActivePage('overview')}
        />
      );
    }

    if (authView === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onNavigateLogin={() => setAuthView('login')}
          onNavigateResetPasswordWithToken={(token: string) => {
            setResetToken(token);
            setAuthView('reset-password');
          }}
        />
      );
    }

    if (authView === 'reset-password') {
      return (
        <ResetPasswordPage
          initialToken={resetToken}
          onNavigateLogin={() => setAuthView('login')}
        />
      );
    }

    // Default to Login Page
    return (
      <LoginPage
        onNavigateRegister={() => setAuthView('register')}
        onNavigateForgotPassword={() => setAuthView('forgot-password')}
        onLoginSuccess={() => setActivePage('overview')}
      />
    );
  }

  // 3. Authenticated State: Protected Dashboard Workspace
  const datasetRowCount = overviewData?.kpis?.totalCustomers || 0;
  const bestModelName = overviewData?.kpis?.bestModelName || 'Gradient Boosting';

  return (
    <DashboardLayout
      activePage={activePage}
      onSelectPage={setActivePage}
      isDark={isDark}
      onToggleTheme={() => setIsDark(prev => !prev)}
      userProfile={userProfile}
      datasetRowCount={datasetRowCount}
      bestModelName={bestModelName}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {activePage === 'overview' && (
            <OverviewPage
              data={overviewData}
              loading={loadingOverview}
              onNavigate={setActivePage}
              onRestoreDefaultDataset={handleRestoreDefaultDataset}
            />
          )}

          {activePage === 'explorer' && (
            <DataExplorerPage onDatasetMutated={fetchOverview} />
          )}

          {activePage === 'customers' && <CustomerInsightsPage />}

          {activePage === 'campaigns' && (
            <CampaignAnalyticsPage onNavigate={setActivePage} />
          )}

          {activePage === 'predict' && (
            <PredictCustomerPage onPredictionCreated={fetchOverview} />
          )}

          {activePage === 'models' && <ModelPerformancePage />}

          {activePage === 'history' && (
            <PredictionHistoryPage onHistoryChanged={fetchOverview} />
          )}

          {activePage === 'reports' && <ReportsPage />}

          {activePage === 'profile' && (
            <ProfilePage
              onNavigateChangePassword={() => setAuthView('forgot-password')}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              isDark={isDark}
              onToggleTheme={() => setIsDark(prev => !prev)}
              userProfile={userProfile}
              onUpdateProfile={setUserProfile}
              onDatasetMutated={fetchOverview}
            />
          )}

          {activePage === 'about' && <AboutProjectPage />}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BankoraApp />
    </AuthProvider>
  );
}

