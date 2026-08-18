/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Save, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  Database
} from 'lucide-react';

import { 
  ActualOutcomes, 
  AdminSettings, 
  CurrentUser, 
  League, 
  LivePlStanding, 
  PredictionCategory, 
  SiteMetrics, 
  UserPredictionSubmission 
} from './types';
import { storage } from './lib/storage';
import { supabaseService } from './lib/supabaseService';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { fetchPremierLeagueStandings } from './lib/footballApi';
import { PREMIER_LEAGUE_TEAMS_2026_27 } from './data/teams2026';
import { calculateSubmissionScore } from './lib/scoring';

import { Header } from './components/Header';
import { TablePredictor } from './components/TablePredictor';
import { BespokePredictor } from './components/BespokePredictor';
import { Leaderboard } from './components/Leaderboard';
import { LiveStandings } from './components/LiveStandings';
import { LeaguesManager } from './components/LeaguesManager';
import { AdminConsole } from './components/AdminConsole';
import { DeploymentGuide } from './components/DeploymentGuide';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'predict' | 'leaderboard' | 'standings' | 'leagues' | 'admin' | 'guide'>('predict');
  const [predictSubTab, setPredictSubTab] = useState<'table' | 'bespoke'>('table');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('global');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // App Data State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => storage.getCurrentUser());
  const [submissions, setSubmissions] = useState<UserPredictionSubmission[]>(() => storage.getSubmissions());
  const [categories, setCategories] = useState<PredictionCategory[]>(() => storage.getCategories());
  const [actualOutcomes, setActualOutcomes] = useState<ActualOutcomes>(() => storage.getActualOutcomes());
  const [leagues, setLeagues] = useState<League[]>(() => storage.getLeagues());
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => storage.getAdminSettings());
  const [liveStandings, setLiveStandings] = useState<LivePlStanding[]>(() => storage.getLiveStandings());
  const [metrics, setMetrics] = useState<SiteMetrics>(() => storage.getMetrics());

  // User Current Draft Predictions State
  const [currentTablePrediction, setCurrentTablePrediction] = useState<string[]>(() => {
    const existing = currentUser ? storage.getUserSubmission(currentUser.id) : undefined;
    if (existing && existing.tablePrediction?.length === 20) {
      return existing.tablePrediction;
    }
    return PREMIER_LEAGUE_TEAMS_2026_27.map(t => t.id);
  });

  const [currentBespokePredictions, setCurrentBespokePredictions] = useState<Record<string, string>>(() => {
    const existing = currentUser ? storage.getUserSubmission(currentUser.id) : undefined;
    return existing?.bespokePredictions || {};
  });

  const [submitToast, setSubmitToast] = useState<string | null>(null);
  const [isSyncingApi, setIsSyncingApi] = useState(false);

  // Initial Sync from Supabase if configured
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);

  const syncFromSupabase = useCallback(async () => {
    if (!supabaseService.isConfigured()) return;
    setIsSupabaseLoading(true);
    try {
      const remoteData = await supabaseService.fetchLiveDatabase();
      if (remoteData) {
        if (Array.isArray(remoteData.submissions)) {
          storage.saveSubmissions(remoteData.submissions);
          setSubmissions(remoteData.submissions);
        }
        if (Array.isArray(remoteData.leagues)) {
          storage.saveLeagues(remoteData.leagues);
          setLeagues(remoteData.leagues);
        }
        if (remoteData.categories && remoteData.categories.length > 0) {
          storage.saveCategories(remoteData.categories);
          setCategories(remoteData.categories);
        }
        if (remoteData.actualOutcomes) {
          storage.saveActualOutcomes(remoteData.actualOutcomes);
          setActualOutcomes(remoteData.actualOutcomes);
        }
      }
    } catch (err) {
      console.warn('Initial Supabase fetch error:', err);
    } finally {
      setIsSupabaseLoading(false);
    }
  }, []);

  useEffect(() => {
    syncFromSupabase();
  }, [syncFromSupabase]);

  // Track page hit on mount
  useEffect(() => {
    storage.incrementMetric('totalHits');
    storage.incrementMetric('pageViews');
    setMetrics(storage.getMetrics());
  }, []);

  // Sync draft whenever user changes
  useEffect(() => {
    if (!currentUser) return;
    const existing = storage.getUserSubmission(currentUser.id);
    if (existing) {
      if (existing.tablePrediction?.length === 20) {
        setCurrentTablePrediction(existing.tablePrediction);
      }
      setCurrentBespokePredictions(existing.bespokePredictions || {});
    }
  }, [currentUser?.id]);

  // If no user is logged in, show dedicated Login / Registration Gateway
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={(user) => {
          storage.setCurrentUser(user);
          setCurrentUser(user);
        }}
        adminSettings={adminSettings}
      />
    );
  }

  // Current User's active submission object
  const userSubmission = submissions.find(s => s.userId === currentUser.id);
  const isSubmissionLocked = adminSettings.isPredictionsLocked || (userSubmission?.isLocked && !userSubmission?.adminOverride);

  // Compute live score for preview
  const currentDraftSubmission: UserPredictionSubmission = {
    id: userSubmission?.id || `sub_${currentUser.id}`,
    userId: currentUser.id,
    userName: currentUser.name,
    teamName: currentUser.teamName,
    email: currentUser.email,
    createdAt: userSubmission?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLocked: Boolean(isSubmissionLocked),
    tablePrediction: currentTablePrediction,
    bespokePredictions: currentBespokePredictions,
    leagueIds: userSubmission?.leagueIds || ['global'],
  };

  const userLiveScore = calculateSubmissionScore(currentDraftSubmission, actualOutcomes, categories);

  // Handlers
  const handleSavePredictions = (lockAfterSave = false) => {
    const updatedSub: UserPredictionSubmission = {
      ...currentDraftSubmission,
      userName: currentUser.name,
      teamName: currentUser.teamName,
      isLocked: lockAfterSave ? true : Boolean(userSubmission?.isLocked),
      tablePrediction: currentTablePrediction,
      bespokePredictions: currentBespokePredictions,
      updatedAt: new Date().toISOString(),
    };

    storage.saveUserSubmission(updatedSub);
    setSubmissions(storage.getSubmissions());

    if (lockAfterSave) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#eab308', '#10b981'],
      });
      setSubmitToast('🎉 Your 2026/27 Predictions are locked in and registered on the leaderboard!');
    } else {
      setSubmitToast('💾 Draft predictions saved successfully!');
    }

    setTimeout(() => setSubmitToast(null), 4000);
  };

  const handleBespokeChange = (categoryId: string, value: string) => {
    setCurrentBespokePredictions(prev => ({
      ...prev,
      [categoryId]: value,
    }));
  };

  const handleCreateLeague = (name: string, desc: string) => {
    const newL = storage.createLeague(name, desc, currentUser.id, currentUser.name);
    setLeagues(storage.getLeagues());
    setSelectedLeagueId(newL.id);
    setSubmitToast(`🎉 Mini-league "${name}" created! Share code: ${newL.code}`);
    setTimeout(() => setSubmitToast(null), 5000);
  };

  const handleJoinLeague = (code: string) => {
    const res = storage.joinLeagueByCode(code, currentUser.id);
    if (res.success && res.league) {
      setLeagues(storage.getLeagues());
      setSubmissions(storage.getSubmissions());
      setSelectedLeagueId(res.league.id);
      setSubmitToast(res.message);
    } else {
      setSubmitToast(`❌ ${res.message}`);
    }
    setTimeout(() => setSubmitToast(null), 4000);
  };

  const handleSyncApi = async () => {
    setIsSyncingApi(true);
    const result = await fetchPremierLeagueStandings(adminSettings.apiKey);
    if (result.standings) {
      storage.saveLiveStandings(result.standings);
      setLiveStandings(result.standings);
      setActualOutcomes(storage.getActualOutcomes());
    }
    setIsSyncingApi(false);
    setSubmitToast(result.message);
    setTimeout(() => setSubmitToast(null), 4000);
  };

  const handleClearDemoData = async () => {
    await storage.clearDemoData(currentUser);
    setSubmissions(storage.getSubmissions());
    setLeagues(storage.getLeagues());
    setMetrics(storage.getMetrics());
    setSubmitToast('🧹 Demo data cleared! The platform is now ready for production users.');
    setTimeout(() => setSubmitToast(null), 4000);
  };

  const handleSeedDemoData = () => {
    storage.seedDemoData();
    setSubmissions(storage.getSubmissions());
    setLeagues(storage.getLeagues());
    setCategories(storage.getCategories());
    setActualOutcomes(storage.getActualOutcomes());
    setMetrics(storage.getMetrics());
    setSubmitToast('🌱 Sample demo predictor entries reloaded.');
    setTimeout(() => setSubmitToast(null), 4000);
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Global Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isPredictionsLocked={adminSettings.isPredictionsLocked}
        selectedLeagueId={selectedLeagueId}
        onSelectLeague={setSelectedLeagueId}
        leagues={leagues}
      />

      {/* Toast Notification */}
      {submitToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border-2 border-purple-500 text-white text-xs font-semibold shadow-2xl flex items-center gap-3 animate-fade-in">
          <span>{submitToast}</span>
          <button onClick={() => setSubmitToast(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: PREDICTIONS STUDIO */}
        {activeTab === 'predict' && (
          <div className="space-y-6">
            
            {/* Top Action Bar & Score Preview Card */}
            <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-800/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                      Premier League 2026/27 Prediction Studio
                    </h1>
                    <p className="text-xs text-slate-400">
                      Predict all 20 table positions & 11 bespoke awards for <strong className="text-purple-300">{currentUser.teamName}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Live Score Pill */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">Live Score:</span>
                  <span className="text-base font-black text-amber-400 font-['Outfit']">
                    {userLiveScore.totalPoints} pts
                  </span>
                </div>

                {!isSubmissionLocked && (
                  <>
                    <button
                      id="btn-save-draft-prediction"
                      onClick={() => handleSavePredictions(false)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                    >
                      Save Draft
                    </button>
                    <button
                      id="btn-submit-lock-prediction"
                      onClick={() => handleSavePredictions(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Submit & Lock Predictions
                    </button>
                  </>
                )}

                {isSubmissionLocked && (
                  <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/60 px-3 py-2 rounded-xl border border-amber-800/60 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    Locked for Season
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Tabs: Table (1-20) vs Bespoke Questions */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                id="tab-btn-table-sub"
                onClick={() => setPredictSubTab('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  predictSubTab === 'table'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                1-20 Premier League Table (20 Positions)
              </button>

              <button
                id="tab-btn-bespoke-sub"
                onClick={() => setPredictSubTab('bespoke')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  predictSubTab === 'bespoke'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                Bespoke & Cup Predictions ({categories.length} Categories)
              </button>
            </div>

            {/* Content Views */}
            {predictSubTab === 'table' ? (
              <TablePredictor
                predictedTeamIds={currentTablePrediction}
                onChange={setCurrentTablePrediction}
                isLocked={isSubmissionLocked}
                canOverride={Boolean(currentUser.isAdmin)}
              />
            ) : (
              <BespokePredictor
                categories={categories}
                predictions={currentBespokePredictions}
                onChange={handleBespokeChange}
                isLocked={isSubmissionLocked}
                canOverride={Boolean(currentUser.isAdmin)}
              />
            )}
          </div>
        )}

        {/* TAB 2: PREDICTOR LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <Leaderboard
            submissions={submissions}
            actualOutcomes={actualOutcomes}
            categories={categories}
            leagues={leagues}
            selectedLeagueId={selectedLeagueId}
            onSelectLeague={setSelectedLeagueId}
            currentUserId={currentUser.id}
          />
        )}

        {/* TAB 3: LIVE PREMIER LEAGUE STANDINGS */}
        {activeTab === 'standings' && (
          <LiveStandings
            standings={liveStandings}
            onSync={handleSyncApi}
            isSyncing={isSyncingApi}
            myTablePrediction={currentTablePrediction}
          />
        )}

        {/* TAB 4: MINI-LEAGUES */}
        {activeTab === 'leagues' && (
          <LeaguesManager
            leagues={leagues}
            onCreateLeague={handleCreateLeague}
            onJoinLeague={handleJoinLeague}
            onSelectLeague={(lId) => {
              setSelectedLeagueId(lId);
              setActiveTab('leaderboard');
            }}
            onDeleteLeague={(lId) => {
              storage.deleteLeague(lId);
              setLeagues(storage.getLeagues());
              setSubmissions(storage.getSubmissions());
              if (selectedLeagueId === lId) {
                setSelectedLeagueId('global');
              }
              setSubmitToast('🗑️ Mini-league deleted successfully.');
              setTimeout(() => setSubmitToast(null), 3000);
            }}
            selectedLeagueId={selectedLeagueId}
            currentUser={currentUser}
            adminSettings={adminSettings}
          />
        )}

        {/* TAB 5: ADMIN CONSOLE */}
        {activeTab === 'admin' && (
          <AdminConsole
            adminSettings={adminSettings}
            onUpdateSettings={(s) => {
              storage.saveAdminSettings(s);
              setAdminSettings(s);
            }}
            categories={categories}
            onAddCategory={(c) => {
              storage.addCategory(c);
              setCategories(storage.getCategories());
            }}
            onUpdateCategory={(c) => {
              storage.updateCategory(c);
              setCategories(storage.getCategories());
            }}
            onDeleteCategory={(cId) => {
              storage.deleteCategory(cId);
              setCategories(storage.getCategories());
            }}
            actualOutcomes={actualOutcomes}
            onUpdateActualOutcomes={(ao) => {
              storage.saveActualOutcomes(ao);
              setActualOutcomes(ao);
            }}
            submissions={submissions}
            onUpdateSubmission={(sub) => {
              storage.saveUserSubmission(sub);
              setSubmissions(storage.getSubmissions());
            }}
            onDeleteSubmission={(subId) => {
              storage.deleteSubmission(subId);
              setSubmissions(storage.getSubmissions());
            }}
            onDeleteUserAndData={(userId) => {
              storage.deleteUserAndData(userId);
              setSubmissions(storage.getSubmissions());
              setLeagues(storage.getLeagues());
              setSubmitToast('🗑️ User and all their predictions removed.');
              setTimeout(() => setSubmitToast(null), 3000);
            }}
            leagues={leagues}
            onCreateLeague={handleCreateLeague}
            onDeleteLeague={(lId) => {
              storage.deleteLeague(lId);
              setLeagues(storage.getLeagues());
              setSubmissions(storage.getSubmissions());
              if (selectedLeagueId === lId) {
                setSelectedLeagueId('global');
              }
              setSubmitToast('🗑️ Mini-league deleted successfully.');
              setTimeout(() => setSubmitToast(null), 3000);
            }}
            metrics={metrics}
            currentUser={currentUser}
            onSyncApi={handleSyncApi}
            isSyncing={isSyncingApi}
            onClearDemoData={handleClearDemoData}
            onSeedDemoData={handleSeedDemoData}
            onSyncSupabase={syncFromSupabase}
          />
        )}

        {/* TAB 6: SETUP & DEPLOYMENT GUIDE */}
        {activeTab === 'guide' && (
          <DeploymentGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-['Outfit']">PREMIER PREDICTOR 2026/27</span>
            <span>•</span>
            <span>Premier League Predictions & Leaderboard Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Repository: <code className="text-purple-400">mlbirchall77-beep/premier-predictor</code></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" />
              {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Local Persistence Engine'}
            </span>
          </div>
        </div>
      </footer>

      {/* Auth / Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onSaveUser={(u) => {
          storage.setCurrentUser(u);
          setCurrentUser(u);
        }}
        adminSettings={adminSettings}
      />

    </div>
  );
}
