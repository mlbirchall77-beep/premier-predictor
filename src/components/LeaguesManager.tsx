import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  KeyRound, 
  Copy, 
  Check, 
  ShieldCheck, 
  Globe, 
  Lock, 
  ArrowRight,
  Sparkles,
  Trash2,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { AdminSettings, CurrentUser, League } from '../types';

interface LeaguesManagerProps {
  leagues: League[];
  onCreateLeague: (name: string, description: string) => void;
  onJoinLeague: (code: string) => void;
  onSelectLeague: (leagueId: string) => void;
  onDeleteLeague?: (leagueId: string) => void;
  selectedLeagueId: string;
  currentUser: CurrentUser;
  adminSettings: AdminSettings;
}

export const LeaguesManager: React.FC<LeaguesManagerProps> = ({
  leagues,
  onCreateLeague,
  onJoinLeague,
  onSelectLeague,
  onDeleteLeague,
  selectedLeagueId,
  currentUser,
  adminSettings,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueDesc, setNewLeagueDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingLeagueId, setDeletingLeagueId] = useState<string | null>(null);

  // Check permissions: only admin can manage/create mini leagues if setting enabled
  const canCreateLeague = !adminSettings.onlyAdminCanManageLeagues || currentUser.isAdmin;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    if (!canCreateLeague) return;

    onCreateLeague(newLeagueName.trim(), newLeagueDesc.trim());
    setNewLeagueName('');
    setNewLeagueDesc('');
    setIsCreating(false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinLeague(joinCode.trim());
    setJoinCode('');
  };

  const copyLeagueCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const confirmDeleteLeague = (leagueId: string) => {
    if (onDeleteLeague) {
      onDeleteLeague(leagueId);
    }
    setDeletingLeagueId(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Prediction Mini-Leagues
                </h1>
                <p className="text-xs text-slate-400">
                  Compete in the global worldwide leaderboard or join custom private mini-leagues.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canCreateLeague ? (
              <button
                id="open-create-league-btn"
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Mini-League (Admin)
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-xl text-xs">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Mini-League Creation is Admin-Managed</span>
              </div>
            )}
          </div>
        </div>

        {/* Join League Input Form */}
        <form onSubmit={handleJoin} className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 min-w-[140px] text-xs text-slate-300 font-semibold">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <span>Join with Code:</span>
          </div>

          <input
            id="input-join-league-code"
            type="text"
            placeholder="Enter 6-digit League Code (e.g. BANTER)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={10}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono tracking-widest text-white uppercase placeholder:normal-case placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />

          <button
            id="submit-join-league-btn"
            type="submit"
            disabled={!joinCode.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            Join League
          </button>
        </form>

        {/* Create League Accordion */}
        {isCreating && canCreateLeague && (
          <form onSubmit={handleCreate} className="mt-4 p-5 rounded-xl bg-purple-950/30 border border-purple-800/60 space-y-4 animate-fade-in">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Create a New Prediction Mini-League
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">League Name *</label>
                <input
                  id="input-new-league-name"
                  type="text"
                  required
                  placeholder="e.g. Friday Night 5-a-side Kings"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <input
                  id="input-new-league-desc"
                  type="text"
                  placeholder="e.g. Weekly bragging rights & trophy"
                  value={newLeagueDesc}
                  onChange={(e) => setNewLeagueDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                id="submit-create-league-btn"
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg shadow-md"
              >
                Confirm & Generate Code
              </button>
            </div>
          </form>
        )}
      </div>

      {/* List of Available / Joined Leagues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leagues.map((league) => {
          const isSelected = selectedLeagueId === league.id;
          const isGlobal = league.id === 'global' || league.id === '00000000-0000-0000-0000-000000000001';
          const canDeleteThisLeague = Boolean(currentUser.isAdmin);

          return (
            <div
              key={league.id}
              id={`league-card-${league.id}`}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-950/40 ring-1 ring-purple-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {league.isPublic ? (
                      <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Globe className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Lock className="w-4 h-4" />
                      </span>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-white">{league.name}</h3>
                      <span className="text-[10px] text-slate-400">
                        {isGlobal ? 'Global Worldwide' : `Admin: ${league.adminName}`}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                    {league.memberCount || 1} Predictors
                  </span>
                </div>

                {league.description && (
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                    {league.description}
                  </p>
                )}

                {/* League Invite Code Box */}
                {!league.isPublic && (
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold">Invite Code</div>
                      <div className="text-sm font-mono font-black text-purple-300 tracking-wider">
                        {league.code}
                      </div>
                    </div>
                    <button
                      id={`copy-code-btn-${league.id}`}
                      type="button"
                      onClick={() => copyLeagueCode(league.code)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors"
                      title="Copy invite code to clipboard"
                    >
                      {copiedCode === league.code ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Standings + Admin Delete */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {isSelected ? (
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Active League
                  </span>
                ) : (
                  <button
                    id={`btn-select-league-${league.id}`}
                    onClick={() => onSelectLeague(league.id)}
                    className="text-xs font-semibold text-slate-300 hover:text-purple-400 flex items-center gap-1 transition-colors"
                  >
                    View Standings <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Admin Delete Action */}
                {canDeleteThisLeague && (
                  <div>
                    {deletingLeagueId === league.id ? (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        <button
                          onClick={() => confirmDeleteLeague(league.id)}
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
                        onClick={() => setDeletingLeagueId(league.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        title="Delete Mini-League (Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

