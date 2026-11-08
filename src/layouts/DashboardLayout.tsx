import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  Users,
  Megaphone,
  BrainCircuit,
  Activity,
  History,
  FileSpreadsheet,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Sun,
  Moon,
  Calendar,
  UserCheck,
  Check,
  ArrowUpRight,
  Menu,
  X,
  User,
  LogOut
} from 'lucide-react';
import { NavPageId } from '../types/bankora.ts';
import { BankoraLogo } from '../components/BankoraLogo.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal.tsx';

interface DashboardLayoutProps {
  activePage: NavPageId;

  onSelectPage: (page: NavPageId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  userProfile: {
    name: string;
    role: string;
    department: string;
  };
  datasetRowCount: number;
  bestModelName: string;
  children: React.ReactNode;
}

interface NavItemConfig {
  id: NavPageId;
  label: string;
  section: 'Analytics' | 'Intelligence' | 'Governance';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    section: 'Analytics',
    description: 'Executive KPI summary, subscription conversion trends, and recent predictions',
    icon: LayoutDashboard
  },
  {
    id: 'explorer',
    label: 'Data Explorer',
    section: 'Analytics',
    description: 'Upload UCI CSV datasets, inspect schema health, filter records, and clean data',
    icon: Database
  },
  {
    id: 'customers',
    label: 'Customer Insights',
    section: 'Analytics',
    description: 'Interactive demographic, balance, and loan segmentation analytics',
    icon: Users
  },
  {
    id: 'campaigns',
    label: 'Campaign Analytics',
    section: 'Analytics',
    description: 'Marketing channel efficacy, contact fatigue analysis, and seasonal lift',
    icon: Megaphone
  },
  {
    id: 'predict',
    label: 'Predict Customer',
    section: 'Intelligence',
    description: 'Real-time ML customer subscription scoring and next-best marketing action',
    icon: BrainCircuit
  },
  {
    id: 'models',
    label: 'Model Performance',
    section: 'Intelligence',
    description: 'Compare 5 trained ML classifiers, ROC/PR curves, and confusion matrices',
    icon: Activity
  },
  {
    id: 'history',
    label: 'Prediction History',
    section: 'Intelligence',
    description: 'Audit log of SQLite-persisted customer predictions with export and search',
    icon: History
  },
  {
    id: 'reports',
    label: 'Reports',
    section: 'Governance',
    description: 'Generate PDF executive reports and export CSV analytics summaries',
    icon: FileSpreadsheet
  },
  {
    id: 'settings',
    label: 'Settings',
    section: 'Governance',
    description: 'Configure analyst profile, theme preferences, and dataset governance',
    icon: Settings
  },
  {
    id: 'profile',
    label: 'User Profile',
    section: 'Governance',
    description: 'Manage personal analyst identity, phone contact, and security credentials',
    icon: User
  },
  {
    id: 'about',
    label: 'About Project',
    section: 'Governance',
    description: 'Capstone methodology, system architecture, and UCI dataset specification',
    icon: Info
  }
];


