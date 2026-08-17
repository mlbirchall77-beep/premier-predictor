import React, { useState } from 'react';
import { 
  Table as TableIcon, 
  RefreshCw, 
  Sparkles, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Activity,
  Zap
} from 'lucide-react';
import { LivePlStanding } from '../types';
import { getTeamById } from '../data/teams2026';

interface LiveStandingsProps {
  standings: LivePlStanding[];
  onSync: () => Promise<void>;
  isSyncing: boolean;
  myTablePrediction: string[];
}

export const LiveStandings: React.FC<LiveStandingsProps> = ({
  standings,
  onSync,
  isSyncing,
  myTablePrediction,
}) => {
  const [compareMode, setCompareMode] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Live Premier League 2026/27 Table
                </h1>
                <p className="text-xs text-slate-400">
                  Current real-time matchday standings used for automated prediction scoring.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="toggle-compare-mode-btn"
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                compareMode 
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm' 
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              {compareMode ? 'Comparing With My Predictions' : 'Show Standard Table'}
            </button>

            <button
              id="sync-live-pl-standings-btn"
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-purple-600/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Live Table'}
            </button>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-3 w-10">Pos</th>
                <th className="py-3 px-3">Club</th>
                <th className="py-3 px-2 text-center">PL</th>
                <th className="py-3 px-2 text-center">W</th>
                <th className="py-3 px-2 text-center">D</th>
                <th className="py-3 px-2 text-center">L</th>
                <th className="py-3 px-2 text-center hidden sm:table-cell">GF</th>
                <th className="py-3 px-2 text-center hidden sm:table-cell">GA</th>
                <th className="py-3 px-2 text-center">GD</th>
                <th className="py-3 px-3 text-center font-bold text-white">PTS</th>
                <th className="py-3 px-3 text-center hidden md:table-cell">Form</th>
                {compareMode && (
                  <th className="py-3 px-3 text-right bg-purple-950/20 border-l border-purple-900/30">
                    Your Pick & Points
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {standings.map((row) => {
                const team = getTeamById(row.teamId);
                const teamName = team ? team.name : row.teamName;

                // Comparison against user prediction
                const userPredictedIndex = myTablePrediction.indexOf(row.teamId);
                const userPredictedPos = userPredictedIndex !== -1 ? userPredictedIndex + 1 : -1;
                const diff = userPredictedPos !== -1 ? Math.abs(userPredictedPos - row.position) : 99;

                let pointsEarned = 0;
                let statusLabel = '0 pts';
                let statusColor = 'bg-slate-800 text-slate-400';

                if (diff === 0) {
                  pointsEarned = 3;
                  statusLabel = 'Exact (+3 pts)';
                  statusColor = 'bg-emerald-950 text-emerald-300 border-emerald-700/50';
                } else if (diff === 1) {
                  pointsEarned = 1;
                  statusLabel = '±1 Pos (+1 pt)';
                  statusColor = 'bg-amber-950 text-amber-300 border-amber-700/50';
                }

                return (
                  <tr
                    key={row.teamId}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      row.position <= 4 
                        ? 'border-l-4 border-l-blue-500' 
                        : row.position === 5 
                          ? 'border-l-4 border-l-amber-500' 
                          : row.position === 6 
                            ? 'border-l-4 border-l-emerald-500' 
                            : row.position >= 18 
                              ? 'border-l-4 border-l-rose-500' 
                              : ''
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3 px-3">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                        row.position <= 4
                          ? 'bg-blue-900/60 text-blue-300'
                          : row.position >= 18
                            ? 'bg-rose-900/60 text-rose-300'
                            : 'text-slate-400'
                      }`}>
                        {row.position}
                      </span>
                    </td>

                    {/* Club */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-2.5 h-6 rounded-sm shrink-0 shadow-sm"
                          style={{ backgroundColor: team?.primaryColor || '#6366f1' }}
                        />
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm">{teamName}</div>
                          <div className="text-[10px] text-slate-400 hidden sm:block">{team?.stadium}</div>
                        </div>
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="py-3 px-2 text-center text-slate-300 font-medium">{row.played}</td>
                    <td className="py-3 px-2 text-center text-slate-300">{row.won}</td>
                    <td className="py-3 px-2 text-center text-slate-400">{row.drawn}</td>
                    <td className="py-3 px-2 text-center text-slate-400">{row.lost}</td>
                    <td className="py-3 px-2 text-center text-slate-400 hidden sm:table-cell">{row.goalsFor}</td>
                    <td className="py-3 px-2 text-center text-slate-400 hidden sm:table-cell">{row.goalsAgainst}</td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-300">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-black text-white font-['Outfit']">
                        {row.points}
                      </span>
                    </td>

                    {/* Form */}
                    <td className="py-3 px-3 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {row.form.map((res, fIdx) => (
                          <span
                            key={fIdx}
                            className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                              res === 'W'
                                ? 'bg-emerald-600 text-white'
                                : res === 'D'
                                  ? 'bg-slate-700 text-slate-300'
                                  : 'bg-rose-700 text-white'
                            }`}
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Comparison Column */}
                    {compareMode && (
                      <td className="py-3 px-3 text-right bg-purple-950/10 border-l border-purple-900/30">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-slate-400 text-[11px]">
                            You picked: <strong className="text-white">#{userPredictedPos}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
