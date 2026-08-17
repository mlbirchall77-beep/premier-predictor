import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Search, 
  Eye, 
  Shield, 
  Filter, 
  Download, 
  Sparkles,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { ActualOutcomes, League, PredictionCategory, UserPredictionSubmission, UserScoreBreakdown } from '../types';
import { rankAllSubmissions } from '../lib/scoring';
import { ScoreBreakdownModal } from './ScoreBreakdownModal';

interface LeaderboardProps {
  submissions: UserPredictionSubmission[];
  actualOutcomes: ActualOutcomes;
  categories: PredictionCategory[];
  leagues: League[];
  selectedLeagueId: string;
  onSelectLeague: (leagueId: string) => void;
  currentUserId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  submissions,
  actualOutcomes,
  categories,
  leagues,
  selectedLeagueId,
  onSelectLeague,
  currentUserId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeScoreBreakdown, setActiveScoreBreakdown] = useState<UserScoreBreakdown | null>(null);

  // Compute live ranked submissions
  const rankedScores = rankAllSubmissions(submissions, actualOutcomes, categories, selectedLeagueId);

  const filteredScores = rankedScores.filter(s => 
    s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeLeague = leagues.find(l => l.id === selectedLeagueId) || leagues[0];

  const exportToCsv = () => {
    const headers = ['Rank', 'Predictor Name', 'Team Name', 'Total Points', 'Table Points', 'Exact Table Count', '+/-1 Pos Count', 'Bespoke Points'];
    const rows = rankedScores.map(s => [
      s.rank,
      `"${s.userName.replace(/"/g, '""')}"`,
      `"${s.teamName.replace(/"/g, '""')}"`,
      s.totalPoints,
      s.tablePoints,
      s.exactTableCount,
      s.oneOffTableCount,
      s.bespokePoints,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `premier-predictor-standings-${activeLeague.code.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & League Filter */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Predictor Leaderboard 2026/27
                </h1>
                <p className="text-xs text-slate-400">
                  Automated points tracking against live Premier League standings and resolved awards.
                </p>
              </div>
            </div>
          </div>

          {/* League Dropdown and Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <select
                id="leaderboard-league-filter"
                value={selectedLeagueId}
                onChange={(e) => onSelectLeague(e.target.value)}
                aria-label="Filter leaderboard by league"
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-2"
              >
                {leagues.map(l => (
                  <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                    {l.name} ({l.memberCount || 1} members)
                  </option>
                ))}
              </select>
            </div>

            <button
              id="export-csv-btn"
              onClick={exportToCsv}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              title="Download Leaderboard as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Podium Highlights for Top 3 */}
        {rankedScores.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            {/* 2nd Place */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-700 relative overflow-hidden flex flex-col justify-between order-2 sm:order-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-400">#2</span>
                <span className="p-1 rounded-full bg-slate-800 text-slate-300">
                  <Medal className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <h4 className="font-bold text-sm text-white truncate">{rankedScores[1].teamName}</h4>
                <p className="text-[11px] text-slate-400 truncate">{rankedScores[1].userName}</p>
              </div>
              <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Total Score:</span>
                <span className="text-lg font-black text-purple-300">{rankedScores[1].totalPoints} pts</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/60 to-slate-950 border-2 border-amber-500/60 relative overflow-hidden shadow-lg shadow-amber-500/10 flex flex-col justify-between order-1 sm:order-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-amber-400">#1</span>
                <span className="p-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </span>
              </div>
              <div className="mt-2">
                <h4 className="font-black text-base text-white truncate">{rankedScores[0].teamName}</h4>
                <p className="text-xs text-purple-300 font-medium truncate">{rankedScores[0].userName}</p>
              </div>
              <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-purple-800/40">
                <span className="text-xs text-purple-200">Current Leader:</span>
                <span className="text-2xl font-black text-amber-400">{rankedScores[0].totalPoints} pts</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-700 relative overflow-hidden flex flex-col justify-between order-3 sm:order-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-amber-700">#3</span>
                <span className="p-1 rounded-full bg-amber-950/80 text-amber-600">
                  <Medal className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <h4 className="font-bold text-sm text-white truncate">{rankedScores[2].teamName}</h4>
                <p className="text-[11px] text-slate-400 truncate">{rankedScores[2].userName}</p>
              </div>
              <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Total Score:</span>
                <span className="text-lg font-black text-purple-300">{rankedScores[2].totalPoints} pts</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-leaderboard-input"
              type="text"
              placeholder="Search predictor or team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredScores.length}</strong> predictors
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Team & Predictor</th>
                <th className="py-3 px-3 text-center">Table Points</th>
                <th className="py-3 px-3 text-center">Exact (3pt)</th>
                <th className="py-3 px-3 text-center">±1 Pos (1pt)</th>
                <th className="py-3 px-3 text-center">Bespoke (3pt)</th>
                <th className="py-3 px-3 text-right">Total Score</th>
                <th className="py-3 px-3 text-center">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredScores.length > 0 ? (
                filteredScores.map((s) => {
                  const isCurrent = s.userId === currentUserId;

                  return (
                    <tr
                      key={s.submissionId}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-purple-950/40 border-l-4 border-l-purple-500 font-medium'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              s.rank === 1
                                ? 'bg-amber-500 text-slate-950'
                                : s.rank === 2
                                  ? 'bg-slate-300 text-slate-950'
                                  : s.rank === 3
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {s.rank}
                          </span>
                        </div>
                      </td>

                      {/* Team & User */}
                      <td className="py-3 px-3">
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            {s.teamName}
                            {isCurrent && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-bold border border-purple-500/40">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{s.userName}</div>
                        </div>
                      </td>

                      {/* Table Points */}
                      <td className="py-3 px-3 text-center font-semibold text-slate-200">
                        {s.tablePoints}
                      </td>

                      {/* Exact Count */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/50">
                          {s.exactTableCount}
                        </span>
                      </td>

                      {/* +/-1 Count */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-bold border border-amber-800/50">
                          {s.oneOffTableCount}
                        </span>
                      </td>

                      {/* Bespoke Points */}
                      <td className="py-3 px-3 text-center font-semibold text-indigo-300">
                        {s.bespokePoints} pts
                      </td>

                      {/* Total Score */}
                      <td className="py-3 px-3 text-right">
                        <span className="text-base font-black text-purple-400 font-['Outfit']">
                          {s.totalPoints} pts
                        </span>
                      </td>

                      {/* Breakdown Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          id={`btn-view-breakdown-${s.submissionId}`}
                          onClick={() => setActiveScoreBreakdown(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors"
                          title="View detailed point-by-point breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No predictors found matching "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for score breakdown */}
      <ScoreBreakdownModal
        score={activeScoreBreakdown}
        onClose={() => setActiveScoreBreakdown(null)}
      />
    </div>
  );
};