export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activePage,
  onSelectPage,
  isDark,
  onToggleTheme,
  userProfile,
  datasetRowCount,
  bestModelName,
  children
}) => {
  const { user, requestLogoutConfirmation } = useAuth();
  const displayName = user?.fullName || userProfile.name;
  const displayEmail = user?.email || 'analyst@bankora.com';
  const displayRole = user ? (user.role === 'admin' ? 'Administrator' : 'Analyst') : userProfile.role;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);


  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: 'Stratified ML Pipeline Ready',
      detail: `${bestModelName || 'Gradient Boosting'} active on ${datasetRowCount.toLocaleString()} records.`,
      time: 'Just now',
      unread: true,
      targetPage: 'models' as NavPageId
    },
    {
      id: 'n2',
      title: 'Pre-Call Leakage Guard Active',
      detail: 'Call duration excluded from pre-call targeting pipeline.',
      time: '12m ago',
      unread: true,
      targetPage: 'predict' as NavPageId
    },
    {
      id: 'n3',
      title: 'High-Conversion Cohort Identified',
      detail: 'Previous campaign responders show >58% subscription rate.',
      time: '1h ago',
      unread: false,
      targetPage: 'campaigns' as NavPageId
    }
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      } else if (e.key === 'Escape') {
        setSearchFocused(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentNav = NAV_ITEMS.find(item => item.id === activePage) || NAV_ITEMS[0];
  const unreadCount = notifications.filter(n => n.unread).length;

  const filteredSearchItems = NAV_ITEMS.filter(
    item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic real-time local calendar date
  const [currentDate, setCurrentDate] = useState<string>(() =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date())
  );

  // Automatically update the date at midnight, on browser focus, or tab visibility change
  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshLocalDate = () => {
      setCurrentDate(
        new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(new Date())
      );
    };

    const scheduleMidnightUpdate = () => {
      const now = new Date();
      // Target next local calendar day at 00:00:01
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );
      const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

      midnightTimer = setTimeout(() => {
        refreshLocalDate();
        scheduleMidnightUpdate();
      }, msUntilMidnight);
    };

    scheduleMidnightUpdate();

    const handleSync = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        refreshLocalDate();
        if (midnightTimer) clearTimeout(midnightTimer);
        scheduleMidnightUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#070B19] dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Collapsible Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0B1024] transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-[264px]'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <button
            onClick={() => onSelectPage('overview')}
            className="text-left focus:outline-none group"
            title="BANKORA – Bank Marketing Intelligence"
          >
            <BankoraLogo collapsed={collapsed} />
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {(['Analytics', 'Intelligence', 'Governance'] as const).map(section => {
            const sectionItems = NAV_ITEMS.filter(i => i.section === section);
            return (
              <div key={section} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pb-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {section}
                  </div>
                )}
                {sectionItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectPage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      title={collapsed ? `${item.label} — ${item.description}` : undefined}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer relative ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/60'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-blue-500'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {isActive && !collapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90 shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom Dataset & Collapse Controls */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2 shrink-0">
          {!collapsed && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100/90 via-slate-100/60 to-blue-500/5 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-blue-600/10 border border-slate-200/80 dark:border-slate-800/90 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  ML Engine
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-1">
                {bestModelName || 'Gradient Boosting'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums flex items-center justify-between">
                <span>Dataset records</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {datasetRowCount > 0 ? datasetRowCount.toLocaleString() : 'None'}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(prev => !prev)}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'
        }`}
      >
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#070B19]/85 backdrop-blur-md flex items-center justify-between gap-4">
          {/* Left Zone: Mobile Menu + Breadcrumb Navigation */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <button
                onClick={() => onSelectPage('overview')}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:inline whitespace-nowrap"
              >
                BANKORA
              </button>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <span className="text-slate-500 dark:text-slate-400 hidden md:inline whitespace-nowrap">
                {currentNav.section}
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden md:inline">/</span>
              <span className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {currentNav.label}
              </span>
            </nav>
          </div>

          {/* Center Zone: Global Search with Quick Navigation */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                placeholder="Jump to module, model metrics, or customer predictor... (Ctrl+K)"
                className="w-full pl-9 pr-14 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 dark:text-slate-500 pointer-events-none">
                Ctrl K
              </span>
            </div>

            {searchFocused && (
              <div className="absolute left-0 right-0 mt-2 rounded-xl bg-white dark:bg-[#0F162E] border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 max-h-80 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Workspace Modules
                </div>
                {filteredSearchItems.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-slate-500 text-center">
                    No matching modules for "{searchQuery}"
                  </div>
                ) : (
                  filteredSearchItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onMouseDown={() => {
                          onSelectPage(item.id);
                          setSearchQuery('');
                          setSearchFocused(false);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.description}
                            </div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Right Zone: Current Date, Theme Toggle, Notifications, Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Current Date */}
            <div
              className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pr-0.5 sm:pr-1"
              title="Today's Local Date"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="tabular-nums whitespace-nowrap">{currentDate}</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(prev => !prev)}
                className="relative p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-[#0F162E] border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Intelligence Alerts
                    </span>
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onSelectPage(n.targetPage);
                          setNotifOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-medium text-slate-900 dark:text-white">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 tabular-nums">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {n.detail}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(prev => !prev)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {displayName
                    .split(' ')
                    .map(p => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none whitespace-nowrap">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-1 whitespace-nowrap">
                    {displayRole}
                  </span>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white dark:bg-[#0F162E] border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50">
                  <div className="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono font-bold">
                        {user?.role || 'User'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {displayEmail}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectPage('profile');
                      setProfileOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>My Profile & Credentials</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectPage('predict');
                      setProfileOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Predict Customer Lead</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectPage('settings');
                      setProfileOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account & Workspace Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectPage('about');
                      setProfileOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>About Capstone Project</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      requestLogoutConfirmation();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out of Workspace</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>

        {/* Clean Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1440px] w-full mx-auto">
          <div>
            BANKORA – Bank Marketing Intelligence · Customer Term Deposit Subscription Prediction
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onSelectPage('explorer')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              UCI Dataset
            </button>
            <span>·</span>
            <button onClick={() => onSelectPage('models')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              ML Pipeline
            </button>
            <span>·</span>
            <button onClick={() => onSelectPage('about')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Documentation
            </button>
          </div>
        </footer>
      </div>

      <LogoutConfirmModal />
    </div>
  );
};

