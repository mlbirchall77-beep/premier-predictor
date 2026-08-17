import React, { useState } from 'react';
import { 
  Sliders, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  Sparkles, 
  ShieldAlert, 
  Save, 
  RefreshCw, 
  Activity,
  Award,
  Key,
  Globe,
  Database,
  Check,
  AlertTriangle,
  Flame,
  Eraser,
  UserPlus,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { 
  ActualOutcomes, 
  AdminSettings, 
  AppUserAccount,
  CurrentUser, 
  League,
  PredictionCategory, 
  SiteMetrics, 
  UserPredictionSubmission 
} from '../types';
import { storage } from '../lib/storage';

import { PREMIER_LEAGUE_TEAMS_2026_27, getTeamById } from '../data/teams2026';
import { supabaseService, DatabaseTestResult } from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface AdminConsoleProps {
  adminSettings: AdminSettings;
  onUpdateSettings: (settings: AdminSettings) => void;
  categories: PredictionCategory[];
  onAddCategory: (category: PredictionCategory) => void;
  onUpdateCategory: (category: PredictionCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  actualOutcomes: ActualOutcomes;
  onUpdateActualOutcomes: (outcomes: ActualOutcomes) => void;
  submissions: UserPredictionSubmission[];
  onUpdateSubmission: (submission: UserPredictionSubmission) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onDeleteUserAndData?: (userId: string) => void;
  leagues: League[];
  onDeleteLeague?: (leagueId: string) => void;
  onCreateLeague?: (name: string, description: string) => void;
  metrics: SiteMetrics;
  currentUser: CurrentUser;
  onSyncApi: () => Promise<void>;
  isSyncing: boolean;
  onClearDemoData: () => Promise<void>;
  onSeedDemoData: () => void;
  onSyncSupabase: () => Promise<void>;
}


export const AdminConsole: React.FC<AdminConsoleProps> = ({
  adminSettings,
  onUpdateSettings,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  actualOutcomes,
  onUpdateActualOutcomes,
  submissions,
  onUpdateSubmission,
  onDeleteSubmission,
  onDeleteUserAndData,
  leagues,
  onDeleteLeague,
  onCreateLeague,
  metrics,
  currentUser,
  onSyncApi,
  isSyncing,
  onClearDemoData,
  onSeedDemoData,
  onSyncSupabase,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'database' | 'users' | 'leagues' | 'locking' | 'security' | 'categories' | 'outcomes' | 'submissions' | 'metrics' | 'api'>('database');

  // User Accounts State (email + password login accounts)
  const [userAccounts, setUserAccounts] = useState<AppUserAccount[]>(() => storage.getUserAccounts());
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTeam, setNewUserTeam] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userSuccessMessage, setUserSuccessMessage] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Local unlock state for admin portal
  const [isUnlocked, setIsUnlocked] = useState<boolean>(
    Boolean(currentUser.isAdmin && currentUser.isAdminAuthenticated)
  );
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    const expected = adminSettings.adminPassword || 'admin';
    if (unlockPassword === expected) {
      setIsUnlocked(true);
      // Also update storage current user if applicable
      storage.setCurrentUser({
        ...currentUser,
        isAdmin: true,
        isAdminAuthenticated: true,
      });
    } else {
      setUnlockError('Incorrect administrator password. Access denied.');
    }
  };

  // Mini-league creation form inside admin
  const [adminNewLeagueName, setAdminNewLeagueName] = useState('');
  const [adminNewLeagueDesc, setAdminNewLeagueDesc] = useState('');
  const [deletingLeagueId, setDeletingLeagueId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const handleAddUserAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    setUserSuccessMessage(null);

    const emailTrimmed = newUserEmail.trim().toLowerCase();
    const nameTrimmed = newUserName.trim();
    const teamTrimmed = newUserTeam.trim() || `${nameTrimmed}'s XI`;
    const passwordTrimmed = newUserPassword.trim();

    if (!nameTrimmed || !emailTrimmed || !passwordTrimmed) {
      setUserFormError('Please fill in name, email address, and a password.');
      return;
    }

    const newAccount: AppUserAccount = {
      id: `user_${Date.now()}`,
      name: nameTrimmed,
      email: emailTrimmed,
      teamName: teamTrimmed,
      password: passwordTrimmed,
      isAdmin: newUserIsAdmin,
      createdAt: new Date().toISOString(),
      isRegisteredByAdmin: true,
    };

    storage.addOrUpdateUserAccount(newAccount);
    const updated = storage.getUserAccounts();
    setUserAccounts(updated);

    setNewUserName('');
    setNewUserEmail('');
    setNewUserTeam('');
    setNewUserPassword('');
    setNewUserIsAdmin(false);
    setUserSuccessMessage(`✅ User account for ${nameTrimmed} (${emailTrimmed}) created successfully with their password!`);
    setTimeout(() => setUserSuccessMessage(null), 4000);
  };

  const handleDeleteUserAccount = (accountId: string) => {
    storage.deleteUserAccount(accountId);
    setUserAccounts(storage.getUserAccounts());
    setDeletingAccountId(null);
    setUserSuccessMessage('🗑️ User account and credentials removed.');
    setTimeout(() => setUserSuccessMessage(null), 3000);
  };

  // Admin security settings state
  const [adminEmailInput, setAdminEmailInput] = useState(adminSettings.adminEmail || 'mlbirchall@yahoo.co.uk');
  const [adminPasswordInput, setAdminPasswordInput] = useState(adminSettings.adminPassword || 'admin');
  const [onlyAdminCanManageLeagues, setOnlyAdminCanManageLeagues] = useState(adminSettings.onlyAdminCanManageLeagues ?? true);
  const [securityNotice, setSecurityNotice] = useState(false);

  // Category addition form
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatPoints, setNewCatPoints] = useState(3);
  const [newCatOptions, setNewCatOptions] = useState('');

  // Outcome resolution state
  const [editingActuals, setEditingActuals] = useState<ActualOutcomes>({ ...actualOutcomes });
  const [saveOutcomesNotice, setSaveOutcomesNotice] = useState(false);

  // Database Diagnostic
  const [dbTestResult, setDbTestResult] = useState<DatabaseTestResult | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const handleAdminCreateLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewLeagueName.trim()) return;
    if (onCreateLeague) {
      onCreateLeague(adminNewLeagueName.trim(), adminNewLeagueDesc.trim());
    }
    setAdminNewLeagueName('');
    setAdminNewLeagueDesc('');
    setActionSuccessNotice(`Created mini-league: "${adminNewLeagueName.trim()}"`);
    setTimeout(() => setActionSuccessNotice(null), 3000);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...adminSettings,
      adminEmail: adminEmailInput.trim().toLowerCase(),
      adminPassword: adminPasswordInput.trim(),
      onlyAdminCanManageLeagues,
    });
    setSecurityNotice(true);
    setTimeout(() => setSecurityNotice(false), 3000);
  };


  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;

    const optionsList = newCatOptions
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newCategory: PredictionCategory = {
      id: `bespoke_${Date.now()}`,
      title: newCatTitle.trim(),
      description: newCatDesc.trim() || 'Custom bespoke prediction',
      type: 'custom',
      options: optionsList.length > 0 ? optionsList : undefined,
      isDefault: false,
      pointsValue: newCatPoints || 3,
    };

    onAddCategory(newCategory);
    setNewCatTitle('');
    setNewCatDesc('');
    setNewCatPoints(3);
    setNewCatOptions('');
  };

  const handleSaveOutcomes = () => {
    onUpdateActualOutcomes(editingActuals);
    setSaveOutcomesNotice(true);
    setTimeout(() => setSaveOutcomesNotice(false), 3000);
  };

  const toggleUserOverride = (sub: UserPredictionSubmission) => {
    onUpdateSubmission({
      ...sub,
      adminOverride: !sub.adminOverride,
      isLocked: !sub.isLocked,
    });
  };

  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    const result = await supabaseService.testConnectivity();
    setDbTestResult(result);
    setIsTestingDb(false);
  };

  const handleClearDemoClick = async () => {
    if (window.confirm('Are you sure you want to clear all demo predictions & leagues? This will leave a clean production slate for real users.')) {
      setIsClearingDemo(true);
      await onClearDemoData();
      setIsClearingDemo(false);
      setActionSuccessNotice('✅ Demo data cleared! The application is now in clean production mode.');
      setTimeout(() => setActionSuccessNotice(null), 4000);
    }
  };

  const handleSeedDemoClick = () => {
    onSeedDemoData();
    setActionSuccessNotice('🌱 Sample demo predictor submissions reloaded.');
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <KeyRound className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit']">
            Admin Access Required
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            This management portal controls scoring outcomes, season locking, and database records. Please enter the master administrator password to continue.
          </p>
        </div>

        <form onSubmit={handleUnlockAdmin} className="space-y-4 text-left">
          {unlockError && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{unlockError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              Master Admin Password / PIN
            </label>
            <input
              type="password"
              required
              placeholder="Enter admin password..."
              value={unlockPassword}
              onChange={(e) => {
                setUnlockPassword(e.target.value);
                setUnlockError(null);
              }}
              className="w-full bg-slate-950 border border-amber-600/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Default password is <code className="text-amber-400 font-bold">admin</code> (customizable inside Admin Settings).
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" /> Unlock Admin Console
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Admin Management Portal
                </h1>
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold border border-amber-500/40">
                  Super Admin
                </span>
                {isSupabaseConfigured ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold border border-emerald-500/40 flex items-center gap-1">
                    <Database className="w-3 h-3" /> Supabase Live
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                    Local Storage Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Manage live PostgreSQL database, global locking, bespoke categories, outcomes resolver & submissions.
              </p>
            </div>
          </div>

          {/* Quick Lock/Unlock Status Switcher */}
          <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Global Lock:</span>
            <button
              id="admin-toggle-lock-btn"
              onClick={() => onUpdateSettings({ ...adminSettings, isPredictionsLocked: !adminSettings.isPredictionsLocked })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                adminSettings.isPredictionsLocked
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {adminSettings.isPredictionsLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" /> LOCKED
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" /> OPEN FOR SUBMISSION
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === 'database'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database & Reset Demo Data
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === 'security'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Admin Security & Password
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            User Accounts & Passwords ({userAccounts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('leagues')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === 'leagues'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Mini-Leagues ({leagues.length})
          </button>
          <button
            onClick={() => setActiveSubTab('locking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'locking'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            Locking & Kickoff
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'categories'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            Bespoke Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveSubTab('outcomes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'outcomes'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            Actual Outcomes & Winners Resolver
          </button>
          <button
            onClick={() => setActiveSubTab('submissions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'submissions'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            Predictors & Overrides ({submissions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('metrics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'metrics'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            Site Analytics & Hits
          </button>
          <button
            onClick={() => setActiveSubTab('api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'api'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
            }`}
          >
            Premier League API Integration
          </button>
        </div>
      </div>

      {actionSuccessNotice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* Tab: Database & Reset Demo Data */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          {/* Main Action Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  Live PostgreSQL Database & Demo Data Controls
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your live Supabase instance and purge mock sample users to start accepting real user predictions.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-clear-demo-data"
                  onClick={handleClearDemoClick}
                  disabled={isClearingDemo}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Eraser className="w-4 h-4" />
                  {isClearingDemo ? 'Purging Demo Data...' : 'Clear Demo Data (Start Production Slate)'}
                </button>

                <button
                  id="btn-seed-demo-data"
                  onClick={handleSeedDemoClick}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Reload Sample Demo Picks
                </button>
              </div>
            </div>

            {/* Supabase Status Diagnostic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Supabase Connection State:</span>
                  {isSupabaseConfigured ? (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800">
                      VITE_SUPABASE_URL Configured
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-800">
                      Local Offline Mode (Fallback)
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  {isSupabaseConfigured 
                    ? 'All user prediction drafts, locked submissions, and league creations are continuously pushed to your Supabase PostgreSQL database.'
                    : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or Vercel settings to enable cross-device cloud persistence.'}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleTestDatabase}
                    disabled={isTestingDb}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                    {isTestingDb ? 'Testing...' : 'Test Supabase Tables'}
                  </button>

                  <button
                    onClick={onSyncSupabase}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700"
                  >
                    Force Pull Remote State
                  </button>
                </div>
              </div>

              {/* Real Active Data Counters */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">Current In-Memory & Local Rows:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Submissions:</span>
                    <div className="font-bold text-white text-base">{submissions.length}</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Categories:</span>
                    <div className="font-bold text-purple-400 text-base">{categories.length}</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Logged in as: <strong className="text-white">{currentUser.name}</strong> ({currentUser.email})
                </div>
              </div>
            </div>

            {/* Test Results Output */}
            {dbTestResult && (
              <div className={`p-4 rounded-xl border ${
                dbTestResult.connected 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                  : 'bg-amber-950/40 border-amber-800 text-amber-200'
              } text-xs space-y-3`}>
                <div className="flex items-center gap-2 font-bold">
                  {dbTestResult.connected ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  <span>{dbTestResult.message}</span>
                </div>

                {dbTestResult.connected && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-300">
                    <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                      Profiles: <strong className="text-white">{dbTestResult.tableStats.profiles}</strong>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                      Predictions: <strong className="text-white">{dbTestResult.tableStats.predictions}</strong>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                      Leagues: <strong className="text-white">{dbTestResult.tableStats.leagues}</strong>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                      Categories: <strong className="text-white">{dbTestResult.tableStats.prediction_categories}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Admin Security & Password */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              Admin Security & Access Controls
            </h2>
            <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800/80 px-2.5 py-1 rounded-full font-bold">
              Protected Account
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Set your designated administrator email, define the master password, and enforce who has rights to create and delete mini-leagues.
          </p>

          {securityNotice && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Admin security settings saved successfully!
            </div>
          )}

          <form onSubmit={handleSaveSecurity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-white">Designated Default Admin Email *</label>
                <input
                  id="admin-security-email"
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400">
                  Only this email address can unlock and use the admin management tools.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-white">Admin Master Password / PIN *</label>
                <input
                  id="admin-security-password"
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400">
                  Required when switching to or authenticating the admin account.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Restrict Mini-League Creation & Deletion to Admin Only</div>
                <div className="text-[11px] text-slate-400">
                  When enabled, general predictors cannot create bespoke mini-leagues. Only the administrator can create and delete leagues.
                </div>
              </div>
              <input
                id="toggle-only-admin-manage-leagues"
                type="checkbox"
                checked={onlyAdminCanManageLeagues}
                onChange={(e) => setOnlyAdminCanManageLeagues(e.target.checked)}
                className="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Security & Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: User Accounts & Passwords Management */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                User Accounts, Emails & Passwords Management
              </h2>
              <p className="text-xs text-slate-400">
                Register participant accounts in advance, assign emails and passwords, and manage registered credentials.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-full font-bold">
                {userAccounts.length} Registered Accounts
              </span>
            </div>
          </div>

          {userSuccessMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {userSuccessMessage}
            </div>
          )}

          {userFormError && (
            <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              {userFormError}
            </div>
          )}

          {/* Create User Account Form */}
          <form onSubmit={handleAddUserAccount} className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-4">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add New User Account with Email & Password
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">User Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Stones"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Team Name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Stones FC"
                  value={newUserTeam}
                  onChange={(e) => setNewUserTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Assigned Password / PIN *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Secret123!"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUserIsAdmin}
                  onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-300">Grant Administrator Privileges</span>
              </label>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create User & Password
              </button>
            </div>
          </form>

          {/* User Accounts List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <th className="py-2.5 px-3">Predictor Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Team Name</th>
                  <th className="py-2.5 px-3">Password / PIN</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userAccounts.map((acc) => {
                  const isVisible = Boolean(showPasswordMap[acc.id]);
                  const isMainAdmin = acc.email.toLowerCase() === (adminSettings.adminEmail || 'mlbirchall@yahoo.co.uk').toLowerCase();

                  return (
                    <tr key={acc.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-white">
                        {acc.name}
                        {acc.isRegisteredByAdmin && (
                          <span className="ml-2 text-[9px] bg-slate-800 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                            Admin Created
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {acc.email}
                      </td>
                      <td className="py-3 px-3 text-purple-300">{acc.teamName || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-amber-300 text-[11px]">
                            {isVisible ? (acc.password || 'admin') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPasswordMap(prev => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                            title={isVisible ? 'Hide password' : 'Show password'}
                          >
                            {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {acc.isAdmin || isMainAdmin ? (
                          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                            Predictor
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isMainAdmin ? (
                          deletingAccountId === acc.id ? (
                            <div className="inline-flex items-center gap-1.5 animate-fade-in">
                              <button
                                onClick={() => handleDeleteUserAccount(acc.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeletingAccountId(null)}
                                className="px-1.5 py-1 bg-slate-800 text-slate-400 hover:text-white text-[10px] rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingAccountId(acc.id)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800"
                              title="Delete user account & credentials"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-amber-400 italic">Primary Admin</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Mini-Leagues Management & Deletion */}
      {activeSubTab === 'leagues' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Mini-Leagues Management & Deletion
              </h2>
              <p className="text-xs text-slate-400">
                View all public and private mini-leagues, generate new leagues, or permanently delete unwanted leagues.
              </p>
            </div>
          </div>

          {/* Admin Create League Form */}
          <form onSubmit={handleAdminCreateLeague} className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-3">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Create New Public or Private Mini-League
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="League Name (e.g. Work Department League)"
                value={adminNewLeagueName}
                onChange={(e) => setAdminNewLeagueName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={adminNewLeagueDesc}
                onChange={(e) => setAdminNewLeagueDesc(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create League
              </button>
            </div>
          </form>

          {/* Leagues Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <th className="py-2.5 px-3">League Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Invite Code</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Members</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leagues.map((l) => {
                  const isGlobal = l.id === 'global' || l.id === '00000000-0000-0000-0000-000000000001';
                  return (
                    <tr key={l.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-white">
                        {l.name}
                        {l.description && <div className="text-[10px] text-slate-400 font-normal">{l.description}</div>}
                      </td>
                      <td className="py-3 px-3">
                        {l.isPublic ? (
                          <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-medium">
                            Public Global
                          </span>
                        ) : (
                          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-medium">
                            Private Mini
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-purple-300">
                        {l.isPublic ? 'N/A' : l.code}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{l.adminName}</td>
                      <td className="py-3 px-3 text-slate-300 font-semibold">{l.memberCount || 1}</td>
                      <td className="py-3 px-3 text-right">
                        {!isGlobal ? (
                          deletingLeagueId === l.id ? (
                            <div className="inline-flex items-center gap-1.5 animate-fade-in">
                              <button
                                onClick={() => {
                                  if (onDeleteLeague) onDeleteLeague(l.id);
                                  setDeletingLeagueId(null);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded"
                              >
                                Confirm Delete
                              </button>
                              <button
                                onClick={() => setDeletingLeagueId(null)}
                                className="px-1.5 py-1 bg-slate-800 text-slate-400 hover:text-white text-[10px] rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingLeagueId(l.id)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800"
                              title="Delete mini-league"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Default Global</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Locking & Season Kickoff */}
      {activeSubTab === 'locking' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            Season Lock & Kickoff Deadline Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-300">Lock Date & Time (ISO format)</label>
              <input
                type="datetime-local"
                value={adminSettings.lockDate.substring(0, 16)}
                onChange={(e) => onUpdateSettings({ ...adminSettings, lockDate: new Date(e.target.value).toISOString() })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-[11px] text-slate-400">
                When this deadline passes, user edits will be locked automatically unless manually overridden by you.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-300">Season Name</label>
              <input
                type="text"
                value={adminSettings.seasonName}
                onChange={(e) => onUpdateSettings({ ...adminSettings, seasonName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-[11px] text-slate-400">
                Display name across headers, export sheets and notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bespoke Categories Manager */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategorySubmit} className="bg-slate-900/90 border border-purple-800/50 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Add Bespoke Prediction Heading / Category
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Prediction Category Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lowest Scoring Premier League Team"
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Points Value</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newCatPoints}
                  onChange={(e) => setNewCatPoints(parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description / Rules</label>
              <input
                type="text"
                placeholder="e.g. Club with the least amount of goals scored after 38 games"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Predefined Options / Candidate Choices (1 per line, Optional)</label>
              <textarea
                rows={3}
                placeholder="Manchester City&#10;Arsenal&#10;Liverpool&#10;Chelsea"
                value={newCatOptions}
                onChange={(e) => setNewCatOptions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Prediction Category
              </button>
            </div>
          </form>

          {/* List of Current Categories */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 mb-4">
              Current Active Categories ({categories.length})
            </h3>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{cat.title}</span>
                      {cat.isDefault ? (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                          Default
                        </span>
                      ) : (
                        <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-medium">
                          Custom Bespoke
                        </span>
                      )}
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold">
                        {cat.pointsValue || 3} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>
                  </div>

                  {!cat.isDefault && (
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Actual Outcomes & Winners Resolver */}
      {activeSubTab === 'outcomes' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                Resolve Actual Outcomes & Award Winners
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter the confirmed winning outcome for each category to automatically trigger live scoring for all predictors.
              </p>
            </div>

            <button
              id="btn-save-actual-outcomes"
              onClick={handleSaveOutcomes}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save & Recalculate Leaderboard
            </button>
          </div>

          {saveOutcomesNotice && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Actual outcomes updated successfully! Leaderboard scores recalculated instantly.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const currentWinner = editingActuals.bespokeResults[cat.id] || '';

              return (
                <div key={cat.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">{cat.title}</label>
                    <span className="text-[10px] text-purple-300 font-bold">+{cat.pointsValue || 3} pts</span>
                  </div>

                  {cat.options && cat.options.length > 0 ? (
                    <select
                      value={currentWinner}
                      onChange={(e) => {
                        setEditingActuals({
                          ...editingActuals,
                          bespokeResults: {
                            ...editingActuals.bespokeResults,
                            [cat.id]: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Pending / Not Decided Yet --</option>
                      {cat.options.map(opt => (
                        <option key={opt} value={opt} className="bg-slate-900 text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Type confirmed winner..."
                      value={currentWinner}
                      onChange={(e) => {
                        setEditingActuals({
                          ...editingActuals,
                          bespokeResults: {
                            ...editingActuals.bespokeResults,
                            [cat.id]: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Submissions & Overrides */}
      {activeSubTab === 'submissions' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Manage Predictors & Submissions ({submissions.length})
            </h2>

            <button
              onClick={handleClearDemoClick}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Demo Predictors
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
              No predictors have submitted yet. As users register and submit their predictions, their entries will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                    <th className="py-2.5 px-3">Predictor Name</th>
                    <th className="py-2.5 px-3">Team Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Lock Status</th>
                    <th className="py-2.5 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-white">{sub.userName}</td>
                      <td className="py-3 px-3 text-purple-300">{sub.teamName}</td>
                      <td className="py-3 px-3 text-slate-400">{sub.email || 'N/A'}</td>
                      <td className="py-3 px-3">
                        {sub.isLocked ? (
                          <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-medium">
                            Locked
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-medium">
                            Editable
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => toggleUserOverride(sub)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                            sub.isLocked
                              ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          {sub.isLocked ? 'Unlock' : 'Lock'}
                        </button>

                        {deletingUserId === sub.id ? (
                          <div className="inline-flex items-center gap-1 animate-fade-in">
                            <button
                              onClick={() => {
                                if (onDeleteUserAndData) {
                                  onDeleteUserAndData(sub.userId || sub.id);
                                } else {
                                  onDeleteSubmission(sub.id);
                                }
                                setDeletingUserId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setDeletingUserId(null)}
                              className="px-1.5 py-1 bg-slate-800 text-slate-400 hover:text-white text-[10px] rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingUserId(sub.id)}
                            className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800"
                            title="Delete user & prediction"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Site Analytics & Metrics */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-2xl font-black text-purple-400 font-['Outfit']">{metrics.totalHits}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Total Hits</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-2xl font-black text-emerald-400 font-['Outfit']">{metrics.pageViews}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Page Views</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-2xl font-black text-indigo-400 font-['Outfit']">{submissions.length}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Active Predictors</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-2xl font-black text-amber-400 font-['Outfit']">{metrics.totalMiniLeagues}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Mini-Leagues Created</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: API Integration Settings */}
      {activeSubTab === 'api' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Automated Premier League API Settings
          </h2>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">football-data.org API Token (Free Tier)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your football-data.org API Key here..."
                  value={adminSettings.apiKey}
                  onChange={(e) => onUpdateSettings({ ...adminSettings, apiKey: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  type="button"
                  onClick={onSyncApi}
                  disabled={isSyncing}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Testing...' : 'Test & Sync API'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                If no external token is provided, the platform seamlessly uses the high-precision 2026/27 simulated live standings engine.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
