
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Driver, DutyStatus, ELDStatus, FollowUpStatus, EmailLogEntry, SheetConfig, SyncStatus, GoogleUser, AuthUser, DriverReply } from './types';
import { INITIAL_DRIVERS } from './constants';
import { DriverTable } from './components/DriverTable';
import { StatsCard } from './components/StatsCard';
import { SheetSyncControl } from './components/SheetSyncControl';
import { Login } from './components/Login';
import { DriverReplies } from './components/DriverReplies';
import { AIAssistant } from './components/AIAssistant';
import { generateComplianceEmail, generateDriverReply } from './services/geminiService';
import { fetchSheetData, appendDriverToSheet, updateDriverInSheet } from './services/sheetService';
import { sendGmailMessage } from './services/gmailService';
import { Sidebar, SidebarBody, SidebarLink } from './components/ui/sidebar';

const buildFollowUpEmail = (driverName: string) => {
  const subject = `ELD Disconnected – Action Required`;
  const body =
    `Hi ${driverName},\n\n` +
    `Your ELD is showing as DISCONNECTED.\n` +
    `Please open the ELD app and reconnect as soon as possible.\n\n` +
    `If you need help, reply to this message.\n\n` +
    `Thanks.`;
  return { subject, body };
};
import {
  ArrowLeftRight,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Wifi,
  RefreshCcw,
  History,
  LayoutDashboard,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  LogIn,
  LogOut,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';

const BrandLogo = ({ open, onToggle, theme, onToggleTheme }: { open: boolean, onToggle: () => void, theme: 'light' | 'dark', onToggleTheme: () => void }) => (
  <div className="flex items-center justify-between gap-3 mb-8 px-2 relative">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
        <div className="absolute inset-0 rounded-full border-[1.5px] border-purple-400 opacity-60"></div>
        <div className="absolute inset-1 rounded-full border-[1px] border-purple-500 opacity-40 animate-pulse"></div>
        <svg viewBox="0 0 100 100" className="w-6 h-6 z-10">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#6b21a8', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path
            d="M35 25 L35 75 L75 75 L75 62 L48 62 L48 25 Z"
            fill="url(#logoGrad)"
            stroke="none"
          />
        </svg>
      </div>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="whitespace-nowrap"
        >
          <h1 className="text-xl font-bold tracking-tight text-white leading-none">Leader A1</h1>
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Fleet Monitor</p>
        </motion.div>
      )}
    </div>

    <div className="flex items-center gap-1">
      <button
        onClick={onToggleTheme}
        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
        title={theme === 'light' ? "Night Mode" : "Day Mode"}
      >
        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
      </button>
      <button
        onClick={onToggle}
        className="hidden md:flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
        title={open ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {open ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [driverReplies, setDriverReplies] = useState<DriverReply[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'replies' | 'ai-assistant'>('dashboard');
  const [isResetting, setIsResetting] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [eldFilter, setEldFilter] = useState<ELDStatus | 'ALL'>('ALL');
  const [dutyFilter, setDutyFilter] = useState<DutyStatus | 'ALL'>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string | 'ALL'>('ALL');
  const [boardFilter, setBoardFilter] = useState<string | 'ALL'>('ALL');

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem('google_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (Date.now() > parsed.expiry) return null;
    return parsed;
  });

  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const saved = localStorage.getItem('eld_sheet_config');
    return saved ? JSON.parse(saved) : { sheetId: '', isAutoSync: false, isLiveMode: false, isBidirectional: true };
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const autoSyncTimer = useRef<number | null>(null);

  // Apply theme and load debugging tools
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);

    // DEBUG CLI: Access via Browser Console
    (window as any).debug_env = () => {
      const clientId = (window as any).__GOOGLE_CLIENT_ID__;
      alert(
        `--- APP DEBUG ---\n` +
        `ID: ${clientId ? 'Valid' : 'MISSING'}\n` +
        `Origin: ${window.location.origin}\n` +
        `Live: ${sheetConfig.isLiveMode ? 'ON' : 'OFF'}`
      );
    };
  }, [theme, sheetConfig.isLiveMode]);

  useEffect(() => {
    localStorage.setItem('eld_sheet_config', JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  useEffect(() => {
    if (authUser) localStorage.setItem('auth_user', JSON.stringify(authUser));
    else localStorage.removeItem('auth_user');
  }, [authUser]);

  useEffect(() => {
    if (user) localStorage.setItem('google_user', JSON.stringify(user));
    else localStorage.removeItem('google_user');
  }, [user]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const data = await res.json();

        const googleUser = {
          email: data.email,
          name: data.name,
          picture: data.picture,
          accessToken: tokenResponse.access_token,
          expiry: Date.now() + 3500 * 1000
        };

        setUser(googleUser);
        setAuthUser({ email: data.email, name: data.name, picture: data.picture });
        alert("Success: Google API Connected!");
      } catch (error) {
        console.error("Failed to fetch user info", error);
        alert("Error fetching user info: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    },
    onError: (error) => {
      console.error("Google Login Failed", error);
      alert("Google Login Failed: Check Console Origins.");
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send',
  });

  const handleLogout = () => {
    setAuthUser(null);
    setUser(null);
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesName = driver.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEld = eldFilter === 'ALL' || driver.eldStatus === eldFilter;
      const matchesDuty = dutyFilter === 'ALL' || driver.dutyStatus === dutyFilter;
      const matchesCompany = companyFilter === 'ALL' || driver.company === companyFilter;
      const matchesBoard = boardFilter === 'ALL' || driver.board === boardFilter;
      return matchesName && matchesEld && matchesDuty && matchesCompany && matchesBoard;
    });
  }, [drivers, searchQuery, eldFilter, dutyFilter, companyFilter, boardFilter]);

  const stats = useMemo(() => {
    const violations = filteredDrivers.filter(d => d.eldStatus === ELDStatus.DISCONNECTED && [DutyStatus.DRIVING, DutyStatus.ON_DUTY].includes(d.dutyStatus)).length;
    return {
      total: filteredDrivers.length,
      violations,
      alertsSent: emailLogs.filter(log => filteredDrivers.some(d => d.id === log.driverId)).length,
      unreadReplies: driverReplies.filter(r => !r.isRead && filteredDrivers.some(d => d.id === r.driverId)).length
    };
  }, [filteredDrivers, emailLogs, driverReplies]);

  const processAlertLogic = useCallback(async (driver: Driver) => {
    const isDisconnected = driver.eldStatus === ELDStatus.DISCONNECTED;
    const isAtWork = [DutyStatus.DRIVING, DutyStatus.ON_DUTY, DutyStatus.OFF_DUTY, DutyStatus.SLEEPER].includes(driver.dutyStatus);

    if (isDisconnected && isAtWork && !driver.emailSent && !driver.hasPendingAlert) {
      if (driver.lastEmailTime) {
        const lastSent = new Date(driver.lastEmailTime).getTime();
        const now = new Date().getTime();
        if (now - lastSent < 60 * 60 * 1000) return;
      }
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, hasPendingAlert: true } : d));
    } else if (!isDisconnected && driver.hasPendingAlert) {
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, hasPendingAlert: false } : d));
    } else if (!isDisconnected && driver.emailSent) {
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, emailSent: false } : d));
    }
  }, []);

  const handleManualSendEmail = async (driverId: string): Promise<{ sentAt: string }> => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) throw new Error('Driver not found');

    if (driver.lastEmailTime) {
      const lastSent = new Date(driver.lastEmailTime).getTime();
      const now = new Date().getTime();
      const oneHour = 60 * 60 * 1000;
      if (now - lastSent < oneHour) {
        throw new Error("Spam protection active. Wait before sending again.");
      }
    }

    const { subject, body } = buildFollowUpEmail(driver.name);
    let sentSuccess = true;
    let sentVia: 'Simulation' | 'Gmail API' = 'Simulation';

    console.log(`Email Sending Mode: ${sheetConfig.isLiveMode ? 'LIVE' : 'SIMULATION'}`);

    if (sheetConfig.isLiveMode && user?.accessToken && user.accessToken !== 'demo_token') {
      console.log("Triggering Gmail API message to:", driver.email);
      const res = await sendGmailMessage(user.accessToken, driver.email, subject, body);
      sentSuccess = res.ok;
      sentVia = 'Gmail API';
      if (!sentSuccess) throw new Error(res.error || "Gmail API failed to send message.");
    } else {
      console.log("Simulation mode: No real email sent.");
    }

    const sentAt = new Date().toISOString();

    const logEntry: EmailLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      driverId: driver.id,
      driverName: driver.name,
      timestamp: sentAt,
      statusAtTime: driver.dutyStatus,
      content: body,
      sentVia
    };

    const updatedDriver = {
      ...driver,
      emailSent: true,
      hasPendingAlert: false,
      followUp: FollowUpStatus.ACTION_REQUIRED,
      lastEmailTime: sentAt,
      lastSentAt: sentAt
    };

    setDrivers(prev => prev.map(d => d.id === driver.id ? updatedDriver : d));
    setEmailLogs(prev => [logEntry, ...prev]);

    // Persistence to Google Sheets
    if (sheetConfig.sheetId && user?.accessToken && user.accessToken !== 'demo_token') {
      console.log("Persisting update to Google Sheets...");
      await updateDriverInSheet(sheetConfig.sheetId, updatedDriver, user.accessToken);
    }

    // Delayed reply simulation
    setTimeout(async () => {
      const replyText = await generateDriverReply(driver.name, body);
      const reply: DriverReply = {
        id: Math.random().toString(36).substr(2, 9),
        driverId: driver.id,
        driverName: driver.name,
        timestamp: new Date().toISOString(),
        message: replyText,
        isRead: false
      };
      setDriverReplies(prev => [reply, ...prev]);
    }, 5000 + Math.random() * 5000);

    return { sentAt };
  };

  const handleSync = useCallback(async () => {
    if (!sheetConfig.sheetId) return;
    setSyncStatus('syncing');
    try {
      const remoteDrivers = await fetchSheetData(sheetConfig.sheetId, user?.accessToken !== 'demo_token' ? user?.accessToken : undefined);
      setDrivers(prev => {
        const merged = [...prev];
        remoteDrivers.forEach(remote => {
          const idx = merged.findIndex(d => d.id === remote.id || d.email === remote.email);
          if (idx > -1) {
            merged[idx] = { ...merged[idx], ...remote };
          } else {
            merged.push(remote);
          }
        });
        return merged;
      });
      setSyncStatus('success');
      setSheetConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
    } catch (e) {
      setSyncStatus('error');
    }
  }, [sheetConfig.sheetId, user]);

  const handleUpdateDriver = async (id: string, updates: Partial<Driver>) => {
    setDrivers(prev => {
      const newDrivers = prev.map(d => d.id === id ? { ...d, ...updates } : d);
      const updatedDriver = newDrivers.find(d => d.id === id);

      if (updatedDriver && sheetConfig.sheetId && sheetConfig.isBidirectional && user?.accessToken && user.accessToken !== 'demo_token') {
        updateDriverInSheet(sheetConfig.sheetId, updatedDriver, user.accessToken).catch(console.error);
      }

      return newDrivers;
    });
  };

  const handleAddDriver = (data: Omit<Driver, 'id' | 'emailSent'>) => {
    const newD: Driver = { ...data, id: Math.random().toString(36).substr(2, 9), emailSent: false };
    setDrivers(prev => [...prev, newD]);
  };

  const handleDeleteDriver = (id: string) => setDrivers(prev => prev.filter(d => d.id !== id));

  const handleResetDriver = (id: string) => {
    if (window.confirm("Reset this driver to Connected/Not Set?")) {
      setDrivers(prev => prev.map(d => d.id === id ? {
        ...d,
        eldStatus: ELDStatus.CONNECTED,
        dutyStatus: DutyStatus.NOT_SET,
        followUp: FollowUpStatus.NONE,
        emailSent: false,
        hasPendingAlert: false
      } : d));
    }
  };

  const handleGlobalReset = () => {
    if (window.confirm("Reset ALL drivers to Connected status?")) {
      setDrivers(prev => prev.map(d => ({
        ...d,
        eldStatus: ELDStatus.CONNECTED,
        dutyStatus: DutyStatus.NOT_SET,
        followUp: FollowUpStatus.NONE,
        emailSent: false,
        hasPendingAlert: false
      })));
    }
  };

  const toggleTheme = () => setTheme(v => v === 'light' ? 'dark' : 'light');

  if (!authUser) return (
    <Login onLogin={(u, token) => {
      setAuthUser(u);
      if (token) {
        setUser({
          email: u.email,
          name: u.name,
          picture: u.picture || '',
          accessToken: token,
          expiry: Date.now() + 3500 * 1000
        });
        alert("Google Connected Successfully!");
      }
    }} />
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
          <div className="flex flex-col flex-1">
            <BrandLogo open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} theme={theme} onToggleTheme={toggleTheme} />
            <div className="mb-8 px-2">
              {!user ? (
                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all shadow-lg active:scale-95">
                  <LogIn className="w-4 h-4 text-indigo-600" />
                  {sidebarOpen && "Connect Google"}
                </button>
              ) : (
                <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-green-400 font-bold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> API Connect
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-1 px-1">
              <SidebarLink label="Dashboard" icon={<LayoutDashboard className="w-5 h-5" />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <SidebarLink label="AI Assistant" icon={<Sparkles className="w-5 h-5" />} active={activeTab === 'ai-assistant'} onClick={() => setActiveTab('ai-assistant')} />
              <SidebarLink label="Replies" icon={<MessageSquare className="w-5 h-5" />} active={activeTab === 'replies'} onClick={() => setActiveTab('replies')} />
              <SidebarLink label="History" icon={<TrendingUp className="w-5 h-5" />} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            </div>
            {sidebarOpen && (
              <div className="mt-8 px-2">
                <SheetSyncControl config={sheetConfig} status={syncStatus} onUpdateConfig={(u) => setSheetConfig(p => ({ ...p, ...u }))} onSyncNow={handleSync} />
              </div>
            )}
          </div>
          <div className="mt-auto px-1 pb-4">
            <SidebarLink label="Sign Out" icon={<LogOut className="w-5 h-5 text-red-400" />} onClick={handleLogout} />
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Leader Control</h2>
            <p className="text-slate-500 text-sm">Welcome back, {authUser.name}</p>
          </div>
          <button onClick={handleGlobalReset} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700">
            <Zap className="w-4 h-4" /> Reset All
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard title="Drivers" value={stats.total} icon={<ShieldCheck className="w-6 h-6 text-blue-500" />} color="bg-blue-50 dark:bg-blue-900/20" />
              <StatsCard title="Violations" value={stats.violations} icon={<AlertTriangle className="w-6 h-6 text-red-500" />} color="bg-red-50 dark:bg-red-900/20" />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <DriverTable
                drivers={drivers}
                filteredDrivers={filteredDrivers}
                filters={{ searchQuery, eldFilter, dutyFilter, companyFilter, boardFilter }}
                setFilters={{ setSearchQuery, setEldFilter, setDutyFilter, setCompanyFilter, setBoardFilter }}
                onUpdateDriver={handleUpdateDriver}
                onAddDriver={handleAddDriver}
                onDeleteDriver={handleDeleteDriver}
                onManualSendEmail={handleManualSendEmail}
                onResetDriver={handleResetDriver}
              />
            </div>
          </div>
        )}

        {activeTab === 'replies' && <DriverReplies replies={driverReplies} onMarkRead={(id) => setDriverReplies(prev => prev.map(r => r.id === id ? { ...r, isRead: true } : r))} />}
        {activeTab === 'ai-assistant' && <AIAssistant />}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {emailLogs.map(log => (
              <div key={log.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <div>
                  <p className="font-bold dark:text-white">{log.driverName}</p>
                  <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-xs text-indigo-500 font-mono">SENT VIA {log.sentVia}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
