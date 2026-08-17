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
  Database
} from 'lucide-react';
import { 
  ActualOutcomes, 
  AdminSettings, 
  CurrentUser, 
  PredictionCategory, 
  SiteMetrics, 
  UserPredictionSubmission 
} from '../types';
import { PREMIER_LEAGUE_TEAMS_2026_27, getTeamById } from '../data/teams2026';

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
  metrics: SiteMetrics;
  currentUser: CurrentUser;
  onSyncApi: () => Promise<void>;
  isSyncing: boolean;
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
  metrics,
  currentUser,
  onSyncApi,
  isSyncing,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'locking' | 'categories' | 'outcomes' | 'submissions' | 'metrics' | 'api'>('locking');

  // Category addition form
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatPoints, setNewCatPoints] = useState(3);
  const [newCatOptions, setNewCatOptions] = useState('');

  // Outcome resolution state
  const [editingActuals, setEditingActuals] = useState<ActualOutcomes>({ ...actualOutcomes });
  const [saveOutcomesNotice, setSaveOutcomesNotice] = useState(false);

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
              </div>
              <p className="text-xs text-slate-400">
                Manage global lock status, bespoke categories, outcomes resolver, user submissions & site metrics.
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
                Enter the official winning outcome for each category to automatically trigger live scoring for all predictors.
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
                      placeholder="Type official winner..."
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
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Manage Predictors & Submissions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <th className="py-2.5 px-3">Predictor Name</th>
                  <th className="py-2.5 px-3">Team Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Lock Status</th>
                  <th className="py-2.5 px-3 text-right">Admin Override</th>
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
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => toggleUserOverride(sub)}
                        className={`text-xs px-3 py-1 rounded-lg font-semibold border transition-colors ${
                          sub.isLocked
                            ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {sub.isLocked ? 'Unlock for User' : 'Lock User'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <div className="text-2xl font-black text-indigo-400 font-['Outfit']">{metrics.uniquePredictors}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Active Predictors</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-2xl font-black text-amber-400 font-['Outfit']">{metrics.totalMiniLeagues}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Mini-Leagues Created</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Popular Champions Predictions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3">Popular Title Winner Picks (%)</h3>
              <div className="space-y-2">
                {Object.entries(metrics.popularChampions).map(([club, pct]) => (
                  <div key={club}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-semibold">{club}</span>
                      <span className="text-purple-300 font-bold">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Golden Boot */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3">Popular Golden Boot Picks (%)</h3>
              <div className="space-y-2">
                {Object.entries(metrics.popularGoldenBoot).map(([player, pct]) => (
                  <div key={player}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-semibold">{player}</span>
                      <span className="text-amber-300 font-bold">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
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
